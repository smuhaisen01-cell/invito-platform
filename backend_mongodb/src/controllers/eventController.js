const fs = require("fs");
const csv = require("csv-parser");
const xlsx = require("xlsx");
const stream = require("stream");
const Contact = require("../models/Contact");
const Event = require("../models/Event");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const QRCode = require("qrcode");
const { createEventTemplate } = require("../services/whatsappService");
const User = require("../models/User");

async function insertInBatches(model, docs, batchSize = 500) {
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize);
    try {
      await model.insertMany(batch, { ordered: false });
    } catch (err) {
      console.error("Error inserting batch:", err);
    }
  }
}

function formatPhoneNumber(number) {
  return number ? String(number).replace(/\D/g, "") : "";
}

function checkRequiredFields(headers, emailSent, whatsappSent) {
  const lowerHeaders = headers.map((h) => h && h.toLowerCase());
  console.log(lowerHeaders);

  if (!lowerHeaders.includes("name")) {
    throw new Error('CSV/Excel file must contain a "name" column.');
  }

  const missingFields = [];
  if (emailSent && !lowerHeaders.includes("email")) {
    missingFields.push("email");
  }
  if (
    whatsappSent &&
    !lowerHeaders.includes("number") &&
    !lowerHeaders.includes("phone")
  ) {
    missingFields.push("number or phone");
  }

  if (missingFields.length > 0) {
    const fieldList = missingFields.join(" and ");
    throw new Error(
      `CSV/Excel file must contain ${fieldList} column(s) based on your notification settings.`
    );
  }

  return lowerHeaders;
}

async function validateCSVFile(file, emailSent, whatsappSent) {
  return new Promise((resolve, reject) => {
    const results = [];
    const bufferStream = new stream.PassThrough();
    bufferStream.end(file);
    let headersChecked = false;
    let headers = [];

    bufferStream
      .pipe(csv({ mapHeaders: ({ header }) => header && header.toLowerCase() }))
      .on("headers", (headerRow) => {
        try {
          headers = checkRequiredFields(headerRow, emailSent, whatsappSent);
          headersChecked = true;
        } catch (err) {
          reject(err);
        }
      })
      .on("data", (data) => {
        const missingFields = [];
        if (!data.name || data.name.trim() === "") {
          missingFields.push("name");
        }
        if (emailSent && (!data.email || data.email.trim() === "")) {
          missingFields.push("email");
        }
        if (whatsappSent && !data.number && !data.phone) {
          missingFields.push("phone number");
        }
        if (missingFields.length > 0) {
          const fieldList = missingFields.join(" and ");
          reject(new Error(`All rows must have valid ${fieldList}.`));
        }
        results.push(data);
      })
      .on("end", () => {
        if (!headersChecked) {
          reject(new Error("CSV headers could not be validated."));
        }
        if (results.length === 0) {
          reject(new Error("CSV file must contain at least one data row."));
        }
        resolve({ headers, data: results });
      })
      .on("error", (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      });
  });
}

async function validateExcelFile(file, emailSent, whatsappSent) {
  try {
    const workbook = xlsx.read(file, { type: "buffer" });
    if (!workbook.SheetNames.length) {
      throw new Error("Excel file must contain at least one sheet.");
    }
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    if (rows.length < 2) {
      throw new Error(
        "Excel file must contain at least one header row and one data row."
      );
    }
    const [headerRow, ...dataRows] = rows;
    const headers = checkRequiredFields(headerRow, emailSent, whatsappSent);
    const lowerHeaders = headers.map((h) => h && h.toLowerCase());
    const validatedData = [];

    for (let i = 0; i < dataRows.length; i++) {
      const rowArr = dataRows[i];
      const row = {};
      lowerHeaders.forEach((key, idx) => {
        row[key] = rowArr[idx];
      });
      const missingFields = [];
      if (!row.name || String(row.name).trim() === "") {
        missingFields.push("name");
      }
      if (emailSent && (!row.email || String(row.email).trim() === "")) {
        missingFields.push("email");
      }
      if (whatsappSent && !row.number && !row.phone) {
        missingFields.push("phone number");
      }
      if (missingFields.length > 0) {
        const fieldList = missingFields.join(" and ");
        throw new Error(`Row ${i + 2}: All rows must have valid ${fieldList}.`);
      }
      validatedData.push(row);
    }
    if (validatedData.length === 0) {
      throw new Error("Excel file must contain at least one valid data row.");
    }
    return { headers: lowerHeaders, data: validatedData };
  } catch (error) {
    throw new Error(`Excel validation error: ${error.message}`);
  }
}

async function validateContactsFile(
  file,
  originalName,
  emailSent,
  whatsappSent
) {
  const ext = originalName.split(".").pop().toLowerCase();
  if (!["csv", "xlsx", "xls"].includes(ext)) {
    throw new Error("Only CSV, XLSX, and XLS files are supported.");
  }
  if (ext === "csv") {
    return await validateCSVFile(file, emailSent, whatsappSent);
  } else if (ext === "xlsx" || ext === "xls") {
    return await validateExcelFile(file, emailSent, whatsappSent);
  }
}

async function processValidatedContacts(
  validatedData,
  parentId,
  eventId,
  emailSent,
  whatsappSent,
  date
) {
  const { headers, data } = validatedData;

  const contacts = data.map((row) => ({
    parentId,
    eventId,
    name: row.name,
    number: formatPhoneNumber(row.number || row.phone),
    email: row.email,
    date: date ? new Date(date) : undefined,
    emailSent,
    whatsappSent,
  }));

  if (contacts.length) {
    await insertInBatches(Contact, contacts, 1000);
    await Event.updateOne(
      { _id: eventId },
      { $inc: { attendance: contacts.length } }
    );
  }

  return contacts.length;
}

exports.createEvent = async (req, res) => {
  try {
        const decodeId = req.user._id;

    const {
      parentId,
      title,
      description,
      footerText,
      eventDateTime,
      scheduleTime,
      location,
      emailSent,
      whatsappSent,
    } = req.body;

    const emailSentBool = emailSent === true || emailSent === "true";
    const whatsappSentBool = whatsappSent === true || whatsappSent === "true";

    if (
      !parentId ||
      !title ||
      !scheduleTime ||
      !eventDateTime ||
      emailSent === undefined ||
      whatsappSent === undefined ||
      !location
    ) {
      return res.status(400).json({
        success: false,
        message:
          "parentId, title, scheduleTime, eventDateTime, emailSent, whatsappSent, and location are required.",
      });
    }

    // ✅ Convert eventDateTime to Date type before saving
    const parsedEventDateTime = new Date(eventDateTime);
    if (isNaN(parsedEventDateTime.getTime())) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid eventDateTime format. Must be a valid ISO date string.",
      });
    }

    const imageFile = req.files["image"]?.[0];
    const file = req.files["file"]?.[0];

    if (!imageFile || !imageFile.filename) {
      return res.status(400).json({
        success: false,
        message: "Image is required. Please upload a valid image.",
      });
    }

    let validatedFileData = null;
    if (file?.path) {
      try {
        const fileBuffer = fs.readFileSync(file.path);
        validatedFileData = await validateContactsFile(
          fileBuffer,
          file.originalname,
          emailSentBool,
          whatsappSentBool
        );
        console.log(
          `File validation successful: ${validatedFileData.data.length} contacts found`
        );
      } catch (validationError) {
        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        return res.status(400).json({
          success: false,
          message: "File validation failed",
          error: validationError.message,
        });
      }
    }

    const baseUrl = process.env.BACKEND_URL;
    const imageUrl = `${baseUrl}/uploads/images/${imageFile.filename}`;

    const event = new Event({
      parentId,
      title,
      description,
      footerText,
      scheduleTime,
      location,
      eventDateTime: parsedEventDateTime, // ✅ Store as Date
      emailSent: emailSentBool,
      whatsappSent: whatsappSentBool,
    });
    const user = await User.findByIdAndUpdate(
  decodeId,
   { $inc: { EventTrial: -1 } },
  { new: true }   // returns updated document
);
    await event.save();
    // await user.save();

    res.status(201).json({
      success: true,
      message: "Event created successfully",
      event,
    });

    if (whatsappSentBool) {
      try {
        const template = await createEventTemplate({
          imageFile,
          headerText: title,
          description,
          footerText,
        });
        event.whatsapp = {
          templateId: template.templateId,
          templateName: template.templateName,
          status: template.status,
          mediaId: template.mediaId,
          imageUrl,
        };
        await event.save();
      } catch (err) {
        console.error("Failed to create WhatsApp template:", err);
      }
    }

    if (validatedFileData) {
      try {
        const contactsCount = await processValidatedContacts(
          validatedFileData,
          parentId,
          event._id,
          emailSentBool,
          whatsappSentBool,
          scheduleTime
        );

        if (file.path && fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }

        console.log(
          `Successfully processed ${contactsCount} contacts for event ${event._id}`
        );
      } catch (processingError) {
        console.error(
          "Failed to process contacts after event creation:",
          processingError
        );
        return res.status(500).json({
          success: false,
          message: "Event created but failed to process contacts",
          error: processingError.message,
          event,
        });
      }
    }
  } catch (error) {
    console.error("Event creation error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

exports.getEvents = async (req, res) => {
  try {
      console.log("getEvents called with params:", req.params);
      console.log("getEvents - User from auth:", req.user.email);

    const events = await Event.find({
      parentId: req.user.parentId ? req.user.parentId : req.user._id,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    console.log("Backend Debug - Found events:", events.length);

    res.status(200).json({ success: true, events });
  } catch (error) {
    console.error("Event fetching error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
      error: error.message,
    });
  }
};

exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findOne({ _id: req.params.id, isDeleted: false });
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }
    res.status(200).json({ success: true, event });
  } catch (error) {
    console.error("Event fetching error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch event",
      error: error.message,
    });
  }
};

exports.getAllEvent = async (req, res) => {
  try {
    const events = await Event.find();
    if (!events || events.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No events found" });
    }
    res.status(200).json({ success: true, events });
  } catch (error) {
    console.error("Event fetching error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch events",
      error: error.message,
    });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() },
      { new: true }
    );
    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }
    res.status(200).json({ success: true, event });
  } catch (error) {
    console.error("Event deletion error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete event",
      error: error.message,
    });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { scheduleTime, eventDateTime, location, emailSent, whatsappSent } =
      req.body;
    const event = await Event.findOne({ _id: req.params.id, isDeleted: false });

    if (!event) {
      return res
        .status(404)
        .json({ success: false, message: "Event not found" });
    }

    if (event.status === "scheduled") {
      if (scheduleTime) event.scheduleTime = scheduleTime;
      if (eventDateTime) event.eventDateTime = eventDateTime;
      if (location) event.location = location;
      if (emailSent !== undefined) event.emailSent = emailSent;
      if (whatsappSent !== undefined) event.whatsappSent = whatsappSent;

      await event.save();
      return res.status(200).json({ success: true, event });
    } else {
      return res.status(400).json({
        success: false,
        message: "Updates are allowed for scheduled events only.",
      });
    }
  } catch (error) {
    console.error("Event updating error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update event",
      error: error.message,
    });
  }
};

// Format date for storage (YYYY-MM-DD)
const formatDate = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}`;
};

// Format date for chart (DD MMM)
const formatChartDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
  });
};

const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getDateRange = (start, end) => {
  const dates = [];
  const current = normalizeDate(start);
  const last = normalizeDate(end);

  while (current.getTime() <= last.getTime()) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
};

exports.getEventStats = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { channel = "All" } = req.query;

    if (!mongoose.Types.ObjectId.isValid(eventId))
      return res.status(400).json({ error: "Invalid Event ID" });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: "Event not found" });

    // Build channel match
    const matchStage = { eventId: new mongoose.Types.ObjectId(eventId) };
    if (channel === "Email") matchStage.email = { $exists: true };
    if (channel === "WhatsApp") matchStage.number = { $exists: true };

    // Aggregation with facet
    const agg = await Contact.aggregate([
      { $match: matchStage },
      {
        $project: {
          invitedDate: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          rsvpDate: {
            $cond: [
              {
                $ifNull: [
                  { $ifNull: ["$isEmailApprovedAt", "$isWhatsappApprovedAt"] },
                  false,
                ],
              },
              {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: {
                    $ifNull: ["$isEmailApprovedAt", "$isWhatsappApprovedAt"],
                  },
                },
              },
              null,
            ],
          },
          scannedDate: {
            $cond: [
              {
                $ifNull: [
                  { $ifNull: ["$markEmailScannedAt", "$markWhatsappScannedAt"] },
                  false,
                ],
              },
              {
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: {
                    $ifNull: ["$markEmailScannedAt", "$markWhatsappScannedAt"],
                  },
                },
              },
              null,
            ],
          },
          email: 1,
          number: 1,
          isEmailApproved: 1,
          isWhatsappApproved: 1,
          markEmailScanned: 1,
          markWhatScanned: 1,
        },
      },
      {
        $facet: {
          invited: [
            {
              $group: {
                _id: "$invitedDate",
                invited: { $sum: 1 },
                totalSentEmail: {
                  $sum: { $cond: [{ $ifNull: ["$email", false] }, 1, 0] },
                },
                totalSentWhatsapp: {
                  $sum: { $cond: [{ $ifNull: ["$number", false] }, 1, 0] },
                },
              },
            },
          ],
          rsvp: [
            { $match: { rsvpDate: { $ne: null } } },
            {
              $group: {
                _id: "$rsvpDate",
                rsvpAccepted: { $sum: 1 },
                totalAcceptEmail: {
                  $sum: { $cond: ["$isEmailApproved", 1, 0] },
                },
                totalAcceptWhatsapp: {
                  $sum: { $cond: ["$isWhatsappApproved", 1, 0] },
                },
              },
            },
          ],
          scanned: [
            { $match: { scannedDate: { $ne: null } } },
            {
              $group: {
                _id: "$scannedDate",
                attendees: { $sum: 1 },
                totalScannedEmail: {
                  $sum: { $cond: ["$markEmailScanned", 1, 0] },
                },
                totalScannedWhatsapp: {
                  $sum: { $cond: ["$markWhatScanned", 1, 0] },
                },
              },
            },
          ],
        },
      },
    ]);

    const { invited, rsvp, scanned } = agg[0];

    // Collect all unique dates from invited/rsvp/scanned
    const allActivityDates = [
      ...invited.map((d) => d._id),
      ...rsvp.map((d) => d._id),
      ...scanned.map((d) => d._id),
    ];

    // Find min/max
    let minDate = event.scheduleTime;
    let maxDate = event.eventDateTime;

    if (allActivityDates.length > 0) {
      const parsed = allActivityDates.map((d) => new Date(d));
      const minAgg = new Date(Math.min(...parsed));
      const maxAgg = new Date(Math.max(...parsed));
      if (minAgg < new Date(minDate)) minDate = minAgg;
      if (maxAgg > new Date(maxDate)) maxDate = maxAgg;
    }

    // Prepare dailyStats with all dates
    const allDates = getDateRange(minDate, maxDate);
    const dailyStats = {};
    allDates.forEach((d) => {
      dailyStats[d] = { invited: 0, rsvpAccepted: 0, attendees: 0 };
    });

    // Totals accumulator
    let totals = {
      totalSentEmail: 0,
      totalSentWhatsapp: 0,
      totalAcceptEmail: 0,
      totalAcceptWhatsapp: 0,
      totalScannedEmail: 0,
      totalScannedWhatsapp: 0,
    };

    // Merge invited data
    invited.forEach((doc) => {
      if (dailyStats[doc._id]) {
        dailyStats[doc._id].invited = doc.invited;
      }
      totals.totalSentEmail += doc.totalSentEmail || 0;
      totals.totalSentWhatsapp += doc.totalSentWhatsapp || 0;
    });

    // Merge rsvp data
    rsvp.forEach((doc) => {
      if (dailyStats[doc._id]) {
        dailyStats[doc._id].rsvpAccepted = doc.rsvpAccepted;
      }
      totals.totalAcceptEmail += doc.totalAcceptEmail || 0;
      totals.totalAcceptWhatsapp += doc.totalAcceptWhatsapp || 0;
    });

    // Merge scanned data
    scanned.forEach((doc) => {
      if (dailyStats[doc._id]) {
        dailyStats[doc._id].attendees = doc.attendees;
      }
      totals.totalScannedEmail += doc.totalScannedEmail || 0;
      totals.totalScannedWhatsapp += doc.totalScannedWhatsapp || 0;
    });

    // Card summary
    let invitedSum = Object.values(dailyStats).reduce(
      (sum, d) => sum + d.invited,
      0
    );
    let rsvpAcceptedSum = Object.values(dailyStats).reduce(
      (sum, d) => sum + d.rsvpAccepted,
      0
    );
    let scannedSum = Object.values(dailyStats).reduce(
      (sum, d) => sum + d.attendees,
      0
    );

    if (channel === "Email") {
      invitedSum = totals.totalSentEmail;
      rsvpAcceptedSum = totals.totalAcceptEmail;
      scannedSum = totals.totalScannedEmail;
    } else if (channel === "WhatsApp") {
      invitedSum = totals.totalSentWhatsapp;
      rsvpAcceptedSum = totals.totalAcceptWhatsapp;
      scannedSum = totals.totalScannedWhatsapp;
    }

    // Chart arrays
    const chartDateNew = allDates.map((d) => formatChartDate(new Date(d)));
    const chartInvited = allDates.map((d) => dailyStats[d].invited);
    const chartRSVP = allDates.map((d) => dailyStats[d].rsvpAccepted);
    const chartAttendees = allDates.map((d) => dailyStats[d].attendees);

    res.json({
      ...totals,
      invited: invitedSum,
      rsvpAccepted: rsvpAcceptedSum,
      scanned: scannedSum,
      chartDateNew,
      chartInvited,
      chartRSVP,
      chartAttendees,
      chartDate: chartDateNew,
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to get event stats" });
  }
};

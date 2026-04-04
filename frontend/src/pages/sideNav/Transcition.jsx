import React, { useEffect, useState } from "react";
import Datatable from "../../components/Datatable/Datatable";
import { getAllPaymentHistory } from "../../services/auth";
import { BiSolidDownload } from "react-icons/bi";
import jsPDF from "jspdf"; // Import jsPDF
import { Card } from "react-bootstrap";

const Transaction = () => {
  const [TableData, setData] = useState([]);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false); // Loading state for PDF generation

  useEffect(() => {
    const getPaym = async () => {
      try {
        const data = await getAllPaymentHistory();
        console.log("Fetched TableData:", data);

        // ✅ Format data before setting in state
        const formattedData = data.map((row) => ({
          ...row,
          // Convert date to Saudi timezone
          date: row.date
            ? new Date(row.date).toLocaleString("en-SA", {
                timeZone: "Asia/Riyadh",
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "N/A",
          // Divide amount by 100
          amount: row.amount ? (row.amount / 100).toFixed(2) : "0.00",
        }));

        setData(formattedData);
      } catch (error) {
        console.error("Error fetching payment history:", error);
      }
    };
    getPaym();
  }, []);

  // Improved UI version: Section-wise, with itemized table and total

  const generateReceiptPDF = async (row) => {
    try {
      if (!row || !row.paymentId) {
        alert("Invalid payment data. Cannot generate invoice.");
        return;
      }
      setIsGeneratingPDF(true);

      const doc = new jsPDF();

      // ===== HEADER =====
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(40, 40, 90);
      doc.text("Invito", 20, 20);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Powered by nexplat.sa", 20, 27);

      // Company Contact (Top Right)
      doc.setFontSize(10);
      doc.text("info@nexplat.sa", 150, 20);
      doc.text("+966 50 315 1125", 150, 26);
      doc.text("Riyadh, Saudi Arabia", 150, 32);

      // ===== INVOICE TITLE =====
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 90);
      doc.text("INVOICE", 20, 45);

      // ===== INVOICE DETAILS SECTION =====
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`Invoice ID:`, 20, 60);
      doc.text(`${row.paymentId || "N/A"}`, 60, 60);
      doc.text(`Date:`, 20, 68);
      doc.text(`${row.date || "N/A"}`, 60, 68);
      doc.text(`Invoice Type:`, 20, 76);
      doc.text(`Invito Subscription`, 60, 76);

      // ===== BILLING INFO SECTION =====
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(40, 40, 90);
      doc.text("Billing Information", 20, 92);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Account Email:`, 20, 102);
      doc.text(`${row.parentEmail || "N/A"}`, 60, 102);
      doc.text(`Seat:`, 20, 110);
      doc.text(`${row.seat || "N/A"}`, 60, 110);

      // ===== ITEMIZED TABLE SECTION =====
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(40, 40, 90);
      doc.text("Invoice Items", 20, 126);

      // Table headers
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text("Description", 20, 136);
      doc.text("Qty", 110, 136);
      doc.text("Unit Price", 130, 136);
      doc.text("Amount", 170, 136);

      // Table row (for subscription)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.text("Invito Subscription", 20, 146);
      doc.text(`${row.seat || 1}`, 112, 146);
      doc.text(`SAR ${row.amount || "0.00"}`, 130, 146);
      doc.text(`SAR ${row.amount || "0.00"}`, 170, 146);

      // Draw table lines
      doc.setDrawColor(180);
      doc.line(20, 139, 190, 139); // header bottom
      doc.line(20, 149, 190, 149); // row bottom

      // ===== TOTAL SECTION =====
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 90);
      doc.text("Total", 130, 160);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`SAR ${row.amount || "0.00"}`, 170, 160);

      // ===== FOOTER =====
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Thank you for choosing Invito Event Marketing Platform.", 20, 270);
      doc.text("This is a system-generated invoice.", 20, 277);
      doc.text("© Invito - Powered by nexplat.sa", 20, 284);

      // Save file
      doc.save(`invoice_${row.paymentId || "unknown"}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate invoice. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };
  

  const columns = [
    { key: "date", label: "Date" },
    { key: "amount", label: "Amount (SAR)" },
    { key: "seat", label: "Seat" },
    { key: "paymentId", label: "Payment Id" },
    {
      key: "receipt",
      label: "Receipt",
      render: (row) => (
        <button
          className="btn btn-receipt"
          onClick={() => {
            console.log("Button clicked for row:", row);
            generateReceiptPDF(row);
          }}
          disabled={isGeneratingPDF}
        >
          <BiSolidDownload className="icon" />
          <span className="btn-text">
            {isGeneratingPDF ? "Generating..." : "Download"}
          </span>
        </button>
      ),
    },
  ];

  return (
    <>
    <Card>

      <Datatable
        columns={columns}
        TableData={TableData}
        headingDataOnTable="Payment History"
        pagination={true}
        isSearchBar={true}
        />
        </Card>
    </>
  );
};

export default Transaction;

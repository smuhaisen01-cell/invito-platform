import axios from "axios";
import { getLoadingSetter } from "./loadingHelper";
import { toast } from "react-toastify";

const API_BASE_URL = import.meta.env.VITE_MAIN_URL;

let setLoading = null;
export const injectLoadingSetter = (setter) => {
  setLoading = setter;
};

axios.interceptors.request.use(
  (config) => {
    if (setLoading) setLoading(true);
    return config;
  },
  (error) => {
    if (setLoading) setLoading(false);
    return Promise.reject(error);
  }
);
axios.interceptors.response.use(
  (response) => {
    if (setLoading) setLoading(false);
    return response;
  },
  (error) => {
    if (setLoading) setLoading(false);
    return Promise.reject(error);
  }
);

// Add Event
export const createEvent = async (formData) => {
  const token = localStorage.getItem("authToken");
  return axios.post(`${API_BASE_URL}/event/add`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

// Event Listing
export const getEventsByUserId = async (parentId) => {
  try {
    const token = localStorage.getItem("authToken");

    const res = await axios.get(`${API_BASE_URL}/event/list/${parentId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.data.success) {
      return res.data.events;
    } else {
      throw new Error(res?.data?.message || "Failed to fetch events");
    }
  } catch (error) {
    console.error("Error fetching events:", error);
    toast.error(error?.response?.data?.message || "Failed to fetch events.");
    throw error?.response?.data || { success: false, message: "Unknown error" };
  }
};

// Get Event (with stats + contacts)
export const getEventById = async (id) => {
  const token = localStorage.getItem("authToken");
  try {
    const res = await axios.get(`${API_BASE_URL}/event/get/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.data?.success) {
      return {
        event: res.data.event || null,
      };
    } else {
      throw new Error(res?.data?.message || "Failed to fetch event");
    }
  } catch (error) {
    console.error("Error fetching event by ID:", error);
    throw error?.response?.data || { success: false, message: "Unknown error" };
  }
};

// Update Event
export const updateEventById = async (id, data, token) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/event/update/${id}`,
      data,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (err) {
    console.error("Error updating event:", err);
    throw err;
  }
};

// Delete Event
export const deleteEventById = async (_id) => {
  const setLoading = getLoadingSetter();
  try {
    if (setLoading) setLoading(true);
    const token = localStorage.getItem("authToken");
    if (!token) {
      throw new Error("No auth token found");
    }
    const response = await fetch(`${API_BASE_URL}/event/delete/${_id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Failed to delete event");
    }
    return result;
  } catch (error) {
    console.error("Error deleting event:", error.message);
    throw error;
  } finally {
    if (setLoading) setLoading(false);
  }
};

export const getAllUserEvents = async () => {
  try {
    const token = localStorage.getItem("authToken");
    let userId = localStorage.getItem("userId");
    
    // Fallback: try to get userId from user object
    if (!userId) {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          userId = user.userId || user.id;
        } catch (e) {
          console.error("Error parsing user from localStorage:", e);
        }
      }
    }
    
    console.log("API Debug - Token:", token ? "Present" : "Missing");
    console.log("API Debug - User ID:", userId);
    console.log("API Debug - User object:", localStorage.getItem("user"));
    
    if (!userId) throw new Error("User ID not found");
    if (!token) throw new Error("Auth token not found");

    console.log("API Debug - Making request to:", `${API_BASE_URL}/event/list/${userId}`);
    
    const res = await axios.get(`${API_BASE_URL}/event/list/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log("API Debug - Response:", res.data);

    if (res.data?.success) return res.data.events || [];
    throw new Error(res?.data?.message || "Failed to fetch events");
  } catch (error) {
    console.error("getAllUserEvents error:", error);
    throw error?.response?.data || { success: false, message: error.message || "Unknown error" };
  }
};

// ✅ Get stats for one event
export const getEventStats = async (_id, channel = "All") => {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) throw new Error("Auth token not found");

    const res = await axios.get(`${API_BASE_URL}/event/stats/${_id}`, {
      params: { channel },
      headers: { Authorization: `Bearer ${token}` },
    });

    return res.data;
  } catch (error) {
    console.error("Error fetching event stats:", error);
    throw error?.response?.data || { success: false, message: error.message };
  }
};

export const exportEventContacts = async (eventId) => {
  try {
    console.log("Exporting contacts for event ID:", eventId);
    const token = localStorage.getItem("authToken");
    if (!token) throw new Error("Auth token not found");

    const res = await axios.get(`${API_BASE_URL}/event/exportAllContactOfEventId/${eventId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Export response:", res.data);

    return res.data;
  } catch (error) {
    console.error("Error exporting event contacts:", error);
    throw error?.response?.data || { success: false, message: error.message };
  }
}

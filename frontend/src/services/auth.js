import axios from "axios";
import { getLoadingSetter } from "./loadingHelper";
import { toast } from "react-toastify";

const API_BASE_URL = import.meta.env.VITE_MAIN_URL ;

const getSessionToken = () => localStorage.getItem("authToken");

export const createAccount = async (userData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/account/create`, userData);
    return response.data; 
  } catch (error) {
    if (error.response?.status === 409) {
      throw new Error("An account with this email already exists.");
    } else if (error.response?.data?.errors) {
      // Handle validation errors
      const errorMessages = error.response.data.errors.map(err => err.message).join(', ');
      throw new Error(errorMessages);
    } else {
      throw new Error(error.response?.data?.message || "Signup failed. Please try agai.");
    }
  }
};

export const verifyEmail = async (token) => {
  const response = await axios.post(
    `${API_BASE_URL}/auth/user/verify`,
    { token }
  );
  return response.data;
};

export const loginUser = async (email, password) => {
  try {
    console.log("Logging in with email:", email,password);
    const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
    if(response.status === 200) {
    return response.data;
    }
  } catch (err) {
    if (err.response?.status === 403) {
      toast.error(err.response?.data?.message || "Your email is not verified. Please verify your email before logging in.");
      throw new Error(err.response?.data?.message || "Your email is not verified. Please verify your email before logging in.");
    } else if (err.response?.status === 401) {
      toast.error(err.response?.data?.message || "Invalid email or password.");
      throw new Error(err.response?.data?.message || "Invalid email or password.");
    } else {
      toast.error(err.response?.data?.message || "Login failed. Please try again.");
      throw new Error(err.response?.data?.message || "Login failed. Please try again.");
    }
  }
};

// Google Login
// export const googleSignup = async (email, token) => {
//   try {
//     const response = await axios.post(`${API_BASE_URL}/auth/googlesignup`, {
//       email,
//       token,
//     });
//     return response.data;
//   } catch (err) {
//     throw err.response?.data?.message || "Google signup failed. Please try again.";
//   }
// };

export const googleSignup = async (email, token) => {
  const setLoading = getLoadingSetter();
  try {
    if (setLoading) setLoading(true);
    const response = await fetch(`${API_BASE_URL}/auth/googlesignup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token }),
    });
    const data = await response.json();
    if (!response.ok) {
      toast.error(data.message || "Google signup failed. Please try again.");
      throw new Error(data.message || "Google signup failed");

    }
    return data;
  } finally {
    if (setLoading) setLoading(false);
  }
};


export const requestPasswordReset = async (email) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/password/reset/request`, {
      email,
    });
    
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Unable to send reset link. Please try again.");
    throw error.response?.data?.message || "Unable to send reset link. Please try again.";
  }
};

export const resetPassword = async ({ token, password }) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/password/reset`, {
      token,
      password,
    });
    return response.data;
  } catch (error) {
    toast.error(error?.response?.data?.message || "Password reset failed.");
    throw new Error(error?.response?.data?.message || "Password reset failed.");
  }
};

export const sendInvite = async ({ formData }) => {
  try {
    
    const token = getSessionToken();
    console.log("Sending invite with formData:", JSON.stringify(formData));
    const response = await axios.post(
      `${API_BASE_URL}/user/sendInvite`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log("Invite sent:", response.data);
    return response.data;
  } catch (error) {
    console.error("Invite Error:", error.response?.data || error.message);
    const message =
      error.response?.data?.message || error.message || "Failed to send invite.";
    toast.error(message);
    throw new Error(message);
  }
};

export const resetpassword = async({password,token,parentid,navigate})=>{
  try {
    
    const response  =  await axios.post(`${API_BASE_URL}/user/setNewPassword`,{password,token,parentid});
    console.log((JSON.stringify(response)));
    if (response.status===200) {
      navigate('/')
      return response.data;
    }
    
  } catch (error) {
    console.error(error?.response?.data || error.message || error);
    toast.error(error?.response?.data?.message || error.message || "Failed to reset password.");
  }
}

export const getAllUsers = async()=>{
  try {
    const token = getSessionToken();
    const response  =  await axios.post(`${API_BASE_URL}/user/getAllUser`,{},{
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
    if (response.status===200) {
      // Optionally, you can handle navigation here if needed
      // navigate('/')?
      return response.data.users;
    }
    
  } catch (error) {
    console.error(error?.response?.data || error.message || error);
    toast.error(error?.response?.data?.message || error.message || "Failed to fetch users.");
  }
}

export const getUser = async () => {
  try {
    const token = getSessionToken();
    const response = await axios.get(`${API_BASE_URL}/user/getUser`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.user;
  } catch (error) {
    console.error("Error fetching user:", error);
    toast.error(error?.response?.data?.message || "Failed to fetch user data.");
    throw error;
  }
};
export const cancelSubscribe = async () => {
  try {
    const token = getSessionToken();
    const response = await axios.get(`${API_BASE_URL}/user/callcellSubscribe`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching user:", error);
    toast.error(error?.response?.data?.message || "Failed to fetch user data.");
    throw error;
  }
};
export const getAllPlan = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/plan/getAllPlan`);
    return response.data.plan;
  } catch (error) {
    console.error("Error fetching user:", error);
    toast.error(error?.response?.data?.message || "Failed to fetch user data.");
    throw error;
  }
};

export const getAllPaymentHistory = async () => {
  try {
    const token = getSessionToken();
    const response = await axios.get(`${API_BASE_URL}/payments/getAllPayment`,{
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data.data;
    
  } catch (error) {
    console.error("Error fetching user:", error);
    toast.error(error?.response?.data?.message || "Failed to fetch user data.");
    throw error;
  }
};

export const countTotalUsers = async () => {
  try {
    const users = await getAllUsers();
    const totalUsers = Array.isArray(users) ? users.length : 0;
    console.log(`[countTotalUsers] Found ${totalUsers} users in the current workspace account`);
    return totalUsers;
  } catch (error) {
    console.error('[countTotalUsers] Error counting total users:', error.message);
    return 1; // Default to 1 in case of error to avoid zero amount
  }
};

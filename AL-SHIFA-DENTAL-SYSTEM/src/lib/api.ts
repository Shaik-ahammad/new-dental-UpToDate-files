import axios from "axios";

// ==============================================================================
// 1. CORE CONFIGURATION
// ==============================================================================
const API_URL = "http://localhost:8000"; 

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Auto-attach JWT Token
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response Interceptor: Handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Optional: Redirect to login if token expires
      // window.location.href = "/auth/patient/login";
    }
    return Promise.reject(error);
  }
);

// ==============================================================================
// 2. AUTHENTICATION API
// ==============================================================================
export const AuthAPI = {
  login: async (email, password) => {
    const formData = new FormData();
    formData.append("username", email);
    formData.append("password", password);
    
    return api.post("/auth/login", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });
  },
  
  register: async (userData) => {
    return api.post("/auth/register", userData);
  },

  // FIX: This must match the Backend Router (@auth_router.get("/me"))
  // Old Value: "/users/me" -> New Value: "/auth/me"
  getMe: async () => api.get("/auth/me") 
};

// ==============================================================================
// 3. AI AGENT API
// ==============================================================================
export const AgentAPI = {
  sendMessage: async (query: string, context: any = {}, role: string = "patient") => {
    const response = await api.post("/agent/execute", {
      user_query: query,
      role: role,
      context: context,
      agent_type: null 
    });
    return response.data;
  },

  bookSlot: async (slotId: string, patientId: string) => {
    const response = await api.post("/agent/execute", {
      agent_type: "appointment",
      intent: "book",
      slot_id: slotId,
      patient_id: patientId,
      user_query: "Confirm booking"
    });
    return response.data;
  },

  askDoctorAssistant: async (query: string) => {
    const response = await api.post("/agent/execute", {
      agent_type: "router",
      role: "doctor",
      user_query: query
    });
    return response.data;
  }
};

// ==============================================================================
// 4. DOCTOR DASHBOARD API
// ==============================================================================
export const DoctorAPI = {
  getDashboardStats: async () => api.get("/doctor/dashboard"),
  getPatients: async () => api.get("/doctor/patients"),
  updateConfig: async (config: {
    slot_duration: number;
    break_duration: number;
    work_start: string;
    work_end: string;
  }) => {
    return api.put("/doctor/config", config);
  },
  getInventoryMemory: async () => api.get("/agent/memory/inventory")
};

export default api;
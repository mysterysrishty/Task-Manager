import api from "./api";

const taskService = {
  getDashboard: async () => {
    const response = await api.get("/dashboard");
    return response.data;
  },

  getTasks: async (params = {}) => {
    const response = await api.get("/tasks", { params });
    return response.data;
  },

  createTask: async (payload) => {
    const response = await api.post("/tasks", payload);
    return response.data;
  },

  updateTask: async (taskId, payload) => {
    const response = await api.patch(`/tasks/${taskId}`, payload);
    return response.data;
  },

  deleteTask: async (taskId) => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },
};

export default taskService;

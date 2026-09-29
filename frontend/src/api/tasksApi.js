import apiClient from './axiosClient.js';

export const tasksApi = {
  list: (params = {}) => apiClient.get('/tasks', { params }),
  create: (payload) => apiClient.post('/tasks', payload),
  update: (taskId, payload) => apiClient.patch(`/tasks/${taskId}`, payload),
};

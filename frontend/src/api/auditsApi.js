import apiClient from './axiosClient.js';

export const auditsApi = {
  list: (params = {}) => apiClient.get('/audits', { params }),
  getById: (auditId) => apiClient.get(`/audits/${auditId}`),
  create: (payload) => {
    const form = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') form.append(key, value);
    });
    return apiClient.post('/audits', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  analyze: (auditId) => apiClient.post(`/audits/${auditId}/analyze`),
};

import apiClient from './axiosClient.js';

export const storesApi = {
  list: (params = {}) => apiClient.get('/stores', { params }),
  create: (payload) => apiClient.post('/stores', payload),
  getById: (storeId) => apiClient.get(`/stores/${storeId}`),
  update: (storeId, payload) => apiClient.patch(`/stores/${storeId}`, payload),
  delete: (storeId) => apiClient.delete(`/stores/${storeId}`),
};

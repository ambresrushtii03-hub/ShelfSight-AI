import apiClient from './axiosClient.js';

export const shelvesApi = {
  list: (storeId) => apiClient.get(`/stores/${storeId}/shelves`),
  create: (storeId, payload) => apiClient.post(`/stores/${storeId}/shelves`, payload),
};

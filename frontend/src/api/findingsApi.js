import apiClient from './axiosClient.js';

export const findingsApi = {
  list: (params = {}) => apiClient.get('/findings', { params }),
  review: (findingId, payload) => apiClient.patch(`/findings/${findingId}/review`, payload),
};

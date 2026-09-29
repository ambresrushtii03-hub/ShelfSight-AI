import apiClient from './axiosClient.js';

export const analyticsApi = {
  summary: () => apiClient.get('/dashboard/summary'),
  auditTrend: (days = 30) => apiClient.get('/analytics/audit-trends', { params: { days } }),
  issueDistribution: () => apiClient.get('/analytics/issue-distribution'),
  storePerformance: () => apiClient.get('/analytics/store-performance'),
  taskSummary: () => apiClient.get('/analytics/task-summary'),
};

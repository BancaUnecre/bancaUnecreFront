import api from './api';

export const terminalDispositivosService = {
  getAll: (params?: any) => api.get('/terminal-dispositivos', { params }),
  getById: (id: number) => api.get(`/terminal-dispositivos/${id}`),
  create: (data: any) => api.post('/terminal-dispositivos', data),
  update: (id: number, data: any) => api.put(`/terminal-dispositivos/${id}`, data),
  delete: (id: number) => api.delete(`/terminal-dispositivos/${id}`)
};

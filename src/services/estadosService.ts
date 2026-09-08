import api from './api';
import type { Estado } from '../types';

const BASE = '/cat-estados';

export const estadosService = {
  getAll: () => api.get<Estado[]>(BASE),
  getById: (id: number) => api.get<Estado>(`${BASE}/${id}`),
  create: (data: Omit<Estado, 'id'>) => api.post<Estado>(BASE, data),
  update: (id: number, data: Partial<Estado>) => api.put<Estado>(`${BASE}/${id}`, data),
  delete: (id: number) => api.delete(`${BASE}/${id}`),
};

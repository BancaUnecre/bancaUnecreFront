import api from './api';
import type { Ocupacion } from '../types';

const BASE = '/cat-ocupaciones';

export const ocupacionesService = {
  getAll: () => api.get<Ocupacion[]>(BASE),
  getById: (id: number) => api.get<Ocupacion>(`${BASE}/${id}`),
  create: (data: Omit<Ocupacion, 'id'>) => api.post<Ocupacion>(BASE, data),
  update: (id: number, data: Partial<Ocupacion>) => api.put<Ocupacion>(`${BASE}/${id}`, data),
  delete: (id: number) => api.delete(`${BASE}/${id}`),
};

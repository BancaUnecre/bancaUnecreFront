import api from './api';
import type { NivelRiesgo } from '../types';

const BASE = '/cat-nivel-riesgo';

export const nivelRiesgoService = {
  getAll: () => api.get<NivelRiesgo[]>(BASE),
  getById: (id: number) => api.get<NivelRiesgo>(`${BASE}/${id}`),
  create: (data: Omit<NivelRiesgo, 'id'>) => api.post<NivelRiesgo>(BASE, data),
  update: (id: number, data: Partial<NivelRiesgo>) => api.put<NivelRiesgo>(`${BASE}/${id}`, data),
  delete: (id: number) => api.delete(`${BASE}/${id}`),
};

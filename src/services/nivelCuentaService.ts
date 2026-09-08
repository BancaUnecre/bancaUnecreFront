import api from './api';
import type { NivelCuenta } from '../types';

const BASE = '/cat-nivel-cuenta';

export const nivelCuentaService = {
  getAll: () => api.get<NivelCuenta[]>(BASE),
  getById: (id: number) => api.get<NivelCuenta>(`${BASE}/${id}`),
  create: (data: Omit<NivelCuenta, 'id'>) => api.post<NivelCuenta>(BASE, data),
  update: (id: number, data: Partial<NivelCuenta>) => api.put<NivelCuenta>(`${BASE}/${id}`, data),
  delete: (id: number) => api.delete(`${BASE}/${id}`),
};

import api from './api';
import type { TipoIdentificacion } from '../types';

const BASE = '/cat-tipo-identificacion';

export const tipoIdentificacionService = {
  getAll: () => api.get<TipoIdentificacion[]>(BASE),
  getById: (id: number) => api.get<TipoIdentificacion>(`${BASE}/${id}`),
  create: (data: Omit<TipoIdentificacion, 'id'>) => api.post<TipoIdentificacion>(BASE, data),
  update: (id: number, data: Partial<TipoIdentificacion>) => api.put<TipoIdentificacion>(`${BASE}/${id}`, data),
  delete: (id: number) => api.delete(`${BASE}/${id}`),
};

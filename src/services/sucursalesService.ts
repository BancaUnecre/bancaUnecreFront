import api from './api';
import type { Sucursal } from '../types';

const BASE = '/sucursales';

export interface SucursalesListParams {
  page?: number;
  limit?: number;
}

export interface PaginatedSucursales {
  data: Sucursal[];
  total: number;
  page: number;
}

export const sucursalesService = {
  getAll: (params?: SucursalesListParams) =>
    api.get<PaginatedSucursales>(BASE, { params }),
  getById: (id: number) => api.get<Sucursal>(`${BASE}/${id}`),
  create: (data: Omit<Sucursal, 'id' | 'estado_nombre'>) =>
    api.post<Sucursal>(BASE, data),
  update: (id: number, data: Partial<Omit<Sucursal, 'id' | 'estado_nombre'>>) =>
    api.put<Sucursal>(`${BASE}/${id}`, data),
  delete: (id: number) => api.delete(`${BASE}/${id}`),
};

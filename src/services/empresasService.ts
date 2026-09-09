import api from './api';
import type { Empresa } from '../types';

const BASE = '/empresas';

export interface EmpresasListParams {
  page?: number;
  limit?: number;
  buscar?: string;
  estatus?: 'activas' | 'inactivas' | 'todas';
}

export interface PaginatedEmpresas {
  data: Empresa[];
  total: number;
  page: number;
}

export const empresasService = {
  getAll: (params?: EmpresasListParams) =>
    api.get<PaginatedEmpresas>(BASE, { params }),
  getById: (id: number) => api.get<Empresa>(`${BASE}/${id}`),
  create: (data: Omit<Empresa, 'id' | 'fecha_alta' | 'fecha_modificacion'>) =>
    api.post<Empresa>(BASE, data),
  update: (id: number, data: Partial<Empresa>) =>
    api.put<Empresa>(`${BASE}/${id}`, data),
  delete: (id: number) => api.delete(`${BASE}/${id}`),
};

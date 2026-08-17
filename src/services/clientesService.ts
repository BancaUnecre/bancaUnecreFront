import api from './api';
import type { Cliente } from '../types';

const BASE = '/clientes';

export interface ClientesListParams {
  page?: number;
  limit?: number;
  buscar?: string;
}

export interface PaginatedClientes {
  data: Cliente[];
  total: number;
  page: number;
}

export const clientesService = {
  getAll: (params?: ClientesListParams) =>
    api.get<PaginatedClientes>(BASE, { params }),
  getById: (id: number) => api.get<Cliente>(`${BASE}/${id}`),
  create: (data: Omit<Cliente, 'id' | 'fecha_alta'>) => api.post<Cliente>(BASE, data),
  update: (id: number, data: Partial<Cliente>) => api.put<Cliente>(`${BASE}/${id}`, data),
  delete: (id: number, motivo?: string) => api.delete(`${BASE}/${id}`, { data: motivo ? { motivo } : undefined }),
};

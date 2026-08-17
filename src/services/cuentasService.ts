import api from './api';
import type { Cuenta } from '../types';

const BASE = '/cuentas';

export interface CuentasListParams {
  cliente_id?: number;
  page?: number;
  limit?: number;
}

export interface PaginatedCuentas {
  data: Cuenta[];
  total: number;
  page: number;
}

export const cuentasService = {
  getAll: (params?: CuentasListParams) =>
    api.get<PaginatedCuentas>(BASE, { params }),
  getByCliente: (clienteId: number) =>
    api.get<PaginatedCuentas>(BASE, { params: { cliente_id: clienteId, limit: 100 } }),
  getById: (id: number) => api.get<Cuenta>(`${BASE}/${id}`),
  create: (data: Omit<Cuenta, 'id'>) => api.post<Cuenta>(BASE, data),
  update: (id: number, data: Partial<Cuenta>) => api.put<Cuenta>(`${BASE}/${id}`, data),
  delete: (id: number) => api.delete(`${BASE}/${id}`),
};

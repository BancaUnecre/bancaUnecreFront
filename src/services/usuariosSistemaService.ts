import api from './api';
import type { UsuarioSistema } from '../types';

const BASE = '/usuarios-sistema';

export interface UsuariosListParams {
  page?: number;
  limit?: number;
}

export interface PaginatedUsuarios {
  data: UsuarioSistema[];
  total: number;
  page: number;
}

export const usuariosSistemaService = {
  getAll: (params?: UsuariosListParams) =>
    api.get<PaginatedUsuarios>(BASE, { params }),
  getById: (id: number) => api.get<UsuarioSistema>(`${BASE}/${id}`),
  create: (data: Omit<UsuarioSistema, 'id' | 'sucursal_nombre' | 'fecha_alta'>) =>
    api.post<UsuarioSistema>(BASE, data),
  update: (id: number, data: Partial<Omit<UsuarioSistema, 'id' | 'sucursal_nombre' | 'fecha_alta'>>) =>
    api.put<UsuarioSistema>(`${BASE}/${id}`, data),
  delete: (id: number) => api.delete(`${BASE}/${id}`),
};

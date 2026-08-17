import api from './api';
import type { EmpresaCliente } from '../types';

const BASE = '/empresa-clientes';

export const empresaClientesService = {
  getByEmpresa: (empresaId: number) =>
    api.get<EmpresaCliente[]>(`${BASE}?empresa_id=${empresaId}`),
  create: (data: Omit<EmpresaCliente, 'id' | 'fecha_alta'>) =>
    api.post<EmpresaCliente>(BASE, data),
  update: (id: number, data: Partial<EmpresaCliente>) =>
    api.put<EmpresaCliente>(`${BASE}/${id}`, data),
  delete: (id: number) => api.delete(`${BASE}/${id}`),
};

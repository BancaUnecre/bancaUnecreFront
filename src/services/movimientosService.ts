import api from './api';

const BASE = '/movimientos';

export const movimientosService = {
  transferir: (data: {
    cuenta_origen_id: number;
    cuenta_destino_id: number;
    importe: number;
    concepto: string;
  }) => api.post(`${BASE}/transferencia`, data),

  getAll: (params?: { cuenta_id?: number; page?: number; limit?: number }) =>
    api.get(BASE, { params }),

  getById: (id: number) => api.get(`${BASE}/${id}`),
};

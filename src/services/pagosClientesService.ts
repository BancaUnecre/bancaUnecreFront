import api from './api';

const BASE = '/pagos-clientes';

export const pagosClientesService = {
  pendientes: () => api.get(`${BASE}/pendientes`),
  aplicar: (id: number) => api.post(`${BASE}/${id}/aplicar`),
};

import api from './api';

const BASE = '/pagos-comercios';

export const pagosComerciosService = {
  getVentas: (empresaId: number) => api.get(`${BASE}/ventas`, { params: { empresa_id: empresaId } }),
  pagar: (empresa_id: number, referencia?: string) => api.post(`${BASE}/pagar`, { empresa_id, referencia }),
  historial: (empresaId?: number) => api.get(BASE, { params: empresaId ? { empresa_id: empresaId } : {} }),
};

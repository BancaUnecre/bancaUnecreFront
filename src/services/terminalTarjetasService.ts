import api from './api';

export const terminalTarjetasService = {
  getAll: (params?: any) => api.get('/terminal-tarjetas', { params }),
  create: (data: { cuenta_id: number; numero_tarjeta: string; fecha_vencimiento: string }) => 
    api.post('/terminal-tarjetas', data),
  changeStatus: (id: number, data: { estado: string; motivo: string }) => 
    api.patch(`/terminal-tarjetas/${id}/estado`, data),
};

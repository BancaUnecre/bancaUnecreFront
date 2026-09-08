import api from './api';

export const statsService = {
  getResumen: () => api.get('/stats'),
  getActividadReciente: () => api.get('/stats/actividad-reciente'),
};

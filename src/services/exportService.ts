import api from './api';

/**
 * Descarga un archivo Blob en el navegador con el nombre especificado.
 */
function triggerBrowserDownload(data: BlobPart, filename: string, mimeType: string) {
  const blob = new Blob([data], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export const exportService = {
  /**
   * Descarga el Estado de Cuenta en PDF.
   */
  descargarEstadoCuentaPdf: async (
    cuentaId: number,
    params?: { desde?: string; hasta?: string; tipo?: string }
  ) => {
    const res = await api.get(`/cuentas/${cuentaId}/export/pdf`, {
      params,
      responseType: 'blob',
    });
    const filename = `EstadoCuenta_${cuentaId}_${new Date().toISOString().slice(0, 10)}.pdf`;
    triggerBrowserDownload(res.data, filename, 'application/pdf');
  },

  /**
   * Descarga el Estado de Cuenta en Excel (.xlsx).
   */
  descargarEstadoCuentaExcel: async (
    cuentaId: number,
    params?: { desde?: string; hasta?: string; tipo?: string }
  ) => {
    const res = await api.get(`/cuentas/${cuentaId}/export/excel`, {
      params,
      responseType: 'blob',
    });
    const filename = `EstadoCuenta_${cuentaId}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    triggerBrowserDownload(
      res.data,
      filename,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  },

  /**
   * Descarga el Corte Mensual de Crédito en PDF.
   */
  descargarCortePdf: async (corteId: number) => {
    const res = await api.get(`/cortes/export/pdf/${corteId}`, {
      responseType: 'blob',
    });
    const filename = `CorteCredito_${corteId}_${new Date().toISOString().slice(0, 10)}.pdf`;
    triggerBrowserDownload(res.data, filename, 'application/pdf');
  },

  /**
   * Descarga el Corte Mensual de Crédito en Excel (.xlsx).
   */
  descargarCorteExcel: async (corteId: number) => {
    const res = await api.get(`/cortes/export/excel/${corteId}`, {
      responseType: 'blob',
    });
    const filename = `CorteCredito_${corteId}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    triggerBrowserDownload(
      res.data,
      filename,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
  },
};

export default exportService;

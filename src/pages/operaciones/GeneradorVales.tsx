import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { MessageCircle, QrCode, Building, Banknote, Share2, CreditCard, ShieldCheck, Download, Copy, Check, XCircle } from 'lucide-react';
import api from '../../services/api';

const GeneradorVales: React.FC = () => {
  const [monto, setMonto] = useState<number | ''>('');
  const [fechaExpiracion, setFechaExpiracion] = useState(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; });
  const [empresaId, setEmpresaId] = useState('');
  const [concepto, setConcepto] = useState('');
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);

  const [cuentaId, setCuentaId] = useState('1');
  const [requiereAutorizacion, setRequiereAutorizacion] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [valesActivos, setValesActivos] = useState<any[]>([]);

  const [empresas, setEmpresas] = useState<any[]>([]);

  const fetchEmpresas = async () => {
    try {
      const response = await api.get('/empresas?limit=100');
      if (response.data && response.data.data) {
        setEmpresas(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching empresas', err);
    }
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const fetchValesActivos = async () => {
    if (!cuentaId) return;
    try {
      const response = await api.get(`/terminal-vales/mis-vales/` + cuentaId);
      if (response.data.success) {
        setValesActivos(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching vales', err);
    }
  };

  useEffect(() => {
    fetchValesActivos();
  }, [cuentaId]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monto || !empresaId || !cuentaId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/terminal-vales/generar', {
        cuenta_id: parseInt(cuentaId),
        monto_limite: Number(monto),
        empresa_id_destino: parseInt(empresaId),
        requiere_autorizacion: requiereAutorizacion
      });

      if (response.data.success) {
        setQrCodeData(response.data.data.token_seguro);
        fetchValesActivos();
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Error al generar el vale');
    } finally {
      setLoading(false);
    }
  };

  const handleVerVale = (vale: any) => {
    setQrCodeData(vale.token_seguro);
    setMonto(Number(vale.monto_limite));
    setEmpresaId(vale.empresa_id_destino?.toString() || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleCancelarVale = async (valeId: number) => {
    if (!confirm('Â¿EstÃ¡s seguro de cancelar este vale?')) return;
    try {
      const response = await api.post('/terminal-vales/cancelar/' + valeId);
      if (response.data.success) {
        alert('Vale cancelado con Ã©xito');
        setQrCodeData(null);
        fetchValesActivos();
      }
    } catch (err: any) {
      alert(err?.response?.data?.error || err.message || 'Error al cancelar el vale');
    }
  };

  const shareWhatsApp = () => {
    if (qrCodeData) {
      const text = `Hola, te comparto mi vale de pago.\n*Token / Código:* ${qrCodeData}\nPresenta este código o el token en la terminal para realizar el cobro.`;
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank');
    }
  };

  const copyToClipboard = () => {
    if (qrCodeData) {
      navigator.clipboard.writeText(qrCodeData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  
  const copyQRImageToClipboard = () => {
    const svg = document.getElementById('qr-code-svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width + 40;
        canvas.height = img.height + 40;
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 20, 20);
          canvas.toBlob((blob) => {
            if (blob) {
              const item = new window.ClipboardItem({ 'image/png': blob });
              navigator.clipboard.write([item]).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }).catch(err => {
                alert('Error al copiar imagen: ' + err);
              });
            }
          }, 'image/png');
        }
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById('qr-code-svg');
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        if (ctx) {
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const pngFile = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.download = `vale-unecre-${Date.now()}.png`;
          downloadLink.href = pngFile;
          downloadLink.click();
        }
      };
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Generador de Vales</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Crea vales digitales con cÃ³digo QR para pagos en empresas afiliadas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 mb-5">
            Datos del Vale
          </h2>
          <form onSubmit={handleGenerate} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID de la Cuenta (Origen)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <CreditCard size={16} className="text-gray-400" />
                </div>
                <input
                  type="number"
                  value={cuentaId}
                  onChange={(e) => setCuentaId(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Empresa Afiliada Destino
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building size={16} className="text-gray-400" />
                </div>
                <select
                  value={empresaId}
                  onChange={(e) => setEmpresaId(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                >
                  <option value="">Seleccione una empresa...</option>
                  {empresas.map(e => (
                    <option key={e.id} value={e.id}>{e.nombre_comercial || e.razon_social}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monto del Vale (MXN)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-medium">$</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={monto}
                  onChange={(e) => setMonto(parseFloat(e.target.value) || '')}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Caducidad
              </label>
              <input
                type="date"
                value={fechaExpiracion}
                onChange={(e) => setFechaExpiracion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer mt-4 p-3 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <input
                  type="checkbox"
                  checked={requiereAutorizacion}
                  onChange={(e) => setRequiereAutorizacion(e.target.checked)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">Requerir mi autorizaciÃ³n (Web) en tiempo real al cobrar</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-2.5 mt-2 flex justify-center items-center gap-2"
            >
              <QrCode size={18} />
              {loading ? 'Generando...' : 'Generar QR de Vale'}
            </button>
          </form>
        </div>

        <div className="card p-6 flex flex-col items-center justify-center bg-gray-50/50">
          {qrCodeData ? (
            <div className="text-center w-full animation-fade-in">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 inline-block mb-6">
                <QRCode id="qr-code-svg" value={qrCodeData} size={200} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                ${Number(monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
              </h3>
              <p className="text-primary-700 font-medium text-sm mb-1">
                {empresas.find(e => String(e.id) === String(empresaId))?.nombre_comercial || empresas.find(e => String(e.id) === String(empresaId))?.razon_social}
              </p>
              
              
                <div className="flex gap-2 w-full mt-4">
                  <button onClick={shareWhatsApp} className="flex-1 py-2 flex justify-center items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors">
                    <MessageCircle size={16} /> WA
                  </button>
                  <button onClick={copyQRImageToClipboard} className="btn-secondary flex-1 py-2 flex justify-center items-center gap-2">
                    {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />} 
                    {copied ? 'Copiado' : 'QR al portapapeles'}
                  </button>
                </div>
                <div className="flex gap-2 w-full mt-2">
                  <button onClick={downloadQR} className="btn-secondary flex-1 py-2 flex justify-center items-center gap-2">
                    <Download size={16} /> Descargar Imagen
                  </button>
                  <button onClick={copyToClipboard} className="btn-secondary flex-1 py-2 flex justify-center items-center gap-2">
                    <Copy size={16} /> Copiar Token
                  </button>
                </div>

            </div>
          ) : (
            <div className="text-center text-gray-400 p-8">
              <Banknote size={48} className="mx-auto mb-4 opacity-50" />
              <p className="font-medium text-gray-600 mb-1">NingÃºn vale generado</p>
              <p className="text-sm">Llene el formulario para generar el cÃ³digo QR.</p>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-8">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Mis Vales Activos</h2>
            <p className="text-sm text-gray-500">Vales vigentes generados para tu cuenta.</p>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {valesActivos.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No tienes vales activos.</div>
          ) : (
            valesActivos.map(vale => (
              <div key={vale.id} className="p-4 px-6 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <div className="font-medium text-gray-900">Token: <span className="font-bold">{vale.token_seguro}</span></div>
                    <div className="text-sm text-gray-500">
                      Monto LÃ­mite: ${Number(vale.monto_limite).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN â€¢ Empresa: <span className="font-medium text-gray-700">{empresas.find(e => Number(e.id) === vale.empresa_id_destino)?.nombre_comercial || empresas.find(e => Number(e.id) === vale.empresa_id_destino)?.razon_social || 'Cualquier empresa'}</span>
                    </div>
                </div>
                <div className="flex gap-2">
  <button
    onClick={() => handleVerVale(vale)}
    className="text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
  >
    <QrCode size={16} /> Ver QR
  </button>
  <button
    onClick={() => handleCancelarVale(vale.id)}
    className="text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
  >
                  <XCircle size={16} /> Cancelar Vale
                </button>
                </div>
                </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneradorVales;








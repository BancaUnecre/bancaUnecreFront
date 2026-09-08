import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Loader2, CreditCard, AlertCircle, ArrowLeft, QrCode } from 'lucide-react';
import QRCode from 'react-qr-code';
import { clientesService } from '../../services/clientesService';
import type { Cliente } from '../../types';
import api from '../../services/api';

const EmitirTarjeta = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientIdParam = searchParams.get('cliente');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrData, setQrData] = useState<string | null>(null);
  const [tarjetaData, setTarjetaData] = useState<any>(null);

  React.useEffect(() => {
    if (clientIdParam) {
      const fetchClient = async () => {
        try {
          const res = await clientesService.getById(Number(clientIdParam));
          setSelectedCliente(res.data.data ? res.data.data : res.data);
        } catch(e) {
          setError('No se pudo cargar el cliente seleccionado');
        }
      };
      fetchClient();
    }
  }, [clientIdParam]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search) return;
    try {
      setLoading(true);
      setError(null);
      const res = await clientesService.getAll({ buscar: search, limit: 5 });
      setClientes(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error buscando cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleEmitir = async () => {
    if (!selectedCliente) return;
    try {
      setGenerating(true);
      setError(null);
      const res = await api.post('/tarjetas/generar', { cliente_id: selectedCliente.id });
      
      const tarjeta = res.data.data.tarjeta;
      setTarjetaData(tarjeta);

      const payload = {
        action: 'EMITIR_UNECRE',
        c: selectedCliente.id,
        pan: tarjeta.numero_tarjeta,
        venc: tarjeta.fecha_vencimiento,
        token: tarjeta.token_dinamico
      };
      
      setQrData(JSON.stringify(payload));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error generando tarjeta');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex-1 p-8">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center text-primary-600 hover:text-primary-800 mb-6">
          <ArrowLeft size={20} className="mr-2" />
          Volver
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2"><CreditCard className="text-indigo-600" />Emisión de Tarjeta (Autorización Dual)</h1>

        {!qrData ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {!selectedCliente && <><h2 className="text-lg font-semibold text-gray-800 mb-4">1. Seleccionar Cliente</h2>
            <form onSubmit={handleSearch} className="flex gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por ID, nombre o correo..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !search}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : 'Buscar'}
              </button>
            </form></>}

            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-2">
                <AlertCircle size={18} /> {error}
              </div>
            )}

            {clientes.length > 0 && !selectedCliente && (
              <div className="space-y-3">
                {clientes.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCliente(c)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 cursor-pointer transition-all hover:shadow-md bg-gray-50 hover:bg-white"
                  >
                    <div className="font-semibold text-gray-800">
                      {c.nombre} {c.apellido_paterno} {c.apellido_materno}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">ID: {c.id} | Email: {c.email}</div>
                  </div>
                ))}
              </div>
            )}

            {selectedCliente && (
              <div className="mt-6 border-t pt-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">2. Confirmar Emisión</h2>
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-lg mb-6">
                  <div className="font-semibold text-indigo-900">Cliente Seleccionado:</div>
                  <div className="text-indigo-800 text-lg">
                    {selectedCliente.nombre} {selectedCliente.apellido_paterno}
                  </div>
                  <div className="text-indigo-600 text-sm mt-1">Se generará un número de 16 dígitos y un token dinámico.</div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setSelectedCliente(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button onClick={handleEmitir} disabled={generating} className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">{generating ? <Loader2 className="animate-spin" size={20} /> : <QrCode size={20} />} Generar QR de Autorización</button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode size={32} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Paso Final</h2>
            <p className="text-gray-600 mb-8">
              La tarjeta se ha generado en el servidor. Pï¿½dele al cajero que escanee este cï¿½digo con la terminal Urovo para quemar el chip plï¿½stico.
            </p>

            <div className="bg-white p-4 border border-gray-200 rounded-xl inline-block mb-8 shadow-sm">
              <QRCode value={qrData} size={256} level="H" />
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-left border border-gray-200">
              <p className="text-sm text-gray-500 font-semibold mb-1">Datos Tï¿½cnicos (Solo Lectura):</p>
              <p className="text-xs text-gray-600 font-mono">PAN: {tarjetaData?.numero_tarjeta}</p>
              <p className="text-xs text-gray-600 font-mono">Vence: {tarjetaData?.fecha_vencimiento}</p>
              <p className="text-xs text-gray-600 font-mono break-all">Token: {tarjetaData?.token_dinamico}</p>
            </div>

            <button
              onClick={() => {
                setQrData(null);
                setTarjetaData(null);
                setSelectedCliente(null);
                setSearch('');
              }}
              className="mt-8 w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Emitir Otra Tarjeta
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmitirTarjeta;
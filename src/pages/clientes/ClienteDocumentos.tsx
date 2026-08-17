import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Upload, FileText, Image, Film, X, CheckCircle2,
  Clock, ShieldCheck, Eye, Trash2, Plus, AlertCircle, Download, Loader2
} from 'lucide-react';
import { clientesService } from '../../services/clientesService';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

// ── Types ─────────────────────────────────────────────────────────────────────
type TipoDoc =
  'INE_FRENTE' | 'INE_REVERSO' | 'COMPROBANTE_DOMICILIO' | 'CURP_DOC' | 'RFC_DOC' |
  'FOTO_ROSTRO' | 'PASAPORTE' | 'CONTRATO_FIRMADO' | 'VIDEO_IDENTIFICACION' |
  'DECLARACION_PEP' | 'DECLARACION_ISR' | 'ESTADO_CUENTA' | 'OTRO';

interface Documento {
  id: number;
  cliente_id: number;
  tipo_documento: TipoDoc;
  descripcion: string;
  ruta_archivo: string;
  formato: string;
  tamano_bytes: number;
  fecha_emision?: string;
  fecha_vigencia?: string;
  verificado: boolean;
  fecha_verificacion?: string;
  fecha_carga: string;
  activo: boolean;
  preview?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const TIPOS_DOC: { value: TipoDoc; label: string; grupo: string }[] = [
  { value: 'INE_FRENTE',           label: 'INE / IFE (Frente)',         grupo: 'Identificación' },
  { value: 'INE_REVERSO',          label: 'INE / IFE (Reverso)',        grupo: 'Identificación' },
  { value: 'PASAPORTE',            label: 'Pasaporte',                  grupo: 'Identificación' },
  { value: 'CURP_DOC',             label: 'Constancia CURP',            grupo: 'Identificación' },
  { value: 'RFC_DOC',              label: 'Constancia RFC / SAT',       grupo: 'Identificación' },
  { value: 'COMPROBANTE_DOMICILIO',label: 'Comprobante de Domicilio',   grupo: 'Domicilio' },
  { value: 'FOTO_ROSTRO',          label: 'Fotografía Rostro',          grupo: 'Biometría' },
  { value: 'VIDEO_IDENTIFICACION', label: 'Video Identificación',       grupo: 'Biometría' },
  { value: 'CONTRATO_FIRMADO',     label: 'Contrato Firmado',           grupo: 'Legal' },
  { value: 'DECLARACION_PEP',      label: 'Declaración PEP',            grupo: 'Legal' },
  { value: 'DECLARACION_ISR',      label: 'Declaración ISR / Fiscal',   grupo: 'Fiscal' },
  { value: 'ESTADO_CUENTA',        label: 'Estado de Cuenta',           grupo: 'Financiero' },
  { value: 'OTRO',                 label: 'Otro Documento',             grupo: 'General' },
];

const GRUPOS_REQUERIDOS: { grupo: string; tipos: TipoDoc[] }[] = [
  { grupo: 'Identificación', tipos: ['INE_FRENTE', 'INE_REVERSO'] },
  { grupo: 'Domicilio',      tipos: ['COMPROBANTE_DOMICILIO'] },
  { grupo: 'Biometría',      tipos: ['FOTO_ROSTRO'] },
  { grupo: 'Legal',          tipos: ['CONTRATO_FIRMADO'] },
];


// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtBytes = (b: number) => {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
};

const fileIcon = (fmt: string) => {
  if (['jpg', 'jpeg', 'png', 'webp'].includes(fmt)) return <Image size={18} className="text-blue-500" />;
  if (['mp4', 'mov', 'avi'].includes(fmt)) return <Film size={18} className="text-purple-500" />;
  return <FileText size={18} className="text-red-500" />;
};

const estaVigente = (vigencia?: string) => {
  if (!vigencia) return true;
  return new Date(vigencia) >= new Date();
};

// ── Main component ────────────────────────────────────────────────────────────
const ClienteDocumentos: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const clienteId = Number(id);

  const [cliente, setCliente] = useState<any | null>(null);
  const [loadingCliente, setLoadingCliente] = useState(true);
  const [docs, setDocs] = useState<Documento[]>([]);

  useEffect(() => {
    clientesService.getById(clienteId).then(res => {
      const raw = res.data as any;
      setCliente(raw?.data ?? raw);
    }).catch(() => setCliente(null))
      .finally(() => setLoadingCliente(false));
  }, [clienteId]);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDoc, setDeleteDoc] = useState<Documento | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState<Documento | null>(null);

  const [form, setForm] = useState({
    tipo_documento: '' as TipoDoc | '',
    descripcion: '',
    fecha_emision: '',
    fecha_vigencia: '',
    file: null as File | null,
    filePreview: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  if (loadingCliente) return (
    <div className="flex items-center justify-center h-48 gap-3 text-gray-400">
      <Loader2 size={22} className="animate-spin" /><span>Cargando cliente...</span>
    </div>
  );

  if (!cliente) return (
    <div className="max-w-4xl mx-auto card p-12 text-center">
      <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
      <p className="text-gray-600">Cliente no encontrado.</p>
      <Link to="/clientes" className="btn-secondary mt-4 inline-flex">Volver al listado</Link>
    </div>
  );

  // ── Drag & drop ───────────────────────────────────────────────────────────
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) pickFile(file);
  };

  const pickFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    const previewUrl = ['jpg', 'jpeg', 'png', 'webp'].includes(ext)
      ? URL.createObjectURL(file) : '';
    setForm(f => ({ ...f, file, filePreview: previewUrl }));
    setModalOpen(true);
  };

  // ── Validate & save ───────────────────────────────────────────────────────
  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!form.tipo_documento) e.tipo = 'Selecciona el tipo de documento';
    if (!form.file) e.file = 'Selecciona un archivo';
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    const ext = form.file!.name.split('.').pop()?.toLowerCase() ?? 'pdf';
    setDocs(d => [...d, {
      id: Date.now(),
      cliente_id: clienteId,
      tipo_documento: form.tipo_documento as TipoDoc,
      descripcion: form.descripcion || (TIPOS_DOC.find(t => t.value === form.tipo_documento)?.label ?? ''),
      ruta_archivo: `/docs/${form.file!.name}`,
      formato: ext,
      tamano_bytes: form.file!.size,
      fecha_emision: form.fecha_emision || undefined,
      fecha_vigencia: form.fecha_vigencia || undefined,
      verificado: false,
      fecha_carga: new Date().toISOString(),
      activo: true,
      preview: form.filePreview || undefined,
    }]);
    setSaving(false);
    setModalOpen(false);
    setForm({ tipo_documento: '', descripcion: '', fecha_emision: '', fecha_vigencia: '', file: null, filePreview: '' });
  };

  const handleDelete = async () => {
    if (!deleteDoc) return;
    setDeleting(true);
    await new Promise(r => setTimeout(r, 400));
    setDocs(d => d.filter(x => x.id !== deleteDoc.id));
    setDeleting(false);
    setDeleteDoc(null);
  };

  const toggleVerificado = (docId: number) => {
    setDocs(d => d.map(doc => doc.id === docId
      ? { ...doc, verificado: !doc.verificado, fecha_verificacion: !doc.verificado ? new Date().toISOString() : undefined }
      : doc
    ));
  };

  // ── Coverage analysis ─────────────────────────────────────────────────────
  const tiposCargados = new Set(docs.filter(d => d.activo).map(d => d.tipo_documento));
  const requeridosPendientes = GRUPOS_REQUERIDOS.flatMap(g => g.tipos).filter(t => !tiposCargados.has(t));
  const pct = Math.round((GRUPOS_REQUERIDOS.flatMap(g => g.tipos).length - requeridosPendientes.length) / GRUPOS_REQUERIDOS.flatMap(g => g.tipos).length * 100);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <button onClick={() => navigate(-1)} className="btn-secondary"><ArrowLeft size={16} />Volver</button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos Digitales</h1>
          <p className="text-gray-500 text-sm">{cliente.nombre} {cliente.apellido_paterno} {cliente.apellido_materno ?? ''} · RFC: {cliente.rfc}</p>
        </div>
      </div>

      {/* Progress strip */}
      <div className="card p-5 flex items-center gap-5 flex-wrap">
        <div className="flex-1 min-w-48">
          <div className="flex justify-between mb-1.5">
            <span className="text-sm font-semibold text-gray-700">Documentación requerida</span>
            <span className="text-sm font-bold text-primary-700">{pct}%</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
        <div className="flex gap-4 text-center">
          <div><p className="text-xl font-bold text-gray-900">{docs.length}</p><p className="text-xs text-gray-500">Total</p></div>
          <div><p className="text-xl font-bold text-emerald-600">{docs.filter(d => d.verificado).length}</p><p className="text-xs text-gray-500">Verificados</p></div>
          <div><p className="text-xl font-bold text-amber-600">{docs.filter(d => !d.verificado).length}</p><p className="text-xs text-gray-500">Pendientes</p></div>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary flex-shrink-0">
          <Plus size={16} />Cargar Documento
        </button>
      </div>

      {/* Pendientes alert */}
      {requeridosPendientes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Documentos requeridos faltantes</p>
            <p className="text-xs text-amber-700 mt-0.5">
              {requeridosPendientes.map(t => TIPOS_DOC.find(x => x.value === t)?.label).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div
        ref={dropRef}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all
          ${dragging ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'}`}
      >
        <Upload size={28} className={dragging ? 'text-primary-600' : 'text-gray-300'} />
        <div className="text-center">
          <p className="text-sm font-semibold text-gray-600">Arrastra archivos aquí o haz clic</p>
          <p className="text-xs text-gray-400 mt-0.5">PDF, JPG, PNG, MP4 · Máx. 20 MB</p>
        </div>
        <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp,.mp4,.mov"
          onChange={e => e.target.files?.[0] && pickFile(e.target.files[0])} />
      </div>

      {/* Docs grid */}
      {docs.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {docs.map(doc => {
            const vigente = estaVigente(doc.fecha_vigencia);
            const tipoLabel = TIPOS_DOC.find(t => t.value === doc.tipo_documento)?.label ?? doc.tipo_documento;
            return (
              <div key={doc.id} className={`card overflow-hidden group hover:shadow-md transition-shadow ${!vigente ? 'ring-1 ring-red-200' : ''}`}>
                {/* Preview area */}
                <div className="h-28 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative overflow-hidden">
                  {doc.preview
                    ? <img src={doc.preview} className="w-full h-full object-cover" alt="" />
                    : <div className="flex flex-col items-center gap-1 text-gray-400">{fileIcon(doc.formato)}<span className="text-xs uppercase font-bold">{doc.formato}</span></div>
                  }
                  {/* Overlay actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button onClick={() => setPreview(doc)} className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors" title="Ver"><Eye size={15} className="text-gray-700" /></button>
                    <button className="p-2 bg-white/90 rounded-lg hover:bg-white transition-colors" title="Descargar"><Download size={15} className="text-gray-700" /></button>
                    <button onClick={() => setDeleteDoc(doc)} className="p-2 bg-red-500/90 rounded-lg hover:bg-red-600 transition-colors" title="Eliminar"><Trash2 size={15} className="text-white" /></button>
                  </div>
                  {/* Status badges */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1">
                    {doc.verificado
                      ? <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500 text-white rounded-full text-xs font-semibold"><ShieldCheck size={10} />OK</span>
                      : <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-white rounded-full text-xs font-semibold"><Clock size={10} />Pendiente</span>
                    }
                    {!vigente && doc.fecha_vigencia && (
                      <span className="px-2 py-0.5 bg-red-500 text-white rounded-full text-xs font-semibold">Vencido</span>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="font-semibold text-gray-800 text-sm leading-tight">{tipoLabel}</p>
                  {doc.descripcion && <p className="text-xs text-gray-500 mt-0.5 truncate">{doc.descripcion}</p>}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">{fmtBytes(doc.tamano_bytes)}</span>
                    <span className="text-xs text-gray-400">{new Date(doc.fecha_carga).toLocaleDateString('es-MX')}</span>
                  </div>
                  {doc.fecha_vigencia && (
                    <p className={`text-xs mt-1 ${vigente ? 'text-gray-400' : 'text-red-500 font-semibold'}`}>
                      Vence: {new Date(doc.fecha_vigencia).toLocaleDateString('es-MX')}
                    </p>
                  )}
                  <button
                    onClick={() => toggleVerificado(doc.id)}
                    className={`mt-2 w-full py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      doc.verificado
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {doc.verificado ? '✓ Verificado' : 'Marcar como verificado'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card py-16 flex flex-col items-center gap-3 text-gray-400">
          <FileText size={40} className="text-gray-200" />
          <p className="text-sm">No hay documentos cargados aún</p>
        </div>
      )}

      {/* ── Upload Modal ────────────────────────────────────────────────────── */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Cargar Documento" size="lg">
        <div className="space-y-4">
          {/* File area */}
          <div>
            <label className="label-field">Archivo <span className="text-red-500">*</span></label>
            {form.file ? (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
                {form.filePreview
                  ? <img src={form.filePreview} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" alt="" />
                  : <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">{fileIcon(form.file.name.split('.').pop() ?? '')}</div>
                }
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{form.file.name}</p>
                  <p className="text-xs text-gray-500">{fmtBytes(form.file.size)}</p>
                </div>
                <button onClick={() => setForm(f => ({ ...f, file: null, filePreview: '' }))} className="p-1.5 hover:bg-gray-200 rounded-lg">
                  <X size={14} className="text-gray-500" />
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition-all flex items-center justify-center gap-2 text-gray-500 hover:text-primary-600">
                <Upload size={18} /><span className="text-sm">Seleccionar archivo</span>
              </button>
            )}
            {formErrors.file && <p className="text-red-500 text-xs mt-1">{formErrors.file}</p>}
          </div>

          {/* Type */}
          <div>
            <label className="label-field">Tipo de Documento <span className="text-red-500">*</span></label>
            <select value={form.tipo_documento} onChange={e => setForm(f => ({ ...f, tipo_documento: e.target.value as TipoDoc }))}
              className={`input-field ${formErrors.tipo ? 'border-red-400' : ''}`}>
              <option value="">Seleccionar tipo...</option>
              {Object.entries(TIPOS_DOC.reduce((acc, t) => ({ ...acc, [t.grupo]: [...(acc[t.grupo] ?? []), t] }), {} as Record<string, typeof TIPOS_DOC>)).map(([grupo, tipos]) => (
                <optgroup key={grupo} label={grupo}>
                  {tipos.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </optgroup>
              ))}
            </select>
            {formErrors.tipo && <p className="text-red-500 text-xs mt-1">{formErrors.tipo}</p>}
          </div>

          <div>
            <label className="label-field">Descripción</label>
            <input value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              className="input-field" placeholder="Descripción del documento (opcional)" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field">Fecha de Emisión</label>
              <input type="date" value={form.fecha_emision} onChange={e => setForm(f => ({ ...f, fecha_emision: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="label-field">Fecha de Vigencia</label>
              <input type="date" value={form.fecha_vigencia} onChange={e => setForm(f => ({ ...f, fecha_vigencia: e.target.value }))} className="input-field" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary flex-1 justify-center"><X size={15} />Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center">
              {saving ? <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Cargando...</> : <><CheckCircle2 size={15} />Guardar Documento</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* Preview modal */}
      {preview && (
        <Modal isOpen={!!preview} onClose={() => setPreview(null)} title={TIPOS_DOC.find(t => t.value === preview.tipo_documento)?.label ?? ''} size="xl">
          <div className="space-y-3">
            {preview.preview
              ? <img src={preview.preview} className="w-full rounded-xl" alt="" />
              : <div className="h-48 bg-gray-100 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400">
                  {fileIcon(preview.formato)}
                  <p className="text-sm">{preview.ruta_archivo.split('/').pop()}</p>
                </div>
            }
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ['Tipo', TIPOS_DOC.find(t => t.value === preview.tipo_documento)?.label],
                ['Formato', preview.formato.toUpperCase()],
                ['Tamaño', fmtBytes(preview.tamano_bytes)],
                ['Cargado', new Date(preview.fecha_carga).toLocaleDateString('es-MX')],
                ...(preview.fecha_emision ? [['Emisión', new Date(preview.fecha_emision).toLocaleDateString('es-MX')]] : []),
                ...(preview.fecha_vigencia ? [['Vigencia', new Date(preview.fecha_vigencia).toLocaleDateString('es-MX')]] : []),
                ['Verificado', preview.verificado ? `Sí — ${new Date(preview.fecha_verificacion!).toLocaleString('es-MX')}` : 'No'],
              ].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-lg px-3 py-2">
                  <p className="text-gray-400">{k}</p>
                  <p className="font-semibold text-gray-700 mt-0.5">{v as string}</p>
                </div>
              ))}
            </div>
            <button className="btn-secondary w-full justify-center"><Download size={15} />Descargar</button>
          </div>
        </Modal>
      )}

      <ConfirmDialog
        isOpen={!!deleteDoc}
        onClose={() => setDeleteDoc(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Eliminar documento"
        message={`¿Eliminar "${TIPOS_DOC.find(t => t.value === deleteDoc?.tipo_documento)?.label}"? Esta acción no se puede deshacer.`}
      />
    </div>
  );
};

export default ClienteDocumentos;

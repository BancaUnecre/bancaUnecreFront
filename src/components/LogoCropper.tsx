import React, { useRef, useState, useCallback } from 'react';
import { Check, X, ZoomIn } from 'lucide-react';

interface Props {
  src: string;              // data URL de la imagen original
  onApply: (dataUrl: string) => void;
  onCancel: () => void;
  round?: boolean;          // marco circular (fotos de persona)
  title?: string;
}

const BOX = 280;   // tamaño del marco visible (cuadrado)
const OUT = 240;   // tamaño del logo resultante (px)

/** Recorte de logo: arrastra para mover y usa el slider para acercar.
 *  Lo que quede dentro del marco cuadrado es lo que se guarda. */
const LogoCropper: React.FC<Props> = ({ src, onApply, onCancel, round = false, title = 'Ajustar logotipo' }) => {
  const imgRef = useRef<HTMLImageElement>(null);
  const [nat, setNat] = useState({ w: 0, h: 0 });
  const [baseScale, setBaseScale] = useState(1);   // escala "cover"
  const [zoom, setZoom] = useState(1);             // multiplicador del usuario
  const [pos, setPos] = useState({ x: 0, y: 0 });  // top-left de la imagen dentro del marco
  const drag = useRef<{ x: number; y: number } | null>(null);

  const scale = baseScale * zoom;

  const clamp = useCallback((p: { x: number; y: number }, s: number) => {
    const w = nat.w * s, h = nat.h * s;
    // no dejar huecos: la imagen siempre cubre el marco
    const minX = Math.min(0, BOX - w), minY = Math.min(0, BOX - h);
    return { x: Math.max(minX, Math.min(0, p.x)), y: Math.max(minY, Math.min(0, p.y)) };
  }, [nat]);

  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    const base = Math.max(BOX / img.naturalWidth, BOX / img.naturalHeight);
    setNat({ w: img.naturalWidth, h: img.naturalHeight });
    setBaseScale(base);
    setZoom(1);
    // centrar
    setPos({ x: (BOX - img.naturalWidth * base) / 2, y: (BOX - img.naturalHeight * base) / 2 });
  };

  const onZoom = (z: number) => {
    const newScale = baseScale * z;
    // mantener el centro del marco al hacer zoom
    const cx = (BOX / 2 - pos.x) / scale, cy = (BOX / 2 - pos.y) / scale;
    const np = { x: BOX / 2 - cx * newScale, y: BOX / 2 - cy * newScale };
    setZoom(z);
    setPos(clamp(np, newScale));
  };

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    setPos(clamp({ x: e.clientX - drag.current.x, y: e.clientY - drag.current.y }, scale));
  };
  const onPointerUp = () => { drag.current = null; };

  const apply = () => {
    const canvas = document.createElement('canvas');
    canvas.width = OUT; canvas.height = OUT;
    const ctx = canvas.getContext('2d');
    if (!ctx || !imgRef.current) return;
    const f = OUT / BOX;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, OUT, OUT);
    ctx.drawImage(imgRef.current, pos.x * f, pos.y * f, nat.w * scale * f, nat.h * scale * f);
    onApply(canvas.toDataURL('image/png'));
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <h3 className="font-semibold text-gray-800 mb-1">{title}</h3>
        <p className="text-xs text-gray-500 mb-4">Arrastra la imagen y usa el zoom. Lo que quede dentro del cuadro es lo que se guarda.</p>

        <div
          className="relative mx-auto rounded-xl overflow-hidden bg-gray-100 border border-gray-200 cursor-grab active:cursor-grabbing select-none"
          style={{ width: BOX, height: BOX, touchAction: 'none', borderRadius: round ? '50%' : undefined }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <img
            ref={imgRef}
            src={src}
            alt="recorte"
            onLoad={onImgLoad}
            draggable={false}
            style={{
              position: 'absolute',
              left: pos.x, top: pos.y,
              width: nat.w * scale, height: nat.h * scale,
              maxWidth: 'none',
              pointerEvents: 'none',
            }}
          />
        </div>

        <div className="flex items-center gap-3 mt-4">
          <ZoomIn size={16} className="text-gray-500" />
          <input
            type="range" min={1} max={3} step={0.01} value={zoom}
            onChange={e => onZoom(Number(e.target.value))}
            className="flex-1 accent-primary-700"
          />
        </div>

        <div className="flex gap-3 mt-5">
          <button type="button" onClick={onCancel} className="btn-secondary flex-1 justify-center">
            <X size={15} /> Cancelar
          </button>
          <button type="button" onClick={apply} className="btn-primary flex-1 justify-center">
            <Check size={15} /> Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogoCropper;

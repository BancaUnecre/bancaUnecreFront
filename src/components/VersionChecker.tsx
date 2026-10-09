import { useEffect, useRef, useState } from 'react';

// Avisa cuando hay una versión nueva desplegada (compara /version.json contra la cargada).
export default function VersionChecker() {
  const inicial = useRef<string | null>(null);
  const [nueva, setNueva] = useState(false);
  useEffect(() => {
    const check = async () => {
      try {
        const r = await fetch('/version.json?t=' + Date.now(), { cache: 'no-store' });
        if (!r.ok) return;
        const v = (await r.json())?.version;
        if (!v) return;
        if (inicial.current == null) inicial.current = v;
        else if (v !== inicial.current) setNueva(true);
      } catch { /* sin conexión: reintenta luego */ }
    };
    check();
    const id = setInterval(check, 120000);
    return () => clearInterval(id);
  }, []);
  if (!nueva) return null;
  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 99999, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, boxShadow: '0 12px 34px rgba(0,0,0,0.18)', padding: '18px 20px', maxWidth: 340 }}>
      <p style={{ fontWeight: 700, margin: '0 0 4px', color: '#0b1e3b' }}>🔄 Nueva versión disponible</p>
      <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 12px' }}>Hay una actualización del sistema. Actualiza para obtener los últimos cambios.</p>
      <button onClick={() => window.location.reload()} style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 16px', fontWeight: 700, cursor: 'pointer', width: '100%' }}>Actualizar ahora</button>
    </div>
  );
}

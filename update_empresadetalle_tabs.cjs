const fs = require('fs');
const file = './src/pages/empresas/EmpresaDetalle.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add tab state
content = content.replace(
    "type TabType = 'info' | 'clientes';",
    "type TabType = 'info' | 'clientes' | 'comercios';"
);

// Add Tab Button
const tabsHTML = `
          <div className="flex border-b border-gray-100 overflow-x-auto">
            <button
              onClick={() => setActiveTab('info')}
              className={\`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap \${
                activeTab === 'info'
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }\`}
            >
              <Building2 size={16} className="inline mr-2" />
              Información General
            </button>
            {!isNew && (
              <button
                onClick={() => setActiveTab('clientes')}
                className={\`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap \${
                  activeTab === 'clientes'
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }\`}
              >
                <Users size={16} className="inline mr-2" />
                Cuentas Vinculadas
              </button>
            )}
            {!isNew && (
              <button
                onClick={() => setActiveTab('comercios')}
                className={\`px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap \${
                  activeTab === 'comercios'
                    ? 'border-primary-600 text-primary-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }\`}
              >
                <CheckCircle2 size={16} className="inline mr-2" />
                Red Cerrada (Comercios)
              </button>
            )}
          </div>
`;

content = content.replace(
    /\<div className="flex border-b border-gray-100 overflow-x-auto"\>[\s\S]*?\<\/div\>/m,
    tabsHTML
);

// Add API methods for Restricciones
const apiLogic = `
  const [restricciones, setRestricciones] = useState<any[]>([]);
  const [loadingRes, setLoadingRes] = useState(false);
  
  const fetchRestricciones = async () => {
    if (!id || id === 'nuevo') return;
    setLoadingRes(true);
    try {
      const res = await fetch(\`https://bancaunecre.com/api/empresas-restricciones/\${id}\`, {
        headers: { Authorization: \`Bearer \${localStorage.getItem('token')}\` }
      });
      const json = await res.json();
      setRestricciones(json.data || []);
    } catch(e) {}
    setLoadingRes(false);
  };

  const [addComercioId, setAddComercioId] = useState('');
  const addRestriccion = async () => {
    try {
      const res = await fetch('https://bancaunecre.com/api/empresas-restricciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: \`Bearer \${localStorage.getItem('token')}\` },
        body: JSON.stringify({ empresa_patron_id: Number(id), empresa_comercio_id: Number(addComercioId) })
      });
      const json = await res.json();
      if (!json.success) alert(json.message);
      else { setAddComercioId(''); fetchRestricciones(); }
    } catch(e) {}
  };

  const removeRestriccion = async (resId: number) => {
    if(!confirm("¿Remover comercio autorizado?")) return;
    try {
      await fetch(\`https://bancaunecre.com/api/empresas-restricciones/\${resId}\`, {
        method: 'DELETE',
        headers: { Authorization: \`Bearer \${localStorage.getItem('token')}\` }
      });
      fetchRestricciones();
    } catch(e) {}
  };

  useEffect(() => {
    if (activeTab === 'comercios') fetchRestricciones();
  }, [activeTab]);
`;

content = content.replace("const [loadingVinc, setLoadingVinc] = useState(false);", apiLogic + "\n  const [loadingVinc, setLoadingVinc] = useState(false);");

// Add Tab Content
const tabContent = `
          {activeTab === 'comercios' && (
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <h4 className="font-semibold text-blue-900">Configuración de Red Cerrada (Vales de Nómina)</h4>
                  <p className="text-sm text-blue-800 mt-1">Si esta lista está vacía, tus empleados podrán comprar a crédito en cualquier comercio de la red Unecre. Al agregar al menos 1 comercio a esta lista, la red se "cierra" y <strong>sólo</strong> podrán comprar en los comercios autorizados aquí.</p>
                </div>
              </div>
              
              <div className="flex gap-2 mb-4 bg-white p-4 rounded-lg border border-gray-200">
                <div className="flex-1">
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">ID de Empresa / Comercio a autorizar</label>
                  <input type="number" value={addComercioId} onChange={e => setAddComercioId(e.target.value)} className="input-field" placeholder="Ingresa el ID del comercio en Unecre..." />
                </div>
                <div className="flex items-end">
                  <button onClick={addRestriccion} disabled={!addComercioId} className="btn-primary py-2.5">
                    <CheckCircle2 size={16} /> Autorizar Comercio
                  </button>
                </div>
              </div>

              {loadingRes ? (
                 <div className="flex justify-center py-8"><Loader2 className="animate-spin text-gray-400" /></div>
              ) : (
                <div className="overflow-hidden bg-white border border-gray-200 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Comercio Autorizado</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Autorizado Por</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Fecha y Hora</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {restricciones.length === 0 ? (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No hay comercios restringidos. Red Abierta.</td></tr>
                      ) : restricciones.map((r: any) => (
                        <tr key={r.id}>
                          <td className="px-4 py-3">
                            <p className="font-semibold">{r.comercio?.razon_social}</p>
                            <p className="text-xs text-gray-500 font-mono">{r.comercio?.rfc}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{r.usuarioAlta?.nombre_completo}</td>
                          <td className="px-4 py-3 text-gray-500">{new Date(r.fecha_alta).toLocaleString('es-MX')}</td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => removeRestriccion(r.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
`;

content = content.replace(
    "{activeTab === 'clientes' && (",
    tabContent + "\n          {activeTab === 'clientes' && ("
);

fs.writeFileSync(file, content, 'utf8');

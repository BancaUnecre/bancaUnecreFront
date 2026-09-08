const fs = require('fs');
const file = './src/pages/empresas/EmpresaDetalle.tsx';
let content = fs.readFileSync(file, 'utf8');

const fetchLogic = `
    const descargarNomina = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(\`https://bancaunecre.com/api/empresas/\${empresaId}/reporte-nomina\`, {
          headers: { Authorization: \`Bearer \${token}\` }
        });
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = \`nomina_empresa_\${empresaId}.csv\`;
        a.click();
      } catch(e) { alert("Error descargando reporte"); }
    };
`;

content = content.replace("const handleDesvincular", fetchLogic + "\n    const handleDesvincular");

const btnHTML = `
                <div className="flex gap-2">
                  <button onClick={descargarNomina} className="btn-secondary text-sm">
                    <Download size={15} className="mr-1 inline" /> Reporte de Nómina
                  </button>
                  <button onClick={openVincular} className="btn-primary">
                    <Plus size={15} />Vincular Cliente
                  </button>
                </div>
`;

content = content.replace(
  /\<div className="flex gap-2"\>[\s\S]*?\<\/button\>\s*\<\/div\>/m,
  btnHTML
);

fs.writeFileSync(file, content, 'utf8');

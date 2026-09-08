const fs = require('fs');
const path = 'c:/discos/proyectos/banco/bancaUnecreFront/src/router/AppRouter.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add imports
content = content.replace(
  "import GeneradorVales from '../pages/operaciones/GeneradorVales';",
  "import GeneradorVales from '../pages/operaciones/GeneradorVales';\nimport DepositoCuenta from '../pages/operaciones/DepositoCuenta';\nimport RetiroCuenta from '../pages/operaciones/RetiroCuenta';"
);

// Add routes
content = content.replace(
  "<Route path=\"operaciones/vales/autorizar\" element={<AutorizarVales />} />",
  "<Route path=\"operaciones/vales/autorizar\" element={<AutorizarVales />} />\n          <Route path=\"operaciones/deposito\" element={<DepositoCuenta />} />\n          <Route path=\"operaciones/retiro\" element={<RetiroCuenta />} />"
);

fs.writeFileSync(path, content);
console.log("AppRouter.tsx updated");

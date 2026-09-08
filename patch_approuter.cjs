const fs = require('fs');
let code = fs.readFileSync('src/router/AppRouter.tsx', 'utf8');

const importStatement = "import EmitirTarjeta from '../pages/tarjetas/EmitirTarjeta';\n";
code = importStatement + code;

const routeStatement = "<Route path=\"tarjetas/emitir\" element={<EmitirTarjeta />} />\n          ";
code = code.replace("<Route path=\"/\" element={<ProtectedRoute><Layout /></ProtectedRoute>}>\n", "<Route path=\"/\" element={<ProtectedRoute><Layout /></ProtectedRoute>}>\n          " + routeStatement);

fs.writeFileSync('src/router/AppRouter.tsx', code);

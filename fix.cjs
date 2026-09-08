const fs = require('fs');
let code = fs.readFileSync('src/pages/cuentas/AperturaCuenta.tsx', 'utf8');

let fixed = \    const numero = genAccountNumber();
    const clabe = genCLABE(numero);
    try {
      await cuentasService.create({
        cliente_id: cliente.id!,
        numero_cuenta: numero,
        clabe: clabe,
        tipo_cuenta: config.tipo_cuenta as string,
        moneda: config.moneda,
        saldo: config.saldo,
        limite_credito: config.limite_credito,
        tasa_credito: config.tasa_credito,
        nivel_cuenta_id: config.nivel_cuenta_id,
        estatus: 1,
      } as any);\;

code = code.replace(/try\s*\{\s*const\s*\{\s*numero,\s*clabe\s*\}\s*=\s*await\s*cuentasService\.abrir\(\{[\s\S]*?estatus:\s*1,\s*\}\);/, fixed);

fs.writeFileSync('src/pages/cuentas/AperturaCuenta.tsx', code);

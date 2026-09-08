const fs = require('fs');
let code = fs.readFileSync('src/pages/tarjetas/EmitirTarjeta.tsx', 'utf8');

const importReplacement = `import { useNavigate, useSearchParams } from 'react-router-dom';`;
code = code.replace(`import { useNavigate } from 'react-router-dom';`, importReplacement);

const hooksReplacement = `  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientIdParam = searchParams.get('cliente');`;
code = code.replace(`  const navigate = useNavigate();`, hooksReplacement);

const effectAdd = `  React.useEffect(() => {
    if (clientIdParam) {
      const fetchClient = async () => {
        try {
          const res = await clientesService.getById(Number(clientIdParam));
          setSelectedCliente(res.data);
        } catch(e) {
          setError('No se pudo cargar el cliente seleccionado');
        }
      };
      fetchClient();
    }
  }, [clientIdParam]);`;

code = code.replace(`  const [tarjetaData, setTarjetaData] = useState<any>(null);`, `  const [tarjetaData, setTarjetaData] = useState<any>(null);\n\n${effectAdd}`);

fs.writeFileSync('src/pages/tarjetas/EmitirTarjeta.tsx', code, 'utf8');

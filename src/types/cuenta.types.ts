export interface CuentaBuscada {
  cuenta_id: number;
  saldo: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno: string | null;
  curp: string | null;
  rfc: string | null;
  fecha_nacimiento: string | null;
}


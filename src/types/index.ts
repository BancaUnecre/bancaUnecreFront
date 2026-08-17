export interface User {
  id: number;
  username: string;
  nombre: string;
  rol: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Catalogos
export interface Estado {
  id: number;
  clave: string;
  nombre: string;
}

export interface NivelCuenta {
  id: number;
  nombre: string;
  limite_deposito: string;
  descripcion: string;
}

export interface NivelRiesgo {
  id: number;
  nombre: string;
  descripcion: string;
}

export interface Ocupacion {
  id: number;
  clave: string;
  descripcion: string;
}

export interface TipoIdentificacion {
  id: number;
  clave: string;
  descripcion: string;
}

export interface Cliente {
  id?: number;
  nombre: string;
  apellido_paterno: string;
  apellido_materno?: string;
  fecha_nacimiento: string;
  genero: 'M' | 'F';
  nacionalidad: string;
  pais_nacimiento: string;
  entidad_nacimiento_id?: number;
  curp: string;
  rfc: string;
  tipo_identificacion_id: number;
  num_identificacion: string;
  vigencia_identificacion: string;
  clave_elector?: string;
  curp_validado_renapo: boolean;
  rfc_validado_sat: boolean;
  ine_validado_ine: boolean;
  calle: string;
  num_exterior: string;
  num_interior?: string;
  colonia: string;
  municipio: string;
  estado_id: number;
  cp: string;
  pais_residencia: string;
  tipo_domicilio?: 'PROPIO' | 'RENTADO' | 'FAMILIAR' | 'OTRO';
  antiguedad_domicilio_meses?: number;
  telefono_celular: string;
  telefono_casa?: string;
  telefono_trabajo?: string;
  email: string;
  ocupacion_id: number;
  empresa_trabajo?: string;
  giro_negocio?: string;
  ingreso_mensual: number;
  otros_ingresos?: number;
  origen_recursos: string;
  nivel_cuenta_id: number;
  es_pep: boolean;
  descripcion_pep?: string;
  tiene_familiar_pep: boolean;
  descripcion_familiar_pep?: string;
  acepta_terminos: boolean;
  acepta_uso_datos: boolean;
  acepta_grabacion?: boolean;
  metodo_contratacion?: string;
  nivel_riesgo_id: number;
  estatus: number;
  fecha_alta?: string;
}

export interface Cuenta {
  id: number;
  cliente_id: number;
  numero_cuenta: string;
  clabe?: string;
  tipo_cuenta: string;
  moneda: string;
  saldo: number;
  limite_credito: number;
  nivel_cuenta_id: number;
  estatus: number;
}

export interface Empresa {
  id?: number;
  razon_social: string;
  nombre_comercial?: string;
  rfc: string;
  sector?: string;
  telefono?: string;
  email_contacto?: string;
  domicilio_fiscal?: string;
  logo?: string;
  logo_tipo_mime?: string;
  activo: boolean;
  fecha_alta?: string;
  fecha_modificacion?: string;
}

export interface EmpresaCliente {
  id?: number;
  empresa_id: number;
  cliente_id: number;
  cuenta_id: number;
  limite_credito: number;
  total_debito: number;
  activo: boolean;
  fecha_alta?: string;
  usuario_alta_id?: number;
  // Campos join para display
  cliente_nombre?: string;
  cliente_rfc?: string;
  cliente_curp?: string;
  cuenta_numero?: string;
  cuenta_tipo?: string;
  cuenta_clabe?: string;
  cuenta_saldo?: number;
  cuenta_moneda?: string;
}

export interface Sucursal {
  id?: number;
  numero: string;
  nombre: string;
  direccion?: string;
  estado_id?: number;
  activa: boolean;
  estado_nombre?: string;
}

export interface UsuarioSistema {
  id?: number;
  nombre_usuario: string;
  nombre_completo: string;
  contrasena?: string;
  rol: 'ADMINISTRADOR' | 'ADMIN' | 'SUPERVISOR' | 'OPERADOR' | 'CUMPLIMIENTO';
  sucursal_id?: number;
  activo: boolean;
  sucursal_nombre?: string;
  fecha_alta?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

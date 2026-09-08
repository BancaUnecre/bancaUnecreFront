import api from './api';

// --- Tipos ---

export interface LoginRequest {
  nombre_usuario: string;
  contrasena: string;
}

export interface UsuarioInfo {
  id: number;
  nombre_usuario: string;
  nombre: string;
  rol: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  data?: UsuarioInfo & { token?: string };
  message?: string;
}

export interface SetPasswordRequest {
  id: number;
  contrasena: string;
}

export interface SetPasswordResponse {
  success: boolean;
  message?: string;
}

// --- Métodos ---

export const loginUsuario = async (data: LoginRequest): Promise<LoginResponse> => {
  const res = await api.post<LoginResponse>('/auth/login', data);
  console.log('[loginUsuario] response completo:', res.data);
  return res.data;
};

// El endpoint set-password espera el token sin prefijo "Bearer" según la spec.
// Se pasa como header explícito para que el interceptor no lo sobreescriba.
export const setPassword = async (data: SetPasswordRequest): Promise<SetPasswordResponse> => {
  const token = localStorage.getItem('banco_token') ?? '';
  console.log('[setPassword] enviando → id:', data.id, '| token:', token || '(vacío)');
  const res = await api.post<SetPasswordResponse>('/auth/set-password', data, {
    headers: { Authorization: token },
  });
  console.log('[setPassword] response:', res.data);
  return res.data;
};

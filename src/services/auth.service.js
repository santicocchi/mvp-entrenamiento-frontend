import { http } from '../api/httpClient';

// AuthController → /api/auth
export const authService = {
  // US-01 · POST /api/auth/register { nombre, email, contrasena, rol } → { id, nombre, email, rol }
  crearCuenta: (datos) => http.post('/auth/register', datos),

  // US-02 · POST /api/auth/login { email, contrasena } → { access_token, refresh_token, usuario }
  ingresar: (email, contrasena) => http.post('/auth/login', { email, contrasena }),
};

import { http } from '../api/httpClient';
import { aUsuario } from './usuario.service';

/** @typedef {import('./usuario.service').Usuario} Usuario */
/** @typedef {{ nombre: string, email: string, contrasena: string, rol: 'ENTRENADOR' | 'DEPORTISTA' }} DatosCuenta */
/** @typedef {{ accessToken: string, refreshToken: string, usuario: Usuario }} Sesion */

// AuthController → /api/auth
export const authService = {
  /**
   * US-01 · POST /api/auth/register { nombre, email, contrasena, rol } → Usuario
   * @param {DatosCuenta} datos
   */
  crearCuenta: async ({ nombre, email, contrasena, rol }) =>
    aUsuario(await http.post('/auth/register', { nombre, email, contrasena, rol })),

  /**
   * US-02 · POST /api/auth/login { email, contrasena } → Sesion
   * @returns {Promise<Sesion>}
   */
  ingresar: async (email, contrasena) => {
    const api = await http.post('/auth/login', { email, contrasena });
    return { accessToken: api.access_token, refreshToken: api.refresh_token, usuario: aUsuario(api.usuario) };
  },
};

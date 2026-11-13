import { http } from '../api/httpClient';

/** @typedef {{ id: number, nombre: string, email: string, rol: 'ENTRENADOR' | 'DEPORTISTA' }} Usuario */

/** @returns {Usuario} */
export function aUsuario(api) {
  return { id: api.id, nombre: api.nombre, email: api.email, rol: api.rol };
}

// UsuarioController → /api/usuario
export const usuarioService = {
  /** US-02 · GET /api/usuario/perfil → Usuario */
  obtenerPerfil: async () => aUsuario(await http.get('/usuario/perfil')),
};

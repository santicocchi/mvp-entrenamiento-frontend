import { http } from '../api/httpClient';

// UsuarioController → /api/usuario
export const usuarioService = {
  // GET /api/usuario/perfil → { id, nombre, email, rol }
  obtenerPerfil: () => http.get('/usuario/perfil'),
};

// Guarda la sesión del usuario (tokens + datos básicos) en localStorage.
const CLAVE = 'mvp-entrenamiento-sesion';

export const tokenStorage = {
  obtener() {
    try {
      return JSON.parse(localStorage.getItem(CLAVE)) ?? null;
    } catch {
      return null;
    }
  },
  guardar(sesion) {
    localStorage.setItem(CLAVE, JSON.stringify(sesion));
  },
  actualizarTokens(accessToken, refreshToken) {
    const sesion = this.obtener();
    if (!sesion) return;
    this.guardar({ ...sesion, access_token: accessToken, refresh_token: refreshToken });
  },
  limpiar() {
    localStorage.removeItem(CLAVE);
  },
  accessToken() {
    return this.obtener()?.access_token ?? null;
  },
  refreshToken() {
    return this.obtener()?.refresh_token ?? null;
  },
};

// Guarda la sesión del usuario { accessToken, refreshToken, usuario } en localStorage.
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
    this.guardar({ ...sesion, accessToken, refreshToken });
  },
  limpiar() {
    localStorage.removeItem(CLAVE);
  },
  accessToken() {
    return this.obtener()?.accessToken ?? null;
  },
  refreshToken() {
    return this.obtener()?.refreshToken ?? null;
  },
};

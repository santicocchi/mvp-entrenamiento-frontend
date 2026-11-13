import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/auth.service';
import { usuarioService } from '../services/usuario.service';
import { tokenStorage } from '../api/tokenStorage';
import { EVENTO_SESION_EXPIRADA } from '../api/httpClient';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => tokenStorage.obtener()?.usuario ?? null);

  useEffect(() => {
    const alExpirar = () => setUsuario(null);
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    return () => window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
  }, []);

  // Si hay una sesión guardada, se confirma con el back y se actualizan los datos del usuario.
  // Si el token ya no sirve, httpClient limpia la sesión y dispara EVENTO_SESION_EXPIRADA.
  useEffect(() => {
    const sesion = tokenStorage.obtener();
    if (!sesion?.accessToken) {
      if (sesion) salir(); // sesión vieja o incompleta
      return;
    }
    usuarioService
      .obtenerPerfil()
      .then((perfil) => {
        tokenStorage.guardar({ ...tokenStorage.obtener(), usuario: perfil });
        setUsuario(perfil);
      })
      .catch(() => {}); // sin conexión con el back: se mantiene la sesión guardada
  }, []);

  const ingresar = async (email, contrasena) => {
    const sesion = await authService.ingresar(email, contrasena);
    tokenStorage.guardar(sesion);
    setUsuario(sesion.usuario);
    return sesion.usuario;
  };

  const salir = () => {
    tokenStorage.limpiar();
    setUsuario(null);
  };

  return <AuthContext.Provider value={{ usuario, ingresar, salir }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const valor = useContext(AuthContext);
  if (!valor) throw new Error('useAuth tiene que usarse dentro de <AuthProvider>');
  return valor;
}

export const rutaInicialPorRol = (rol) => (rol === 'ENTRENADOR' ? '/entrenador/deportistas' : '/deportista/plan');

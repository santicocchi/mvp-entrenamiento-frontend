import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/auth.service';
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

  const ingresar = async (email, contrasena) => {
    const respuesta = await authService.ingresar(email, contrasena);
    tokenStorage.guardar(respuesta);
    setUsuario(respuesta.usuario);
    return respuesta.usuario;
  };

  const salir = () => {
    tokenStorage.limpiar();
    setUsuario(null);
  };

  return <AuthContext.Provider value={{ usuario, ingresar, salir }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

export const rutaInicialPorRol = (rol) => (rol === 'ENTRENADOR' ? '/entrenador/deportistas' : '/deportista/plan');

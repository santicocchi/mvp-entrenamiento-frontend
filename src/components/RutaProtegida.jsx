import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, rutaInicialPorRol } from '../context/AuthContext';

// Deja pasar solo si hay sesión y el rol coincide (el back igual lo valida con @Roles).
export default function RutaProtegida({ rol }) {
  const { usuario } = useAuth();
  if (!usuario) return <Navigate to="/login" replace />;
  if (rol && usuario.rol !== rol) return <Navigate to={rutaInicialPorRol(usuario.rol)} replace />;
  return <Outlet />;
}

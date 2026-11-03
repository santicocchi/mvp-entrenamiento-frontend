import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth, rutaInicialPorRol } from '../../context/AuthContext';
import { MensajeError } from '../../components/Estado';
import { USE_MOCKS } from '../../config';

// US-02
export default function Login() {
  const { usuario, ingresar } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (usuario) return <Navigate to={rutaInicialPorRol(usuario.rol)} replace />;

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const u = await ingresar(email, contrasena);
      navigate(rutaInicialPorRol(u.rol));
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="pantalla-acceso">
      <form className="tarjeta-acceso" onSubmit={enviar}>
        <h1 className="titulo-acceso">MVP Entrenamiento</h1>
        <p className="texto-suave">Ingresá con tu cuenta.</p>
        <label className="campo">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        </label>
        <label className="campo">
          Contraseña
          <input type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} required autoComplete="current-password" />
        </label>
        <MensajeError>{error}</MensajeError>
        <button className="boton" disabled={enviando}>{enviando ? 'Ingresando…' : 'Ingresar'}</button>
        <p className="texto-suave">¿No tenés cuenta? <Link to="/registro">Crear cuenta</Link></p>
        {USE_MOCKS && (
          <p className="ayuda-demo">
            Demo: laura@gym.com (entrenadora) o juan@gym.com (deportista), contraseña clave1234.
          </p>
        )}
      </form>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { MensajeError } from '../../components/Estado';

// US-01: nombre, email, contraseña y rol, todos obligatorios
export default function Registro() {
  const navigate = useNavigate();
  const [datos, setDatos] = useState({ nombre: '', email: '', contrasena: '', rol: 'DEPORTISTA' });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await authService.crearCuenta(datos);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="pantalla-acceso">
      <form className="tarjeta-acceso" onSubmit={enviar} noValidate>
        <h1 className="titulo-acceso">Crear cuenta</h1>
        <label className="campo">
          Nombre
          <input value={datos.nombre} onChange={cambiar('nombre')} required />
        </label>
        <label className="campo">
          Email
          <input type="email" value={datos.email} onChange={cambiar('email')} required />
        </label>
        <label className="campo">
          Contraseña
          <input type="password" value={datos.contrasena} onChange={cambiar('contrasena')} required minLength={8} />
          <small className="texto-suave">Al menos 8 caracteres, con una letra y un número.</small>
        </label>
        <fieldset className="campo selector-rol">
          <legend>Soy</legend>
          <label><input type="radio" name="rol" value="DEPORTISTA" checked={datos.rol === 'DEPORTISTA'} onChange={cambiar('rol')} /> Deportista</label>
          <label><input type="radio" name="rol" value="ENTRENADOR" checked={datos.rol === 'ENTRENADOR'} onChange={cambiar('rol')} /> Entrenador</label>
        </fieldset>
        <MensajeError>{error}</MensajeError>
        <button className="boton" disabled={enviando}>{enviando ? 'Creando…' : 'Crear cuenta'}</button>
        <p className="texto-suave">¿Ya tenés cuenta? <Link to="/login">Ingresar</Link></p>
      </form>
    </div>
  );
}

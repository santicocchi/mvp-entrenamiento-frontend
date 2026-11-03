import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { USE_MOCKS } from '../config';

const MENU = {
  ENTRENADOR: [
    { a: '/entrenador/deportistas', texto: 'Deportistas' },
    { a: '/entrenador/planes', texto: 'Planes' },
    { a: '/entrenador/catalogo', texto: 'Catálogo' },
  ],
  DEPORTISTA: [
    { a: '/deportista/plan', texto: 'Mi plan' },
    { a: '/deportista/sesiones', texto: 'Sesiones' },
    { a: '/deportista/progreso', texto: 'Progreso' },
    { a: '/deportista/mediciones', texto: 'Mediciones' },
  ],
};

export default function Layout() {
  const { usuario, salir } = useAuth();

  return (
    <div className="app">
      <header className="barra">
        <div className="barra-interior">
          <span className="marca">MVP Entrenamiento</span>
          <nav className="menu">
            {MENU[usuario.rol].map((item) => (
              <NavLink key={item.a} to={item.a} className="menu-item">
                {item.texto}
              </NavLink>
            ))}
          </nav>
          <div className="usuario">
            <span>{usuario.nombre}</span>
            <button type="button" className="boton-texto" onClick={salir}>Salir</button>
          </div>
        </div>
      </header>
      {USE_MOCKS && <p className="aviso-mocks">Modo demo: datos en memoria, sin backend.</p>}
      <main className="contenido">
        <Outlet />
      </main>
    </div>
  );
}

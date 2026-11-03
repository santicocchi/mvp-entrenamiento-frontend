import { Link } from 'react-router-dom';
import { planesService } from '../../services/planes.service';
import { useCarga } from '../../hooks/useCarga';
import { Cargando, MensajeError, Vacio } from '../../components/Estado';

// US-11
export default function Planes() {
  const { datos: planes, cargando, error } = useCarga(() => planesService.listar());

  return (
    <section>
      <div className="encabezado">
        <h1>Mis planes</h1>
        <Link className="boton" to="/entrenador/planes/nuevo">Armar plan</Link>
      </div>
      {cargando && <Cargando />}
      <MensajeError>{error?.message}</MensajeError>
      {planes?.length === 0 && <Vacio>Todavía no armaste ningún plan.</Vacio>}
      {planes?.length > 0 && (
        <ul className="lista-planes">
          {planes.map((p) => (
            <li key={p.id}>
              <Link to={`/entrenador/planes/${p.id}`} className="plan-item">
                <strong>{p.nombre}</strong>
                <span className="texto-suave">{p.rutinas.join(', ')}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

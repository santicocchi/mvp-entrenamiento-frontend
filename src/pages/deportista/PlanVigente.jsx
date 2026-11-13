import { Link } from 'react-router-dom';
import { planVigenteService } from '../../services/plan-vigente.service';
import { useCarga } from '../../hooks/useCarga';
import { Cargando, MensajeError, Vacio } from '../../components/Estado';
import { formatearFecha } from '../../utils/fechas';

// US-13
export default function PlanVigente() {
  const { datos: plan, cargando, error } = useCarga(() => planVigenteService.obtener());

  if (cargando) return <Cargando />;
  if (error?.status === 404) return <Vacio>No tenés un plan vigente. Pedile uno a tu entrenador.</Vacio>;
  if (error) return <MensajeError>{error.message}</MensajeError>;

  return (
    <section>
      <h1>{plan.nombre}</h1>
      <p className="texto-suave">
        Armado por {plan.entrenador_nombre}. Vigente del {formatearFecha(plan.vigencia.desde)} al {formatearFecha(plan.vigencia.hasta)}.
      </p>
      {plan.indicaciones && <p className="indicaciones">{plan.indicaciones}</p>}

      <div className="grilla-rutinas">
        {plan.rutinas.map((r) => (
          <article key={r.id} className="rutina">
            <div className="encabezado">
              <h2>{r.nombre}</h2>
              <Link className="boton" to={`/deportista/entrenar/${r.id}`}>Entrenar</Link>
            </div>
            <ol className="lista-ejercicios">
              {r.dosificaciones.map((d) => (
                <li key={d.ejercicio_id}>
                  <span className="numero-serie">{d.orden}</span>
                  <span>{d.ejercicio_nombre}</span>
                  <span className="dosis">{d.series_objetivo} × {d.reps_min}–{d.reps_max} · RIR {d.rir_objetivo}</span>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>
    </section>
  );
}

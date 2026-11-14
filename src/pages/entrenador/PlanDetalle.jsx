import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { planesService } from '../../services/planes.service';
import { useCarga } from '../../hooks/useCarga';
import { Cargando, MensajeError } from '../../components/Estado';
import AsignarPlan from '../../components/plan/AsignarPlan';

// Detalle (CU22) + modificar (US-09) + duplicar (US-10) + asignar (US-08)
export default function PlanDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { datos: plan, cargando, error } = useCarga(() => planesService.obtener(id), [id]);
  const [errorAccion, setErrorAccion] = useState(null);

  const duplicar = async () => {
    setErrorAccion(null);
    try {
      const nuevo = await planesService.duplicar(id);
      navigate(`/entrenador/planes/${nuevo.id}`);
    } catch (e) {
      setErrorAccion(e.message);
    }
  };

  if (cargando) return <Cargando />;
  if (error) return <MensajeError>{error.message}</MensajeError>;

  return (
    <section>
      <Link to="/entrenador/planes" className="volver">Volver a planes</Link>
      <div className="encabezado">
        <h1>{plan.nombre}</h1>
        <div className="grupo-botones">
          {/* Si el plan ya empezó, el back responde 422 "El plan ya empezó; no se puede modificar." al guardar */}
          <Link className="boton-secundario" to={`/entrenador/planes/${id}/editar`}>Modificar</Link>
          <button type="button" className="boton-secundario" onClick={duplicar}>Duplicar</button>
        </div>
      </div>
      <MensajeError>{errorAccion}</MensajeError>
      {plan.indicaciones && <p className="indicaciones">{plan.indicaciones}</p>}

      <div className="grilla-rutinas">
        {plan.rutinas.map((r) => (
          <article key={r.id ?? r.nombre} className="rutina">
            <h2>{r.nombre}</h2>
            <ol className="lista-ejercicios">
              {r.dosificaciones.map((d) => (
                <li key={d.ejercicioId}>
                  <span className="numero-serie">{d.orden}</span>
                  <span>{d.ejercicioNombre}</span>
                  <span className="dosis">{d.seriesObjetivo} × {d.repsMin}–{d.repsMax} · RIR {d.rirObjetivo}</span>
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>

      <AsignarPlan planId={id} />
    </section>
  );
}

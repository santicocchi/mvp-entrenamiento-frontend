import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { planesService } from '../../services/planes.service';
import { deportistasService } from '../../services/deportistas.service';
import { useCarga } from '../../hooks/useCarga';
import { Cargando, MensajeError, MensajeOk } from '../../components/Estado';
import { hoy } from '../../utils/fechas';

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

function AsignarPlan({ planId }) {
  const { datos: deportistas } = useCarga(() => deportistasService.listar());
  const [form, setForm] = useState({ deportista_id: '', vigencia_desde: hoy(), vigencia_hasta: '' });
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(null);

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const asignar = async (e) => {
    e.preventDefault();
    setError(null);
    setOk(null);
    try {
      await planesService.asignar(planId, { ...form, deportista_id: Number(form.deportista_id) });
      const nombre = deportistas.find((d) => d.id === Number(form.deportista_id))?.nombre;
      setOk(`Plan asignado a ${nombre}.`);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="bloque-asignar" onSubmit={asignar}>
      <h2>Asignar a un deportista</h2>
      <div className="fila-formulario">
        <label className="campo campo-ancho">
          Deportista
          <select value={form.deportista_id} onChange={cambiar('deportista_id')} required>
            <option value="">Elegí un deportista</option>
            {deportistas?.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
          </select>
        </label>
        <label className="campo">
          Desde
          <input type="date" value={form.vigencia_desde} onChange={cambiar('vigencia_desde')} required />
        </label>
        <label className="campo">
          Hasta
          <input type="date" value={form.vigencia_hasta} onChange={cambiar('vigencia_hasta')} required />
        </label>
        <button className="boton">Asignar</button>
      </div>
      <MensajeError>{error}</MensajeError>
      <MensajeOk>{ok}</MensajeOk>
    </form>
  );
}

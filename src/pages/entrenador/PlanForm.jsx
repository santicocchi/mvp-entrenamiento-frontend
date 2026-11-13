import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useArmarPlan } from '../../hooks/useArmarPlan';
import { useCarga } from '../../hooks/useCarga';
import { planesService } from '../../services/planes.service';
import { ejerciciosService } from '../../services/ejercicios.service';
import { deportistasService } from '../../services/deportistas.service';
import { Cargando, MensajeError } from '../../components/Estado';
import EditorRutina from '../../components/plan/EditorRutina';
import GraficoEvolucion from '../../components/GraficoEvolucion';

// Ruta /entrenador/planes/nuevo y /entrenador/planes/:id/editar
export default function PlanForm() {
  const { id } = useParams();
  const { datos: plan, cargando, error } = useCarga(() => (id ? planesService.obtener(id) : Promise.resolve(null)), [id]);

  if (cargando) return <Cargando />;
  if (error) return <MensajeError>{error.message}</MensajeError>;
  return <EditorPlan planId={id} planExistente={plan} />;
}

// US-06, US-07, US-09
function EditorPlan({ planId, planExistente }) {
  const navigate = useNavigate();
  const { plan, acciones, guardar, guardando, error } = useArmarPlan(planExistente);
  const { datos: deportistas } = useCarga(() => deportistasService.listar());
  // El catálogo se carga una sola vez y se comparte con todas las rutinas
  const { datos: catalogo, error: errorCatalogo } = useCarga(() => ejerciciosService.listar());
  const [deportistaHistorial, setDeportistaHistorial] = useState('');
  // Se edita una rutina a la vez (pestañas); si la elegida ya no existe, queda la primera
  const [claveActiva, setClaveActiva] = useState(null);
  const rutinaActiva = plan.rutinas.find((r) => r.clave === claveActiva) ?? plan.rutinas[0];

  // Al quitar la rutina abierta se pasa a la pestaña anterior (o a la siguiente si era la primera)
  const quitarRutinaActiva = (clave) => {
    const indice = plan.rutinas.findIndex((r) => r.clave === clave);
    const vecina = plan.rutinas[indice - 1] ?? plan.rutinas[indice + 1];
    acciones.quitarRutina(clave);
    if (vecina) setClaveActiva(vecina.clave);
  };

  const ejerciciosPorId = useMemo(() => new Map((catalogo ?? []).map((e) => [e.id, e])), [catalogo]);
  const totalEjercicios = plan.rutinas.reduce((suma, r) => suma + r.dosificaciones.length, 0);

  const enviar = async (e) => {
    e.preventDefault();
    const idGuardado = await guardar(planId);
    if (idGuardado) navigate(`/entrenador/planes/${idGuardado}`);
  };

  // Corrección del profe / CU19: al armar el plan, ver el peso máximo por sesión del deportista en ese ejercicio
  const renderHistorial = deportistaHistorial
    ? (ejercicioId) => <HistorialEjercicio deportistaId={deportistaHistorial} ejercicioId={ejercicioId} />
    : undefined;

  return (
    <form onSubmit={enviar} className="armar-plan" noValidate>
      <Link to={planId ? `/entrenador/planes/${planId}` : '/entrenador/planes'} className="volver">Cancelar</Link>
      <h1>{planId ? 'Modificar plan' : 'Armar plan'}</h1>
      <p className="texto-suave">Definí las rutinas y la dosificación de cada ejercicio. Podés guardarlo sin asignarlo todavía.</p>

      <section className="seccion-plan">
        <h2>Datos del plan</h2>
        <label className="campo">
          Nombre del plan
          <input value={plan.nombre} onChange={(e) => acciones.cambiarDatos('nombre', e.target.value)} placeholder="Ej.: Fuerza" required />
        </label>
        <label className="campo">
          Indicaciones generales <span className="texto-suave">(opcional)</span>
          <textarea
            rows={2}
            value={plan.indicaciones}
            onChange={(e) => acciones.cambiarDatos('indicaciones', e.target.value)}
            placeholder="Entrada en calor, pausas, velocidad de ejecución…"
          />
        </label>
        <div className="panel-historial">
          <label className="campo">
            Deportista (opcional)
            <select value={deportistaHistorial} onChange={(e) => setDeportistaHistorial(e.target.value)}>
              <option value="">Ninguno</option>
              {deportistas?.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
            </select>
          </label>
        </div>
      </section>

      <h2>Rutinas</h2>
      <MensajeError>{errorCatalogo?.message}</MensajeError>

      <div className="pestanas" role="tablist" aria-label="Rutinas del plan">
        {plan.rutinas.map((r, i) => (
          <button
            key={r.clave}
            type="button"
            role="tab"
            aria-selected={r.clave === rutinaActiva.clave}
            className={`pestana ${r.clave === rutinaActiva.clave ? 'pestana-activa' : ''}`}
            onClick={() => setClaveActiva(r.clave)}
          >
            {r.nombre.trim() || `Rutina ${i + 1}`}
            <span className={`pestana-cantidad ${r.dosificaciones.length === 0 ? 'pestana-vacia' : ''}`}>{r.dosificaciones.length}</span>
          </button>
        ))}
        <button type="button" className="pestana pestana-agregar" onClick={() => setClaveActiva(acciones.agregarRutina())}>
          + Agregar rutina
        </button>
      </div>

      <div role="tabpanel">
        <EditorRutina
          key={rutinaActiva.clave}
          numero={plan.rutinas.indexOf(rutinaActiva) + 1}
          rutina={rutinaActiva}
          catalogo={catalogo}
          ejerciciosPorId={ejerciciosPorId}
          acciones={{ ...acciones, quitarRutina: quitarRutinaActiva }}
          puedeQuitarse={plan.rutinas.length > 1}
          renderHistorial={renderHistorial}
        />
      </div>

      <div className="barra-guardar">
        <div>
          <span className="resumen-plan">
            {plan.rutinas.length} {plan.rutinas.length === 1 ? 'rutina' : 'rutinas'} · {totalEjercicios} {totalEjercicios === 1 ? 'ejercicio' : 'ejercicios'}
          </span>
          <MensajeError>{error}</MensajeError>
        </div>
        <button className="boton" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar plan'}</button>
      </div>
    </form>
  );
}

function HistorialEjercicio({ deportistaId, ejercicioId }) {
  const { datos, cargando, error } = useCarga(
    () => deportistasService.progresoEnEjercicio(deportistaId, ejercicioId),
    [deportistaId, ejercicioId],
  );
  if (cargando) return <Cargando />;
  if (error) return <MensajeError>{error.message}</MensajeError>;
  if (!datos.length) return <p className="texto-suave">Nunca hizo este ejercicio.</p>;
  return (
    <GraficoEvolucion
      datos={datos}
      series={[{ clave: 'peso_maximo', nombre: 'Peso máximo', color: '#12607a' }]}
      alto={200}
    />
  );
}

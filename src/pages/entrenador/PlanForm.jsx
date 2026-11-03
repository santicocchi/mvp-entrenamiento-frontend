import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useArmarPlan } from '../../hooks/useArmarPlan';
import { useCarga } from '../../hooks/useCarga';
import { planesService } from '../../services/planes.service';
import { ejerciciosService } from '../../services/ejercicios.service';
import { deportistasService } from '../../services/deportistas.service';
import { Cargando, MensajeError, Vacio } from '../../components/Estado';
import { GRUPOS } from './Catalogo';
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
  const [deportistaHistorial, setDeportistaHistorial] = useState('');

  const enviar = async (e) => {
    e.preventDefault();
    const idGuardado = await guardar(planId);
    if (idGuardado) navigate(`/entrenador/planes/${idGuardado}`);
  };

  return (
    <form onSubmit={enviar}>
      <Link to={planId ? `/entrenador/planes/${planId}` : '/entrenador/planes'} className="volver">Cancelar</Link>
      <h1>{planId ? 'Modificar plan' : 'Armar plan'}</h1>

      <div className="grilla-2">
        <label className="campo">
          Nombre del plan
          <input value={plan.nombre} onChange={(e) => acciones.cambiarDatos('nombre', e.target.value)} required />
        </label>
        <label className="campo">
          Ver historial de un deportista mientras armás
          <select value={deportistaHistorial} onChange={(e) => setDeportistaHistorial(e.target.value)}>
            <option value="">Ninguno</option>
            {deportistas?.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
          </select>
        </label>
      </div>
      <label className="campo">
        Indicaciones
        <textarea rows={2} value={plan.indicaciones} onChange={(e) => acciones.cambiarDatos('indicaciones', e.target.value)} />
      </label>

      {plan.rutinas.map((rutina) => (
        <EditorRutina
          key={rutina.clave}
          rutina={rutina}
          acciones={acciones}
          puedeQuitarse={plan.rutinas.length > 1}
          deportistaHistorial={deportistaHistorial}
        />
      ))}

      <button type="button" className="boton-secundario" onClick={acciones.agregarRutina}>Agregar rutina</button>

      <MensajeError>{error}</MensajeError>
      <div className="acciones-pie">
        <button className="boton" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar plan'}</button>
      </div>
    </form>
  );
}

function EditorRutina({ rutina, acciones, puedeQuitarse, deportistaHistorial }) {
  const [grupo, setGrupo] = useState('');
  const [ejercicioElegido, setEjercicioElegido] = useState('');
  const { datos: catalogo } = useCarga(() => ejerciciosService.listar(grupo), [grupo]);
  const disponibles = catalogo?.filter((e) => !rutina.dosificaciones.some((d) => d.ejercicio_id === e.id)) ?? [];

  const agregar = () => {
    const ejercicio = catalogo?.find((e) => e.id === Number(ejercicioElegido));
    if (ejercicio) acciones.agregarEjercicio(rutina.clave, ejercicio);
    setEjercicioElegido('');
  };

  const numero = (campo, d, min = 0) => (
    <input
      type="number"
      min={min}
      value={d[campo]}
      onChange={(e) => acciones.cambiarDosificacion(rutina.clave, d.ejercicio_id, campo, e.target.value)}
      aria-label={campo}
    />
  );

  return (
    <fieldset className="bloque-rutina">
      <div className="encabezado">
        <input
          className="input-titulo"
          value={rutina.nombre}
          onChange={(e) => acciones.renombrarRutina(rutina.clave, e.target.value)}
          aria-label="Nombre de la rutina"
          required
        />
        {puedeQuitarse && (
          <button type="button" className="boton-texto" onClick={() => acciones.quitarRutina(rutina.clave)}>Quitar rutina</button>
        )}
      </div>

      {rutina.dosificaciones.length === 0 && <Vacio>Agregá al menos un ejercicio del catálogo.</Vacio>}
      {rutina.dosificaciones.length > 0 && (
        <div className="tabla-contenedor">
          <table className="tabla tabla-dosificacion">
            <thead>
              <tr><th>Orden</th><th>Ejercicio</th><th>Series</th><th>Reps mín.</th><th>Reps máx.</th><th>RIR</th><th></th></tr>
            </thead>
            <tbody>
              {rutina.dosificaciones.map((d, i) => (
                <FilaDosificacion
                  key={d.ejercicio_id}
                  d={d}
                  indice={i}
                  total={rutina.dosificaciones.length}
                  numero={numero}
                  onMover={(dir) => acciones.moverEjercicio(rutina.clave, i, dir)}
                  onQuitar={() => acciones.quitarEjercicio(rutina.clave, d.ejercicio_id)}
                  deportistaHistorial={deportistaHistorial}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="fila-formulario">
        <label className="campo">
          Grupo
          <select value={grupo} onChange={(e) => setGrupo(e.target.value)}>
            {GRUPOS.map((g) => <option key={g.valor} value={g.valor}>{g.texto}</option>)}
          </select>
        </label>
        <label className="campo campo-ancho">
          Ejercicio
          <select value={ejercicioElegido} onChange={(e) => setEjercicioElegido(e.target.value)}>
            <option value="">Elegí un ejercicio</option>
            {disponibles.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </label>
        <button type="button" className="boton-secundario" onClick={agregar} disabled={!ejercicioElegido}>Agregar ejercicio</button>
      </div>
    </fieldset>
  );
}

function FilaDosificacion({ d, indice, total, numero, onMover, onQuitar, deportistaHistorial }) {
  const [verHistorial, setVerHistorial] = useState(false);

  return (
    <>
      <tr>
        <td className="celda-orden">
          <button type="button" className="boton-icono" onClick={() => onMover(-1)} disabled={indice === 0} aria-label="Subir">↑</button>
          <button type="button" className="boton-icono" onClick={() => onMover(1)} disabled={indice === total - 1} aria-label="Bajar">↓</button>
        </td>
        <td>{d.ejercicio_nombre}</td>
        <td>{numero('series_objetivo', d, 1)}</td>
        <td>{numero('reps_min', d, 1)}</td>
        <td>{numero('reps_max', d, 1)}</td>
        <td>{numero('rir_objetivo', d, 0)}</td>
        <td className="celda-acciones">
          {deportistaHistorial && (
            <button type="button" className="boton-texto" onClick={() => setVerHistorial(!verHistorial)}>
              {verHistorial ? 'Ocultar historial' : 'Historial'}
            </button>
          )}
          <button type="button" className="boton-texto" onClick={onQuitar}>Quitar</button>
        </td>
      </tr>
      {deportistaHistorial && verHistorial && (
        <tr className="fila-historial">
          <td colSpan={7}>
            <HistorialEjercicio deportistaId={deportistaHistorial} ejercicioId={d.ejercicio_id} />
          </td>
        </tr>
      )}
    </>
  );
}

// Corrección del profe / CU19: al armar el plan, ver el peso máximo por sesión del deportista en ese ejercicio.
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

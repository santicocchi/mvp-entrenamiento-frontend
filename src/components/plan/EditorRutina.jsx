import { useState } from 'react';
import { textoClasificacion } from '../../utils/grupos-musculares';
import { Vacio } from '../Estado';
import SelectorEjercicios from './SelectorEjercicios';

// Una rutina del plan en armado: nombre, ejercicios con su dosificación (en orden) y el selector del catálogo.
// Todo llega por props; `renderHistorial(ejercicioId)` es opcional (peso máximo del deportista elegido).
export default function EditorRutina({ numero, rutina, catalogo, ejerciciosPorId, acciones, puedeQuitarse, renderHistorial }) {
  const yaAgregados = new Set(rutina.dosificaciones.map((d) => d.ejercicioId));

  return (
    <section className="rutina-editor">
      <div className="rutina-cabecera">
        <span className="numero-serie" aria-hidden="true">{numero}</span>
        <input
          className="input-titulo"
          value={rutina.nombre}
          onChange={(e) => acciones.renombrarRutina(rutina.clave, e.target.value)}
          aria-label="Nombre de la rutina"
          placeholder="Nombre de la rutina"
          required
        />
        <span className="texto-suave">
          {rutina.dosificaciones.length} {rutina.dosificaciones.length === 1 ? 'ejercicio' : 'ejercicios'}
        </span>
        {puedeQuitarse && (
          <button type="button" className="boton-texto" onClick={() => acciones.quitarRutina(rutina.clave)}>Quitar rutina</button>
        )}
      </div>

      {rutina.dosificaciones.length === 0 ? (
        <Vacio>Esta rutina todavía no tiene ejercicios. Agregá al menos uno del catálogo.</Vacio>
      ) : (
        <ol className="ejercicios-rutina">
          {rutina.dosificaciones.map((d, i) => (
            <FilaEjercicio
              key={d.ejercicioId}
              d={d}
              indice={i}
              total={rutina.dosificaciones.length}
              ejercicio={ejerciciosPorId.get(d.ejercicioId)}
              onCambiar={(campo, valor) => acciones.cambiarDosificacion(rutina.clave, d.ejercicioId, campo, valor)}
              onMover={(direccion) => acciones.moverEjercicio(rutina.clave, i, direccion)}
              onQuitar={() => acciones.quitarEjercicio(rutina.clave, d.ejercicioId)}
              renderHistorial={renderHistorial}
            />
          ))}
        </ol>
      )}

      <SelectorEjercicios catalogo={catalogo} yaAgregados={yaAgregados} onAgregar={(e) => acciones.agregarEjercicio(rutina.clave, e)} />
    </section>
  );
}

function CampoDosis({ etiqueta, titulo, valor, min, onChange }) {
  return (
    <label className="campo-mini" title={titulo}>
      {etiqueta}
      <input type="number" inputMode="numeric" min={min} value={valor} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function FilaEjercicio({ d, indice, total, ejercicio, onCambiar, onMover, onQuitar, renderHistorial }) {
  const [verHistorial, setVerHistorial] = useState(false);
  const historial = renderHistorial?.(d.ejercicioId);
  // El nombre sale del catálogo; si todavía no cargó, del que trae el plan
  const nombre = ejercicio?.nombre ?? d.ejercicioNombre ?? `Ejercicio ${d.ejercicioId}`;

  return (
    <li className="fila-ejercicio">
      <div className="fila-principal">
        <div className="orden-ejercicio">
          <span className="numero-serie">{indice + 1}</span>
          <div className="mover">
            <button type="button" className="boton-icono" onClick={() => onMover(-1)} disabled={indice === 0} aria-label={`Subir ${nombre}`}>↑</button>
            <button type="button" className="boton-icono" onClick={() => onMover(1)} disabled={indice === total - 1} aria-label={`Bajar ${nombre}`}>↓</button>
          </div>
        </div>

        <div className="ejercicio-nombre">
          <strong>{nombre}</strong>
          {ejercicio && (
            <span className={`etiqueta etiqueta-${ejercicio.grupo_muscular.toLowerCase()}`}>
              {textoClasificacion(ejercicio.grupo_muscular, ejercicio.subgrupo)}
            </span>
          )}
        </div>

        <div className="dosis-campos">
          <CampoDosis etiqueta="Series" valor={d.seriesObjetivo} min={1} onChange={(v) => onCambiar('seriesObjetivo', v)} />
          <CampoDosis etiqueta="Reps mín." valor={d.repsMin} min={1} onChange={(v) => onCambiar('repsMin', v)} />
          <CampoDosis etiqueta="Reps máx." valor={d.repsMax} min={1} onChange={(v) => onCambiar('repsMax', v)} />
          <CampoDosis etiqueta="RIR" titulo="Repeticiones en reserva" valor={d.rirObjetivo} min={0} onChange={(v) => onCambiar('rirObjetivo', v)} />
        </div>

        <div className="acciones-ejercicio">
          {historial && (
            <button type="button" className="boton-texto" onClick={() => setVerHistorial(!verHistorial)}>
              {verHistorial ? 'Ocultar historial' : 'Ver historial'}
            </button>
          )}
          <button type="button" className="boton-texto" onClick={onQuitar}>Quitar</button>
        </div>
      </div>

      {historial && verHistorial && <div className="historial-ejercicio">{historial}</div>}
    </li>
  );
}

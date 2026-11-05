import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useRegistrarSerie } from '../../hooks/useRegistrarSerie';
import { useCarga } from '../../hooks/useCarga';
import { planVigenteService } from '../../services/plan-vigente.service';
import { ejerciciosService } from '../../services/ejercicios.service';
import { Cargando, MensajeError, Vacio } from '../../components/Estado';
import FormularioSerie from '../../components/entrenar/FormularioSerie';
import { formatearFecha } from '../../utils/fechas';

// Pantalla principal del deportista: US-14, US-15, US-16, US-17, US-18
export default function Entrenar() {
  const { rutinaId } = useParams();
  const plan = useCarga(() => planVigenteService.obtener());
  const { sesion, cargando, error, errorActualizacion, actualizando, enviando, recargar, registrar, corregir, record, cerrarRecord } = useRegistrarSerie(rutinaId);

  if (plan.cargando || cargando) return <Cargando />;
  if (plan.error?.status === 404 || (!plan.error && !plan.datos)) return <Vacio>No tenés un plan vigente. Pedile uno a tu entrenador.</Vacio>;
  if (plan.error) return <MensajeError>{plan.error.message}</MensajeError>;
  if (error) return <MensajeError>{error}</MensajeError>;

  const rutina = plan.datos.rutinas.find((r) => r.id === Number(rutinaId));
  if (!rutina) return <Vacio>La rutina no pertenece a tu plan vigente.</Vacio>;
  if (!sesion || !rutina.dosificaciones.length) return <Vacio>La rutina no tiene ejercicios para registrar.</Vacio>;
  const nombreDe = (ejercicioId) => rutina.dosificaciones.find((d) => d.ejercicioId === ejercicioId)?.ejercicioNombre;

  return (
    <section>
      <Link to="/deportista/plan" className="volver">Volver al plan</Link>
      <div className="encabezado">
        <h1>{rutina.nombre}</h1>
        <div className="cumplimiento-sesion">
          <span className="numero-grande">{sesion.cumplimiento}%</span>
          <span className="texto-suave">de la sesión</span>
        </div>
      </div>

      {errorActualizacion && (
        <div>
          <p>La serie quedó guardada. Actualizá la sesión antes de seguir.</p>
          <MensajeError>{errorActualizacion}</MensajeError>
          <button type="button" className="boton-secundario" disabled={actualizando} onClick={recargar}>{actualizando ? 'Actualizando…' : 'Actualizar sesión'}</button>
        </div>
      )}

      {record && (
        <div className="aviso-record" role="status">
          <div>
            <strong>Nuevo récord personal</strong>
            <span>{nombreDe(record.ejercicioId)}: {record.peso} kg × {record.repeticiones}</span>
          </div>
          <button type="button" className="boton-texto" onClick={cerrarRecord}>Cerrar</button>
        </div>
      )}

      <div className="lista-ejercicios-sesion">
        {rutina.dosificaciones.map((d) => (
          <EjercicioSesion
            key={`${rutinaId}-${d.ejercicioId}`}
            dosificacion={d}
            series={sesion.ejercicios.find((e) => e.ejercicioId === d.ejercicioId)?.series ?? []}
            onRegistrar={(valores) => registrar(d.ejercicioId, valores)}
            onCorregir={(serieId, valores) => corregir(serieId, d.ejercicioId, valores)}
            deshabilitado={enviando || actualizando || Boolean(errorActualizacion)}
          />
        ))}
      </div>
    </section>
  );
}

function EjercicioSesion({ dosificacion: d, series, onRegistrar, onCorregir, deshabilitado }) {
  const historial = useCarga(() => ejerciciosService.ultimasSeries(d.ejercicioId), [d.ejercicioId]);
  const ultima = series[series.length - 1] ?? historial.datos?.series.at(-1);
  const [corrigiendo, setCorrigiendo] = useState(null);
  const completo = series.length >= d.seriesObjetivo;

  return (
    <article className={`ejercicio ${completo ? 'ejercicio-completo' : ''}`}>
      <header className="encabezado">
        <div>
          <h2>{d.ejercicioNombre}</h2>
          <span className="dosis">{d.seriesObjetivo} × {d.repsMin}–{d.repsMax} · RIR {d.rirObjetivo}</span>
        </div>
        {/* US-16 */}
        <span className="contador-series">{series.length} de {d.seriesObjetivo} series</span>
      </header>

      <UltimaVez {...historial} />

      {series.length > 0 && (
        <ol className="series-hoy">
          {series.map((s) =>
            corrigiendo === s.id ? (
              <li key={s.id}>
                <FormCorreccion
                  serie={s}
                  onCancelar={() => setCorrigiendo(null)}
                  onGuardar={async (v) => {
                    const err = await onCorregir(s.id, v);
                    if (!err) setCorrigiendo(null);
                    return err;
                  }}
                />
              </li>
            ) : (
              <li key={s.id}>
                <span className="numero-serie">{s.numero}</span>
                <span>{s.peso} kg × {s.repeticiones} · RIR {s.rir}</span>
                <button type="button" className="boton-texto" disabled={deshabilitado} onClick={() => setCorrigiendo(s.id)}>Corregir</button>
              </li>
            ),
          )}
        </ol>
      )}

      <FormularioSerie ultimaSerie={ultima} repeticionesObjetivo={d.repsMax} rirObjetivo={d.rirObjetivo} onRegistrar={onRegistrar} deshabilitado={deshabilitado} />
    </article>
  );
}

// US-14: lo que hizo la última vez, visible al abrir el ejercicio (O2)
function UltimaVez({ datos, cargando, error }) {
  if (cargando) return null;
  if (error) return <MensajeError>{error.message}</MensajeError>;
  if (!datos?.fecha) return <p className="ultima-vez texto-suave">Primera vez con este ejercicio.</p>;
  return (
    <p className="ultima-vez">
      <span className="texto-suave">Última vez, {formatearFecha(datos.fecha)}:</span>{' '}
      {datos.series.map((s) => `${s.peso} × ${s.repeticiones}`).join(', ')}
    </p>
  );
}

function CamposSerie({ valores, onChange }) {
  const cambiar = (campo) => (e) => onChange({ ...valores, [campo]: e.target.value });
  return (
    <div className="campos-serie">
      <label className="campo">
        Peso (kg)
        <input type="number" step="0.5" min="0" inputMode="decimal" value={valores.peso} onChange={cambiar('peso')} required />
      </label>
      <label className="campo">
        Reps
        <input type="number" min="1" inputMode="numeric" value={valores.repeticiones} onChange={cambiar('repeticiones')} required />
      </label>
      <label className="campo">
        RIR
        <input type="number" min="0" inputMode="numeric" value={valores.rir} onChange={cambiar('rir')} required />
      </label>
    </div>
  );
}

// US-17: solo el mismo día (RN8, lo valida el back)
function FormCorreccion({ serie, onGuardar, onCancelar }) {
  const [valores, setValores] = useState({ peso: serie.peso, repeticiones: serie.repeticiones, rir: serie.rir });
  const [error, setError] = useState(null);

  const guardar = async (e) => {
    e.preventDefault();
    setError(await onGuardar(valores));
  };

  return (
    <form className="form-correccion" onSubmit={guardar}>
      <span className="numero-serie">{serie.numero}</span>
      <CamposSerie valores={valores} onChange={setValores} />
      <div className="grupo-botones">
        <button className="boton">Guardar</button>
        <button type="button" className="boton-texto" onClick={onCancelar}>Cancelar</button>
      </div>
      <MensajeError>{error}</MensajeError>
    </form>
  );
}

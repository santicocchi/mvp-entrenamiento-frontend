import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useRegistrarSerie } from '../../hooks/useRegistrarSerie';
import { useCarga } from '../../hooks/useCarga';
import { planVigenteService } from '../../services/plan-vigente.service';
import { ejerciciosService } from '../../services/ejercicios.service';
import { Cargando, MensajeError } from '../../components/Estado';
import { formatearFecha } from '../../utils/fechas';

// Pantalla principal del deportista: US-14, US-15, US-16, US-17, US-18
export default function Entrenar() {
  const { rutinaId } = useParams();
  const plan = useCarga(() => planVigenteService.obtener());
  const { sesion, cargando, error, registrar, corregir, record, cerrarRecord } = useRegistrarSerie(rutinaId);

  if (plan.cargando || cargando) return <Cargando />;
  if (plan.error) return <MensajeError>{plan.error.message}</MensajeError>;
  if (error) return <MensajeError>{error}</MensajeError>;

  const rutina = plan.datos.rutinas.find((r) => r.id === Number(rutinaId));
  const nombreDe = (ejercicioId) => rutina.dosificaciones.find((d) => d.ejercicio_id === ejercicioId)?.ejercicio_nombre;

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
            key={d.ejercicio_id}
            dosificacion={d}
            series={sesion.ejercicios.find((e) => e.ejercicio_id === d.ejercicio_id)?.series ?? []}
            onRegistrar={(valores) => registrar(d.ejercicio_id, valores)}
            onCorregir={(serieId, valores) => corregir(serieId, d.ejercicio_id, valores)}
          />
        ))}
      </div>
    </section>
  );
}

function EjercicioSesion({ dosificacion: d, series, onRegistrar, onCorregir }) {
  const ultima = series[series.length - 1];
  const [valores, setValores] = useState({ peso: ultima?.peso ?? '', repeticiones: d.reps_max, rir: d.rir_objetivo });
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [corrigiendo, setCorrigiendo] = useState(null);
  const completo = series.length >= d.series_objetivo;

  const enviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(await onRegistrar(valores));
    setEnviando(false);
  };

  return (
    <article className={`ejercicio ${completo ? 'ejercicio-completo' : ''}`}>
      <header className="encabezado">
        <div>
          <h2>{d.ejercicio_nombre}</h2>
          <span className="dosis">{d.series_objetivo} × {d.reps_min}–{d.reps_max} · RIR {d.rir_objetivo}</span>
        </div>
        {/* US-16 */}
        <span className="contador-series">{series.length} de {d.series_objetivo} series</span>
      </header>

      <UltimaVez ejercicioId={d.ejercicio_id} />

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
                <button type="button" className="boton-texto" onClick={() => setCorrigiendo(s.id)}>Corregir</button>
              </li>
            ),
          )}
        </ol>
      )}

      <form className="form-serie" onSubmit={enviar}>
        <CamposSerie valores={valores} onChange={setValores} />
        <button className="boton" disabled={enviando}>{enviando ? 'Guardando…' : `Registrar serie ${series.length + 1}`}</button>
      </form>
      <MensajeError>{error}</MensajeError>
    </article>
  );
}

// US-14: lo que hizo la última vez, visible al abrir el ejercicio (O2)
function UltimaVez({ ejercicioId }) {
  const { datos, cargando } = useCarga(() => ejerciciosService.ultimasSeries(ejercicioId), [ejercicioId]);
  if (cargando) return null;
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

import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useRegistrarSerie } from '../../hooks/useRegistrarSerie';
import { useCarga } from '../../hooks/useCarga';
import { planVigenteService } from '../../services/plan-vigente.service';
import { ejerciciosService } from '../../services/ejercicios.service';
import { Cargando, MensajeError, Vacio } from '../../components/Estado';
import FormularioSerie from '../../components/entrenar/FormularioSerie';
import UltimaVez from '../../components/entrenar/UltimaVez';
import FormularioCorreccion from '../../components/entrenar/FormularioCorreccion';
import AvisoRecordPersonal from '../../components/entrenar/AvisoRecordPersonal';

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

      <AvisoRecordPersonal record={record} nombreEjercicio={record ? nombreDe(record.ejercicioId) : ''} onCerrar={cerrarRecord} />

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
                <FormularioCorreccion
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

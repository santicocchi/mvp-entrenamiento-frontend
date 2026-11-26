import { useEffect, useRef } from 'react';
import { Cumplimiento } from '../../pages/entrenador/DeportistaDetalle';
import { formatearFecha, formatearFechaLarga, haceCuanto } from '../../utils/fechas';
import { enumerar, formatearPeso, mensajeCumplimiento, resumirSesion, textoRecords } from './resumenSesion';

/**
 * US-20: lo que hizo el deportista en una sesión, ejercicio por ejercicio,
 * con los récords personales marcados.
 * @param {{ sesion: import('../../services/sesiones.service').SesionHistorial, onVolver: () => void }} props
 */
export default function DetalleSesion({ sesion, onVolver }) {
  const titulo = useRef(null);
  const resumen = resumirSesion(sesion);

  // Al entrar, el foco va al título para que el lector de pantalla anuncie la sesión
  useEffect(() => {
    titulo.current?.focus();
  }, []);

  return (
    <section aria-labelledby="titulo-sesion">
      <button type="button" className="boton-texto volver" onClick={onVolver}>
        ← Volver a mis sesiones
      </button>

      <header className="detalle-sesion">
        <div>
          <p className="detalle-sesion-cuando">
            {haceCuanto(sesion.fecha)} · {formatearFecha(sesion.fecha)}
          </p>
          <h1 id="titulo-sesion" ref={titulo} tabIndex={-1}>
            {formatearFechaLarga(sesion.fecha)}
          </h1>
          <p className="detalle-sesion-rutina">{sesion.rutina || 'Rutina sin nombre'}</p>
        </div>
        <div className="cumplimiento-sesion">
          <span className="numero-grande">{sesion.cumplimiento}%</span>
          <span className="texto-suave">de la rutina completada</span>
        </div>
      </header>

      <p className="detalle-sesion-mensaje">{mensajeCumplimiento(resumen)}</p>

      {resumen.records > 0 && (
        <div className="aviso-record">
          <div>
            <strong>
              ★ {resumen.records === 1 ? '1 récord personal' : `${textoRecords(resumen.records)}`}
            </strong>
            <span>En {enumerar(resumen.ejerciciosConRecord)}</span>
          </div>
        </div>
      )}

      <ul className="lista-ejercicios-sesion">
        {sesion.ejercicios.map((ejercicio) => (
          <li
            key={ejercicio.nombre}
            className={`ejercicio${ejercicio.cumplimiento === 100 ? ' ejercicio-completo' : ''}`}
          >
            <div className="encabezado">
              <h2>{ejercicio.nombre}</h2>
              <Cumplimiento valor={ejercicio.cumplimiento} grande />
            </div>

            {ejercicio.series.length === 0 ? (
              <p className="texto-suave">No registraste series de este ejercicio.</p>
            ) : (
              <ol className="series-hoy" aria-label={`Series de ${ejercicio.nombre}`}>
                {ejercicio.series.map((serie) => (
                  <li key={serie.numero} className={serie.recordPersonal ? 'serie-record' : undefined}>
                    <span className="numero-serie" aria-label={`Serie ${serie.numero}`}>
                      {serie.numero}
                    </span>
                    <span className="serie-valores">
                      {formatearPeso(serie.peso)} × {serie.repeticiones}{' '}
                      <span className="texto-suave">· RIR {serie.rir}</span>
                    </span>
                    {serie.recordPersonal && <span className="insignia-record">★ Récord personal</span>}
                  </li>
                ))}
              </ol>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

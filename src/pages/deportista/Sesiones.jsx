import { useState } from 'react';
import { sesionesService } from '../../services/sesiones.service';
import { useCarga } from '../../hooks/useCarga';
import { Cargando, MensajeError, Vacio } from '../../components/Estado';
import { Cumplimiento } from '../entrenador/DeportistaDetalle';
import { formatearFecha, hoy, sumarDias } from '../../utils/fechas';

// US-20
export default function Sesiones() {
  const [rango, setRango] = useState({ desde: sumarDias(hoy(), -30), hasta: hoy() });
  const { datos: sesiones, cargando, error } = useCarga(() => sesionesService.listar(rango.desde, rango.hasta), [rango]);

  return (
    <section>
      <h1>Mis sesiones</h1>
      <div className="fila-formulario">
        <label className="campo">
          Desde
          <input type="date" value={rango.desde} onChange={(e) => setRango({ ...rango, desde: e.target.value })} />
        </label>
        <label className="campo">
          Hasta
          <input type="date" value={rango.hasta} onChange={(e) => setRango({ ...rango, hasta: e.target.value })} />
        </label>
      </div>

      {cargando && <Cargando />}
      <MensajeError>{error?.message}</MensajeError>
      {sesiones?.length === 0 && <Vacio>No entrenaste en ese rango de fechas.</Vacio>}
      {sesiones?.map((s) => (
        <article key={`${s.fecha}-${s.rutina}`} className="sesion">
          <header className="encabezado">
            <div>
              <h2>{s.rutina}</h2>
              <span className="texto-suave">{formatearFecha(s.fecha)}</span>
            </div>
            <Cumplimiento valor={s.cumplimiento} />
          </header>
          <ul className="sesion-ejercicios">
            {s.ejercicios.map((e) => (
              <li key={e.nombre}>
                <div className="sesion-ejercicio-titulo">
                  <span>{e.nombre}</span>
                  <span className="texto-suave">{e.cumplimiento}%</span>
                </div>
                {e.series.length > 0 ? (
                  <span className="series-texto">{e.series.map((x) => `${x.peso} × ${x.repeticiones} (RIR ${x.rir})`).join(' / ')}</span>
                ) : (
                  <span className="texto-suave">Sin series</span>
                )}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}

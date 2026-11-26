import Cumplimiento from '../Cumplimiento';
import { formatearFechaLarga, haceCuanto, partesFecha } from '../../utils/fechas';
import { resumirSesion, textoRecords, textoSeries } from './resumenSesion';

/**
 * US-20: una sesión de la lista. Muestra cuándo fue, la rutina, cuánto hizo y si hubo récords;
 * los ejercicios y las series se ven al abrirla.
 * @param {{ sesion: import('../../services/sesiones.service').SesionHistorial, onAbrir: () => void }} props
 */
export default function TarjetaSesion({ sesion, onAbrir }) {
  const { dia, mes } = partesFecha(sesion.fecha);
  const { series, records } = resumirSesion(sesion);

  return (
    <button type="button" className="sesion-item" onClick={onAbrir}>
      <span className="sesion-fecha" aria-hidden="true">
        <span className="sesion-fecha-dia">{dia}</span>
        <span className="sesion-fecha-mes">{mes}</span>
      </span>

      <span className="sesion-info">
        <span className="sesion-cuando">
          <strong>{haceCuanto(sesion.fecha)}</strong> · {formatearFechaLarga(sesion.fecha)}
        </span>
        <span className="sesion-rutina">{sesion.rutina || 'Rutina sin nombre'}</span>
        <span className="sesion-meta">
          {textoSeries(series)}
          {records > 0 && <span className="insignia-record">★ {textoRecords(records)}</span>}
        </span>
      </span>

      <span className="sesion-lado">
        <Cumplimiento valor={sesion.cumplimiento} grande />
        <span className="sesion-ver" aria-hidden="true">Ver sesión ›</span>
      </span>
    </button>
  );
}

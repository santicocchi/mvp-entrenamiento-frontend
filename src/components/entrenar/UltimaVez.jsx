import { MensajeError } from '../Estado';
import { formatearFecha } from '../../utils/fechas';

// US-14: lo que el deportista hizo la última vez en un ejercicio, visible al abrirlo (O2).
// Recibe por props el resultado de ejerciciosService.ultimasSeries: { datos, cargando, error }.
// Las series de hoy no vienen acá: la pantalla las muestra aparte, en la sesión del día.
export default function UltimaVez({ datos, cargando, error }) {
  if (cargando) return null;
  if (error) return <MensajeError>{error.message}</MensajeError>;
  if (!datos?.fecha || datos.series.length === 0) {
    return <p className="ultima-vez texto-suave">Primera vez con este ejercicio.</p>;
  }
  return (
    <p className="ultima-vez">
      <span className="texto-suave">Última vez, {formatearFecha(datos.fecha)}:</span>{' '}
      {datos.series.map((s) => `${s.peso} × ${s.repeticiones}`).join(', ')}
    </p>
  );
}

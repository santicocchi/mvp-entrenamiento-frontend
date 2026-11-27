import { formatearFechaCorta } from '../../utils/fechas';

// Resumen de esta semana, arriba de la pantalla de Progreso.
// Los números los calcula el back (GET /progreso/resumen): acá solo se muestran.

// 12345.5 → "12.345,5"
const numero = (valor) => valor.toLocaleString('es-AR', { maximumFractionDigits: 1 });

/** @param {{ resumen: import('../../services/progreso.service').ResumenDeLaSemana }} props */
export default function ResumenProgreso({ resumen }) {
  return (
    <section aria-label="Resumen de la semana">
      <h2>Esta semana</h2>
      <p className="texto-suave">
        Del {formatearFechaCorta(resumen.desde)} al {formatearFechaCorta(resumen.hasta)}
      </p>
      <div className="resumen-semana">
        <div className="resumen-semana-dato" aria-label="Récords personales">
          <span className="resumen-semana-titulo">Récords personales</span>
          <span className="resumen-semana-numero resumen-semana-record">
            {resumen.records}
            <span className="resumen-semana-estrella" aria-hidden="true">★</span>
          </span>
        </div>
        <div className="resumen-semana-dato" aria-label="Volumen levantado">
          <span className="resumen-semana-titulo">Volumen levantado</span>
          <span className="resumen-semana-numero">
            {numero(resumen.volumen)}<small> kg</small>
          </span>
          <span className="resumen-semana-detalle">La semana pasada: {numero(resumen.volumenAnterior)} kg</span>
        </div>
        <div className="resumen-semana-dato" aria-label="Entrenamientos">
          <span className="resumen-semana-titulo">Entrenamientos</span>
          <span className="resumen-semana-numero">{resumen.sesiones}</span>
          <span className="resumen-semana-detalle">{resumen.series === 1 ? '1 serie' : `${resumen.series} series`}</span>
        </div>
      </div>
    </section>
  );
}

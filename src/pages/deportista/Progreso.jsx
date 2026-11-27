import { useState } from 'react';
import { progresoService } from '../../services/progreso.service';
import { useCarga } from '../../hooks/useCarga';
import { Cargando, MensajeError, Vacio } from '../../components/Estado';
import { formatearFecha } from '../../utils/fechas';
import GraficoEvolucion from '../../components/GraficoEvolucion';
import ResumenProgreso from '../../components/progreso/ResumenProgreso';

// US-19: ver el progreso de cada ejercicio, con un resumen de todos los ejercicios arriba.
// El récord, el 1RM, la mejor serie y el volumen los calcula el back (CalculadoraProgreso): acá solo se muestran.
export default function Progreso() {
  const resumen = useCarga(() => progresoService.resumen());
  // Solo los ejercicios que el deportista registró alguna vez (CU23)
  const ejercicios = useCarga(() => progresoService.ejerciciosConProgreso());
  const [ejercicioId, setEjercicioId] = useState('');

  return (
    <section>
      <h1>Progreso</h1>

      {resumen.cargando && <Cargando />}
      {resumen.error && <MensajeError>{resumen.error.message}</MensajeError>}
      {resumen.datos && <ResumenProgreso resumen={resumen.datos} />}

      <h2>Por ejercicio</h2>
      {ejercicios.cargando && <Cargando />}
      {ejercicios.error && <MensajeError>{ejercicios.error.message}</MensajeError>}
      {ejercicios.datos && ejercicios.datos.length === 0 && (
        <Vacio>Registrá tu primera serie para empezar a ver tu progreso.</Vacio>
      )}
      {ejercicios.datos?.length > 0 && (
        <>
          <label className="campo campo-corto">
            Ejercicio
            <select value={ejercicioId} onChange={(e) => setEjercicioId(e.target.value)}>
              <option value="">Elegí un ejercicio</option>
              {ejercicios.datos.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </label>
          {ejercicioId ? (
            <DetalleProgreso ejercicioId={ejercicioId} />
          ) : (
            <p className="texto-suave">Elegí un ejercicio para ver tu récord, el 1RM estimado y cómo fue cambiando en cada sesión.</p>
          )}
        </>
      )}
    </section>
  );
}

function DetalleProgreso({ ejercicioId }) {
  const { datos, cargando, error } = useCarga(() => progresoService.obtener(ejercicioId), [ejercicioId]);
  if (cargando) return <Cargando />;
  if (error) return <MensajeError>{error.message}</MensajeError>;
  if (datos.porFecha.length === 0) return <Vacio>Todavía no registraste series de este ejercicio.</Vacio>;

  const ultimo = datos.porFecha[datos.porFecha.length - 1];
  // La tabla va de la sesión más reciente a la más antigua; los gráficos, en orden cronológico
  const porFechaReciente = [...datos.porFecha].reverse();

  return (
    <>
      <div className="resumen-progreso">
        {datos.record && (
          <div className="dato" aria-label="Récord personal">
            <span className="texto-suave">Récord personal</span>
            <span className="numero-grande">{datos.record.peso} kg × {datos.record.repeticiones}</span>
            <span className="texto-suave">{formatearFecha(datos.record.fecha)}</span>
          </div>
        )}
        <div className="dato" aria-label="1RM estimado">
          <span className="texto-suave">1RM estimado (última sesión)</span>
          <span className="numero-grande">{ultimo.rmEstimado} kg</span>
          <span className="texto-suave">Es una estimación, no un peso que hayas levantado</span>
        </div>
      </div>

      <h2>Peso máximo por sesión</h2>
      <GraficoEvolucion
        datos={datos.porFecha}
        series={[{ clave: 'pesoMaximo', nombre: 'Peso máximo', color: '#12607a' }]}
      />

      <h2>1RM estimado por sesión</h2>
      <p className="texto-suave">
        El 1RM estimado es el peso que podrías levantar una sola vez, calculado con la fórmula de Epley:
        peso × (1 + repeticiones / 30). Es una estimación, no tu récord.
      </p>
      <GraficoEvolucion
        datos={datos.porFecha}
        series={[{ clave: 'rmEstimado', nombre: '1RM estimado', color: '#e0a21b' }]}
      />

      <h2>Detalle por sesión</h2>
      <div className="tabla-contenedor">
        <table className="tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Mejor serie</th>
              <th>Volumen</th>
            </tr>
          </thead>
          <tbody>
            {porFechaReciente.map((delDia) => (
              <tr key={delDia.fecha}>
                <td>{formatearFecha(delDia.fecha)}</td>
                <td>{delDia.mejorSerie.peso} kg × {delDia.mejorSerie.repeticiones}</td>
                <td>{delDia.volumen} kg</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

import { useEffect, useState } from 'react';
import { progresoService } from '../../services/progreso.service';
import { useCarga } from '../../hooks/useCarga';
import { Cargando, MensajeError, Vacio } from '../../components/Estado';
import { formatearFecha } from '../../utils/fechas';
import GraficoEvolucion from '../../components/GraficoEvolucion';

// US-19
export default function Progreso() {
  const ejercicios = useCarga(() => progresoService.ejerciciosConProgreso());
  const [ejercicioId, setEjercicioId] = useState('');

  useEffect(() => {
    if (!ejercicioId && ejercicios.datos?.length) setEjercicioId(String(ejercicios.datos[0].id));
  }, [ejercicios.datos, ejercicioId]);

  if (ejercicios.cargando) return <Cargando />;
  if (ejercicios.error) return <MensajeError>{ejercicios.error.message}</MensajeError>;

  return (
    <section>
      <h1>Progreso</h1>
      {ejercicios.datos.length === 0 ? (
        <Vacio>Registrá tu primera serie para empezar a ver tu progreso.</Vacio>
      ) : (
        <>
          <label className="campo campo-corto">
            Ejercicio
            <select value={ejercicioId} onChange={(e) => setEjercicioId(e.target.value)}>
              {ejercicios.datos.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </label>
          {ejercicioId && <DetalleProgreso ejercicioId={ejercicioId} />}
        </>
      )}
    </section>
  );
}

function DetalleProgreso({ ejercicioId }) {
  const { datos, cargando, error } = useCarga(() => progresoService.obtener(ejercicioId), [ejercicioId]);
  if (cargando) return <Cargando />;
  if (error) return <MensajeError>{error.message}</MensajeError>;

  const ultimo = datos.por_fecha[datos.por_fecha.length - 1];

  return (
    <>
      <div className="resumen-progreso">
        {datos.record && (
          <div className="dato">
            <span className="texto-suave">Récord personal</span>
            <span className="numero-grande">{datos.record.peso} kg × {datos.record.repeticiones}</span>
            <span className="texto-suave">{formatearFecha(datos.record.fecha)}</span>
          </div>
        )}
        {ultimo && (
          <div className="dato">
            <span className="texto-suave">1RM estimado (última sesión)</span>
            <span className="numero-grande">{ultimo.rm_estimado} kg</span>
            <span className="texto-suave">Fórmula de Epley</span>
          </div>
        )}
      </div>

      <h2>Peso máximo y 1RM estimado</h2>
      <GraficoEvolucion
        datos={datos.por_fecha}
        series={[
          { clave: 'peso_maximo', nombre: 'Peso máximo', color: '#12607a' },
          { clave: 'rm_estimado', nombre: '1RM estimado', color: '#e0a21b' },
        ]}
      />

      <h2>Volumen por sesión</h2>
      <GraficoEvolucion
        datos={datos.por_fecha}
        series={[{ clave: 'volumen', nombre: 'Volumen', color: '#18232f' }]}
        alto={220}
      />
    </>
  );
}

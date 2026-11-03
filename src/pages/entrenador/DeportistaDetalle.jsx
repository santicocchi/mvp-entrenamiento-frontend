import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { deportistasService } from '../../services/deportistas.service';
import { medicionesService } from '../../services/mediciones.service';
import { useCarga } from '../../hooks/useCarga';
import { Cargando, MensajeError, Vacio } from '../../components/Estado';
import GraficoEvolucion from '../../components/GraficoEvolucion';
import { formatearFecha, hoy, sumarDias } from '../../utils/fechas';

// US-12: asistencia (fecha, rutina, cumplimiento; sin series, RN17) + evolución del peso corporal
export default function DeportistaDetalle() {
  const { id } = useParams();
  const [rango, setRango] = useState({ desde: sumarDias(hoy(), -30), hasta: hoy() });

  const { datos: deportistas } = useCarga(() => deportistasService.listar());
  const deportista = deportistas?.find((d) => d.id === Number(id));

  const asistencia = useCarga(() => deportistasService.asistencia(id, rango.desde, rango.hasta), [id, rango]);
  const mediciones = useCarga(() => medicionesService.listar({ deportistaId: id }), [id]);

  return (
    <section>
      <Link to="/entrenador/deportistas" className="volver">Volver a deportistas</Link>
      <h1>{deportista?.nombre ?? 'Deportista'}</h1>
      {deportista && (
        <p className="texto-suave">
          {deportista.plan_vigente
            ? `Plan vigente: ${deportista.plan_vigente.nombre}, del ${formatearFecha(deportista.plan_vigente.vigencia_desde)} al ${formatearFecha(deportista.plan_vigente.vigencia_hasta)}`
            : 'Sin plan vigente'}
        </p>
      )}

      <h2>Asistencia</h2>
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
      {asistencia.cargando && <Cargando />}
      <MensajeError>{asistencia.error?.message}</MensajeError>
      {asistencia.datos?.length === 0 && <Vacio>No entrenó en ese rango de fechas.</Vacio>}
      {asistencia.datos?.length > 0 && (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead><tr><th>Fecha</th><th>Rutina</th><th>Cumplimiento</th></tr></thead>
            <tbody>
              {asistencia.datos.map((a) => (
                <tr key={`${a.fecha}-${a.rutina}`}>
                  <td>{formatearFecha(a.fecha)}</td>
                  <td>{a.rutina}</td>
                  <td><Cumplimiento valor={a.cumplimiento} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2>Peso corporal</h2>
      {mediciones.cargando && <Cargando />}
      <MensajeError>{mediciones.error?.message}</MensajeError>
      {mediciones.datos?.length === 0 && <Vacio>Todavía no registró mediciones.</Vacio>}
      {mediciones.datos?.length > 0 && (
        <GraficoEvolucion
          datos={mediciones.datos}
          series={[{ clave: 'peso_corporal', nombre: 'Peso corporal', color: '#12607a' }]}
        />
      )}
    </section>
  );
}

export function Cumplimiento({ valor }) {
  return (
    <span className="cumplimiento">
      <span className="cumplimiento-barra"><span style={{ width: `${valor}%` }} /></span>
      {valor}%
    </span>
  );
}

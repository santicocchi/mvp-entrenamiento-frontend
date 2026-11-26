import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sesionesService } from '../../services/sesiones.service';
import { useCarga } from '../../hooks/useCarga';
import { Cargando, MensajeError, Vacio } from '../../components/Estado';
import TarjetaSesion from '../../components/sesiones/TarjetaSesion';
import DetalleSesion from '../../components/sesiones/DetalleSesion';
import { formatearFecha, hoy, sumarDias } from '../../utils/fechas';

// "entre el 01/10/2026 y el 31/10/2026", "desde el 01/10/2026"…
function textoRango({ desde, hasta }) {
  if (desde && hasta) return `entre el ${formatearFecha(desde)} y el ${formatearFecha(hasta)}`;
  if (desde) return `desde el ${formatearFecha(desde)}`;
  if (hasta) return `hasta el ${formatearFecha(hasta)}`;
  return 'registradas';
}

// US-20: el deportista repasa lo que hizo. Primero elige la sesión y después la ve completa.
export default function Sesiones() {
  const [rango, setRango] = useState({ desde: sumarDias(hoy(), -30), hasta: hoy() });
  const [abierta, setAbierta] = useState(null);
  const rangoValido = !rango.desde || !rango.hasta || rango.desde <= rango.hasta;

  const { datos: sesiones, cargando, error } = useCarga(
    () => (rangoValido ? sesionesService.listar(rango.desde, rango.hasta) : Promise.resolve([])),
    [rango],
  );

  const cambiarRango = (campo, valor) => {
    setAbierta(null);
    setRango((actual) => ({ ...actual, [campo]: valor }));
  };

  if (abierta !== null && sesiones?.[abierta]) {
    return <DetalleSesion sesion={sesiones[abierta]} onVolver={() => setAbierta(null)} />;
  }

  return (
    <section>
      <h1>Mis sesiones</h1>
      <p className="texto-suave">Elegí una sesión para ver qué hiciste en cada ejercicio.</p>

      <div className="fila-formulario">
        <label className="campo">
          Desde
          <input type="date" value={rango.desde} onChange={(e) => cambiarRango('desde', e.target.value)} />
        </label>
        <label className="campo">
          Hasta
          <input type="date" value={rango.hasta} onChange={(e) => cambiarRango('hasta', e.target.value)} />
        </label>
      </div>

      {!rangoValido && <MensajeError>La fecha "Desde" no puede ser posterior a "Hasta".</MensajeError>}
      {rangoValido && cargando && <Cargando />}
      <MensajeError>{error?.message}</MensajeError>

      {rangoValido && !cargando && sesiones?.length === 0 && (
        <Vacio>
          No tenés sesiones {textoRango(rango)}. Cada vez que registrás series desde{' '}
          <Link to="/deportista/plan">Mi plan</Link>, la sesión aparece acá.
        </Vacio>
      )}

      {rangoValido && sesiones?.length > 0 && (
        <>
          <p className="contador-resultados">
            {sesiones.length} {sesiones.length === 1 ? 'sesión' : 'sesiones'} {textoRango(rango)}, de la más reciente
            a la más antigua
          </p>
          <ul className="lista-sesiones">
            {sesiones.map((sesion, indice) => (
              <li key={`${sesion.fecha}-${sesion.rutina}-${indice}`}>
                <TarjetaSesion sesion={sesion} onAbrir={() => setAbierta(indice)} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

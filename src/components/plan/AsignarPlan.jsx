import { useState } from 'react';
import { planesService } from '../../services/planes.service';
import { deportistasService } from '../../services/deportistas.service';
import { useCarga } from '../../hooks/useCarga';
import { Cargando, MensajeError, MensajeOk, Vacio } from '../Estado';
import { formatearFecha, hoy } from '../../utils/fechas';

// US-08 · Asignar el plan a un deportista vinculado, con su vigencia.
// Las reglas (vínculo RN14, desde ≤ hasta RN10, superposición RN11) las decide el back:
// acá solo se muestran sus mensajes tal cual.
export default function AsignarPlan({ planId }) {
  const { datos: deportistas, cargando, error: errorCarga } = useCarga(() => deportistasService.listar());
  const [form, setForm] = useState({ deportistaId: '', vigenciaDesde: hoy(), vigenciaHasta: '' });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [ok, setOk] = useState(null);

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const asignar = async (e) => {
    e.preventDefault();
    setError(null);
    setOk(null);
    setEnviando(true);
    try {
      const asignacion = await planesService.asignar(planId, { ...form, deportistaId: Number(form.deportistaId) });
      const nombre = deportistas.find((d) => d.id === asignacion.deportistaId)?.nombre;
      setOk(
        `Plan asignado a ${nombre} del ${formatearFecha(asignacion.vigenciaDesde)} al ${formatearFecha(asignacion.vigenciaHasta)}.`,
      );
      // Se puede seguir asignando el mismo plan a otro deportista, cada uno con sus fechas
      setForm({ deportistaId: '', vigenciaDesde: form.vigenciaDesde, vigenciaHasta: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  };

  if (cargando) return <Cargando />;
  if (errorCarga) return <MensajeError>{errorCarga.message}</MensajeError>;

  return (
    <form className="bloque-asignar" onSubmit={asignar}>
      <h2>Asignar a un deportista</h2>
      {deportistas.length === 0 ? (
        <Vacio>Todavía no tenés deportistas vinculados. Vinculá uno desde Deportistas para asignarle este plan.</Vacio>
      ) : (
        <div className="fila-formulario">
          <label className="campo campo-ancho">
            Deportista
            <select value={form.deportistaId} onChange={cambiar('deportistaId')} required>
              <option value="">Elegí un deportista</option>
              {deportistas.map((d) => (
                <option key={d.id} value={d.id}>{d.nombre}</option>
              ))}
            </select>
          </label>
          <label className="campo">
            Desde
            <input type="date" value={form.vigenciaDesde} onChange={cambiar('vigenciaDesde')} required />
          </label>
          <label className="campo">
            Hasta
            <input
              type="date"
              value={form.vigenciaHasta}
              min={form.vigenciaDesde || undefined}
              onChange={cambiar('vigenciaHasta')}
              required
            />
          </label>
          <button className="boton" disabled={enviando}>{enviando ? 'Asignando…' : 'Asignar'}</button>
        </div>
      )}
      <MensajeError>{error}</MensajeError>
      <MensajeOk>{ok}</MensajeOk>
    </form>
  );
}

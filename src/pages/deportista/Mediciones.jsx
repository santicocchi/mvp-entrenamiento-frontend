import { useState } from 'react';
import { medicionesService } from '../../services/mediciones.service';
import { useCarga } from '../../hooks/useCarga';
import { Cargando, MensajeError, MensajeOk, Vacio } from '../../components/Estado';
import GraficoEvolucion from '../../components/GraficoEvolucion';

// US-21: una medición por día; si ya cargó hoy, se reemplaza (RN19)
export default function Mediciones() {
  const { datos: mediciones, cargando, error, recargar } = useCarga(() => medicionesService.listar());
  const [form, setForm] = useState({ peso_corporal: '', altura: '' });
  const [errorForm, setErrorForm] = useState(null);
  const [ok, setOk] = useState(null);

  const enviar = async (e) => {
    e.preventDefault();
    setErrorForm(null);
    setOk(null);
    try {
      await medicionesService.registrar(Number(form.peso_corporal), Number(form.altura));
      setOk('Medición guardada.');
      recargar();
    } catch (err) {
      setErrorForm(err.message);
    }
  };

  return (
    <section>
      <h1>Mediciones corporales</h1>
      <form className="fila-formulario" onSubmit={enviar}>
        <label className="campo">
          Peso corporal (kg)
          <input type="number" step="0.1" min="0" value={form.peso_corporal} onChange={(e) => setForm({ ...form, peso_corporal: e.target.value })} required />
        </label>
        <label className="campo">
          Altura (m)
          <input type="number" step="0.01" min="0" value={form.altura} onChange={(e) => setForm({ ...form, altura: e.target.value })} required />
        </label>
        <button className="boton">Guardar medición</button>
      </form>
      <MensajeError>{errorForm}</MensajeError>
      <MensajeOk>{ok}</MensajeOk>

      {cargando && <Cargando />}
      <MensajeError>{error?.message}</MensajeError>
      {mediciones?.length === 0 && <Vacio>Todavía no registraste mediciones.</Vacio>}
      {mediciones?.length > 0 && (
        <GraficoEvolucion
          datos={mediciones}
          series={[{ clave: 'peso_corporal', nombre: 'Peso corporal', color: '#12607a' }]}
        />
      )}
    </section>
  );
}

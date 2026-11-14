import { useEffect, useState } from 'react';
import { medicionesService } from '../../services/mediciones.service';
import { useCarga } from '../../hooks/useCarga';
import { Cargando, MensajeError, MensajeOk, Vacio } from '../../components/Estado';
import GraficoEvolucion from '../../components/GraficoEvolucion';

// US-21: una medición por día; si ya cargó hoy, se reemplaza (RN19). La fecha la pone el back.
export default function Mediciones() {
  const { datos: mediciones, cargando, error, recargar } = useCarga(() => medicionesService.listar());
  const [form, setForm] = useState({ pesoCorporal: '', altura: '' });
  const [errorForm, setErrorForm] = useState(null);
  const [ok, setOk] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // La altura casi no cambia: se precarga con la de la última medición
  const ultimaAltura = mediciones?.[mediciones.length - 1]?.altura;
  useEffect(() => {
    if (ultimaAltura) setForm((f) => (f.altura === '' ? { ...f, altura: String(ultimaAltura) } : f));
  }, [ultimaAltura]);

  const cambiar = (campo) => (e) => setForm({ ...form, [campo]: e.target.value });

  const enviar = async (e) => {
    e.preventDefault();
    setErrorForm(null);
    setOk(null);
    setEnviando(true);
    try {
      await medicionesService.registrar(Number(form.pesoCorporal), Number(form.altura));
      setOk('Medición guardada.');
      setForm({ ...form, pesoCorporal: '' });
      await recargar();
    } catch (err) {
      setErrorForm(err.message); // el mensaje del back, tal cual (Paso 12)
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section>
      <h1>Mediciones corporales</h1>
      <p className="texto-suave">Se guarda una medición por día: si cargás otra hoy, reemplaza a la anterior.</p>
      <form className="fila-formulario" onSubmit={enviar} noValidate>
        <label className="campo">
          Peso corporal (kg)
          <input type="number" step="0.1" min="0" inputMode="decimal" value={form.pesoCorporal} onChange={cambiar('pesoCorporal')} required />
        </label>
        <label className="campo">
          Altura (m)
          <input type="number" step="0.01" min="0" inputMode="decimal" value={form.altura} onChange={cambiar('altura')} placeholder="1.76" required />
        </label>
        <button className="boton" disabled={enviando}>{enviando ? 'Guardando…' : 'Guardar medición'}</button>
      </form>
      <MensajeError>{errorForm}</MensajeError>
      <MensajeOk>{ok}</MensajeOk>

      <h2>Evolución del peso corporal</h2>
      {cargando && !mediciones && <Cargando />}
      <MensajeError>{error?.message}</MensajeError>
      {mediciones?.length === 0 && <Vacio>Todavía no hay datos: registrá tu primera medición.</Vacio>}
      {mediciones?.length > 0 && (
        <GraficoEvolucion
          datos={mediciones}
          series={[{ clave: 'pesoCorporal', nombre: 'Peso corporal', color: '#12607a' }]}
        />
      )}
    </section>
  );
}

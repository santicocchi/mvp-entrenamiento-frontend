import { useState } from 'react';
import { MensajeError } from '../Estado';

// US-17: corregir una serie registrada hoy. Recibe la serie y las acciones por props;
// no conoce endpoints ni services. La serie conserva su número: solo cambian peso, reps y RIR.
// Las reglas (solo el mismo día, solo el dueño, valores válidos) las decide el back:
// onGuardar devuelve null si salió bien o el mensaje de error, que se muestra tal cual.
export default function FormularioCorreccion({ serie, onGuardar, onCancelar }) {
  const [valores, setValores] = useState({
    peso: serie.peso,
    repeticiones: serie.repeticiones,
    rir: serie.rir,
  });
  const [error, setError] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo) => (evento) => {
    setValores({ ...valores, [campo]: evento.target.value });
    setError(null);
  };

  const guardar = async (evento) => {
    evento.preventDefault();
    if (guardando) return;
    setGuardando(true);
    setError(null);
    try {
      const motivo = await onGuardar(valores);
      if (motivo) setError(motivo);
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <form
      className="form-correccion"
      onSubmit={guardar}
      noValidate
      aria-label={`Corregir serie ${serie.numero}`}
      aria-busy={guardando}
    >
      <span className="numero-serie">{serie.numero}</span>
      <div className="campos-serie">
        <label className="campo">
          Peso (kg)
          <input
            type="number"
            step="0.5"
            min="0"
            inputMode="decimal"
            value={valores.peso}
            onChange={cambiar('peso')}
            disabled={guardando}
            required
          />
        </label>
        <label className="campo">
          Reps
          <input
            type="number"
            min="1"
            step="1"
            inputMode="numeric"
            value={valores.repeticiones}
            onChange={cambiar('repeticiones')}
            disabled={guardando}
            required
          />
        </label>
        <label className="campo">
          RIR
          <input
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            value={valores.rir}
            onChange={cambiar('rir')}
            disabled={guardando}
            required
          />
        </label>
      </div>
      <div className="grupo-botones">
        <button className="boton" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
        <button type="button" className="boton-texto" disabled={guardando} onClick={onCancelar}>
          Cancelar
        </button>
      </div>
      <MensajeError>{error}</MensajeError>
    </form>
  );
}

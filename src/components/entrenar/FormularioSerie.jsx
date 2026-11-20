import { useId } from 'react';
import { MensajeError, MensajeOk } from '../Estado';
import { useFormularioSerie } from '../../hooks/useFormularioSerie';

// US-15: recibe datos y acciones; no conoce endpoints, tokens ni services.
export default function FormularioSerie({
  ultimaSerie,
  repeticionesObjetivo,
  rirObjetivo,
  onRegistrar,
  deshabilitado = false,
}) {
  const id = useId();
  const { valores, error, mensaje, enviando, cambiar, enviar } = useFormularioSerie({
    ultimaSerie,
    repeticionesObjetivo,
    rirObjetivo,
    onRegistrar,
  });

  return (
    <div>
      <form
        className="form-serie"
        onSubmit={enviar}
        noValidate
        aria-label="Registrar serie"
        aria-busy={enviando}
      >
        <div className="campos-serie">
          <label className="campo" htmlFor={`${id}-peso`}>
            Peso (kg)
            <input
              id={`${id}-peso`}
              name="peso"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              required
              aria-describedby={`${id}-ayuda`}
              value={valores.peso}
              onChange={(evento) => cambiar('peso', evento.target.value)}
              disabled={enviando || deshabilitado}
            />
          </label>
          <label className="campo" htmlFor={`${id}-repeticiones`}>
            Reps
            <input
              id={`${id}-repeticiones`}
              name="repeticiones"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              required
              value={valores.repeticiones}
              onChange={(evento) => cambiar('repeticiones', evento.target.value)}
              disabled={enviando || deshabilitado}
            />
          </label>
          <label className="campo" htmlFor={`${id}-rir`}>
            RIR
            <input
              id={`${id}-rir`}
              name="rir"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              required
              value={valores.rir}
              onChange={(evento) => cambiar('rir', evento.target.value)}
              disabled={enviando || deshabilitado}
            />
          </label>
        </div>
        <button type="submit" className="boton" disabled={enviando || deshabilitado}>
          {enviando ? 'Guardando…' : 'Registrar serie'}
        </button>
      </form>
      <p id={`${id}-ayuda`} className="texto-suave">
        Peso 0 = peso corporal. La fecha se asigna automáticamente.
      </p>
      <MensajeError>{error}</MensajeError>
      <MensajeOk>{mensaje}</MensajeOk>
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';

// Estado de edición y feedback de US-15. useRegistrarSerie valida y coordina el comando.
export function useFormularioSerie({
  ultimaSerie,
  repeticionesObjetivo,
  rirObjetivo,
  onRegistrar,
}) {
  const [valores, setValores] = useState(() => ({
    peso: ultimaSerie?.peso ?? '',
    repeticiones: ultimaSerie?.repeticiones ?? repeticionesObjetivo,
    rir: ultimaSerie?.rir ?? rirObjetivo,
  }));
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const editados = useRef({});
  const envioEnCurso = useRef(false);

  useEffect(() => {
    if (!ultimaSerie) return;
    setValores((anteriores) => ({
      peso: editados.current.peso ? anteriores.peso : ultimaSerie.peso,
      repeticiones: editados.current.repeticiones
        ? anteriores.repeticiones
        : ultimaSerie.repeticiones,
      rir: editados.current.rir ? anteriores.rir : ultimaSerie.rir,
    }));
  }, [ultimaSerie]);

  const cambiar = (campo, valor) => {
    editados.current[campo] = true;
    setValores((anteriores) => ({ ...anteriores, [campo]: valor }));
    setError(null);
    setMensaje(null);
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    if (envioEnCurso.current) return;
    envioEnCurso.current = true;
    setEnviando(true);
    setError(null);
    setMensaje(null);
    try {
      const motivo = await onRegistrar(valores);
      if (motivo) setError(motivo);
      else setMensaje('Serie registrada.');
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      envioEnCurso.current = false;
      setEnviando(false);
    }
  };

  return { valores, error, mensaje, enviando, cambiar, enviar };
}

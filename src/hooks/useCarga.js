import { useCallback, useEffect, useState } from 'react';

// Carga datos de un service y expone { datos, cargando, error, recargar }.
export function useCarga(funcion, dependencias = []) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const cargar = useCallback(funcion, dependencias);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setDatos(await cargar());
    } catch (e) {
      setError(e);
    } finally {
      setCargando(false);
    }
  }, [cargar]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  return { datos, cargando, error, recargar, setDatos };
}

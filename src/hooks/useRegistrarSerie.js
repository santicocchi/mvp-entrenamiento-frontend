import { useCallback, useEffect, useRef, useState } from 'react';
import { seriesService } from '../services/series.service';
import { sesionesService } from '../services/sesiones.service';

function normalizar(valores) {
  const serie = {};
  for (const [campo, etiqueta] of [
    ['peso', 'El peso'],
    ['repeticiones', 'Las repeticiones'],
    ['rir', 'El RIR'],
  ]) {
    const valor = valores[campo];
    if ((typeof valor !== 'number' && typeof valor !== 'string') || String(valor).trim() === '') {
      throw new Error(
        `${etiqueta} ${campo === 'repeticiones' ? 'son obligatorias' : 'es obligatorio'}.`,
      );
    }
    serie[campo] = Number(String(valor).trim().replace(',', '.'));
    if (!Number.isFinite(serie[campo]))
      throw new Error(
        `${etiqueta} ${campo === 'repeticiones' ? 'deben' : 'debe'} ser un número finito.`,
      );
  }
  if (serie.peso < 0) throw new Error('El peso no puede ser negativo.');
  if (Number(serie.peso.toFixed(2)) !== serie.peso)
    throw new Error('El peso admite hasta 2 decimales.');
  if (!Number.isSafeInteger(serie.repeticiones))
    throw new Error('Las repeticiones deben ser un entero.');
  if (serie.repeticiones <= 0) throw new Error('Las repeticiones tienen que ser mayores a 0.');
  if (!Number.isSafeInteger(serie.rir)) throw new Error('El RIR debe ser un entero.');
  if (serie.rir < 0) throw new Error('El RIR no puede ser negativo.');
  return serie;
}

// US-15 a 18: el backend decide la fecha, la numeración, el cumplimiento y el récord.
export function useRegistrarSerie(rutinaId) {
  const [sesion, setSesion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [errorActualizacion, setErrorActualizacion] = useState(null);
  const [actualizando, setActualizando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [record, setRecord] = useState(null);
  const generacion = useRef(0);
  const envioEnCurso = useRef(null);

  useEffect(() => {
    const solicitud = ++generacion.current;
    setSesion(null);
    setCargando(true);
    setError(null);
    setErrorActualizacion(null);
    setRecord(null);
    setEnviando(false);
    setActualizando(false);
    envioEnCurso.current = null;
    sesionesService
      .deHoy(Number(rutinaId))
      .then((datos) => {
        if (generacion.current === solicitud) setSesion(datos);
      })
      .catch((fallo) => {
        if (generacion.current === solicitud) setError(fallo.message);
      })
      .finally(() => {
        if (generacion.current === solicitud) setCargando(false);
      });
    return () => {
      generacion.current = solicitud + 1;
    };
  }, [rutinaId]);

  const recargar = useCallback(async () => {
    const solicitud = generacion.current;
    setActualizando(true);
    try {
      const datos = await sesionesService.deHoy(Number(rutinaId));
      if (generacion.current !== solicitud) return;
      setSesion(datos);
      setError(null);
      setErrorActualizacion(null);
    } catch (fallo) {
      if (generacion.current === solicitud) setErrorActualizacion(fallo.message);
    } finally {
      if (generacion.current === solicitud) setActualizando(false);
    }
  }, [rutinaId]);

  const guardar = async (ejercicioId, valores, serieId) => {
    const solicitud = generacion.current;
    if (envioEnCurso.current === solicitud) return 'Esperá a que termine el registro en curso.';
    if (errorActualizacion) return 'Actualizá la sesión antes de registrar otra serie.';
    let serie;
    try {
      serie = normalizar(valores);
    } catch (fallo) {
      return fallo.message;
    }
    envioEnCurso.current = solicitud;
    setEnviando(true);
    try {
      const respuesta =
        serieId === undefined
          ? await seriesService.registrar({ rutinaId: Number(rutinaId), ejercicioId, ...serie })
          : await seriesService.corregir(serieId, serie);
      if (generacion.current !== solicitud) return null;
      setRecord(respuesta.recordPersonal ? { ejercicioId, ...serie } : null);
      // El reintento de una consulta fallida nunca reenvía el POST exitoso.
      await recargar();
      return null;
    } catch (fallo) {
      return fallo.message;
    } finally {
      if (generacion.current === solicitud) {
        envioEnCurso.current = null;
        setEnviando(false);
      }
    }
  };

  return {
    sesion,
    cargando,
    error,
    errorActualizacion,
    actualizando,
    enviando,
    record,
    recargar,
    registrar: (ejercicioId, valores) => guardar(ejercicioId, valores),
    corregir: (serieId, ejercicioId, valores) => guardar(ejercicioId, valores, serieId),
    cerrarRecord: () => setRecord(null),
  };
}

import { useCallback, useEffect, useState } from 'react';
import { seriesService } from '../services/series.service';
import { sesionesService } from '../services/sesiones.service';

// Use case del front: registrar y corregir series de la sesión de hoy (US-15, US-16, US-17, US-18).
// La fecha y el número de serie los pone el back (RN7, RN12); el récord también lo decide el back (RN9).
export function useRegistrarSerie(rutinaId) {
  const [sesion, setSesion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [record, setRecord] = useState(null); // { ejercicioId, peso, repeticiones }

  const recargar = useCallback(async () => {
    try {
      setSesion(await sesionesService.deHoy(rutinaId));
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }, [rutinaId]);

  useEffect(() => {
    recargar();
  }, [recargar]);

  const normalizar = ({ peso, repeticiones, rir }) => ({
    peso: Number(peso),
    repeticiones: Number(repeticiones),
    rir: Number(rir),
  });

  // Devuelve null si salió bien, o el mensaje de error del back
  const registrar = async (ejercicioId, valores) => {
    try {
      const serie = normalizar(valores);
      const respuesta = await seriesService.registrar({ rutina_id: Number(rutinaId), ejercicio_id: ejercicioId, ...serie });
      if (respuesta.record_personal) setRecord({ ejercicioId, ...serie });
      await recargar();
      return null;
    } catch (e) {
      return e.message;
    }
  };

  const corregir = async (serieId, ejercicioId, valores) => {
    try {
      const serie = normalizar(valores);
      const respuesta = await seriesService.corregir(serieId, serie);
      if (respuesta.record_personal) setRecord({ ejercicioId, ...serie });
      await recargar();
      return null;
    } catch (e) {
      return e.message;
    }
  };

  return { sesion, cargando, error, registrar, corregir, record, cerrarRecord: () => setRecord(null) };
}

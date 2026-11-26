import { http } from '../api/httpClient';

/** @typedef {{ id: number, numero: number, peso: number, repeticiones: number, rir: number }} SerieSesion */
/** @typedef {{ ejercicioId: number, seriesObjetivo: number, series: SerieSesion[] }} EjercicioSesion */
/** @typedef {{ cumplimiento: number, ejercicios: EjercicioSesion[] }} SesionDeHoy */

function aSesionDeHoy(api) {
  return {
    cumplimiento: api.cumplimiento,
    ejercicios: api.ejercicios.map((ejercicio) => ({
      ejercicioId: ejercicio.ejercicio_id,
      seriesObjetivo: ejercicio.series_objetivo,
      series: ejercicio.series
        .map(({ id, numero, peso, repeticiones, rir }) => ({ id, numero, peso, repeticiones, rir }))
        .sort((a, b) => a.numero - b.numero),
    })),
  };
}

/** @typedef {{ numero: number, peso: number, repeticiones: number, rir: number }} SerieHistorial */
/** @typedef {{ nombre: string, cumplimiento: number, series: SerieHistorial[] }} EjercicioHistorial */
/** @typedef {{ fecha: string, rutina: string, cumplimiento: number, ejercicios: EjercicioHistorial[] }} SesionHistorial */

// US-20: del contrato a lo que usa la pantalla (los campos ya coinciden; se copian para no depender del back)
/** @returns {SesionHistorial} */
function aSesionHistorial(api) {
  return {
    fecha: api.fecha,
    rutina: api.rutina,
    cumplimiento: api.cumplimiento,
    ejercicios: api.ejercicios.map((ejercicio) => ({
      nombre: ejercicio.nombre,
      cumplimiento: ejercicio.cumplimiento,
      series: ejercicio.series.map(({ numero, peso, repeticiones, rir }) => ({ numero, peso, repeticiones, rir })),
    })),
  };
}

// Controlador /api/sesiones (DEPORTISTA)
export const sesionesService = {
  /**
   * US-15/16 · GET /api/sesiones/hoy?rutina_id → sesión del servidor.
   * @param {number} rutinaId
   * @returns {Promise<SesionDeHoy>}
   */
  deHoy: async (rutinaId) => aSesionDeHoy(await http.get('/sesiones/hoy', { rutina_id: rutinaId })),

  /**
   * US-20 · GET /api/sesiones?desde&hasta → sesiones de la más reciente a la más antigua.
   * @param {string} [desde] 'YYYY-MM-DD'
   * @param {string} [hasta] 'YYYY-MM-DD'
   * @returns {Promise<SesionHistorial[]>}
   */
  listar: async (desde, hasta) => (await http.get('/sesiones', { desde, hasta })).map(aSesionHistorial),
};

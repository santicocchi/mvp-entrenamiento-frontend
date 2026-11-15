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

// Controlador /api/sesiones (DEPORTISTA)
export const sesionesService = {
  /**
   * US-15/16 · GET /api/sesiones/hoy?rutina_id → sesión del servidor.
   * @param {number} rutinaId
   * @returns {Promise<SesionDeHoy>}
   */
  deHoy: async (rutinaId) => aSesionDeHoy(await http.get('/sesiones/hoy', { rutina_id: rutinaId })),

  // US-20 · GET /api/sesiones?desde&hasta → [{ fecha, rutina, cumplimiento, ejercicios: [{ nombre, cumplimiento, series[] }] }]
  listar: (desde, hasta) => http.get('/sesiones', { desde, hasta }),
};

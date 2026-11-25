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

// RN17: el entrenador ve fecha, rutina y cumplimiento; nunca pesos, repeticiones, RIR ni récords.
/** @typedef {{ fecha: string, rutina: string, cumplimiento: number }} SesionDeAsistencia */

/** @returns {SesionDeAsistencia} */
function aSesionDeAsistencia({ fecha, rutina, cumplimiento }) {
  return { fecha, rutina, cumplimiento };
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

  /**
   * US-12 / CU14 · GET /api/deportistas/{id}/asistencia?desde&hasta (ENTRENADOR) → sesiones de la más reciente a la más antigua.
   * Está acá y no en deportistasService porque cambia cuando cambia el registro de entrenamiento.
   * @param {number|string} deportistaId
   * @param {string} [desde] YYYY-MM-DD
   * @param {string} [hasta] YYYY-MM-DD
   * @returns {Promise<SesionDeAsistencia[]>}
   */
  asistencia: async (deportistaId, desde, hasta) =>
    (await http.get(`/deportistas/${deportistaId}/asistencia`, { desde, hasta })).map(aSesionDeAsistencia),
};

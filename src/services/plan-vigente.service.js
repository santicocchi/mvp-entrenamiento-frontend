import { http } from '../api/httpClient';

/** @typedef {{ ejercicioId: number, ejercicioNombre: string, orden: number, seriesObjetivo: number, repsMin: number, repsMax: number, rirObjetivo: number }} Dosificacion */
/** @typedef {{ id: number, nombre: string, dosificaciones: Dosificacion[] }} Rutina */
/** @typedef {{ id: number, nombre: string, entrenadorNombre: string, vigencia: { desde: string, hasta: string }, indicaciones: string, rutinas: Rutina[] }} PlanVigente */

function aPlanVigente(api) {
  return {
    id: api.id,
    nombre: api.nombre,
    entrenadorNombre: api.entrenador_nombre,
    vigencia: api.vigencia,
    indicaciones: api.indicaciones,
    rutinas: api.rutinas.map((rutina) => ({
      id: rutina.id,
      nombre: rutina.nombre,
      dosificaciones: rutina.dosificaciones
        .map((dosis) => ({
          ejercicioId: dosis.ejercicio_id,
          ejercicioNombre: dosis.ejercicio_nombre,
          orden: dosis.orden,
          seriesObjetivo: dosis.series_objetivo,
          repsMin: dosis.reps_min,
          repsMax: dosis.reps_max,
          rirObjetivo: dosis.rir_objetivo,
        }))
        .sort((a, b) => a.orden - b.orden),
    })),
  };
}

// Controlador /api/plan-vigente (DEPORTISTA)
export const planVigenteService = {
  /**
   * US-13/15 · GET /api/plan-vigente → plan; 404 sin plan vigente.
   * @returns {Promise<PlanVigente>}
   */
  obtener: async () => aPlanVigente(await http.get('/plan-vigente')),
};

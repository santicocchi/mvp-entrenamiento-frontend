import { http } from '../api/httpClient';

/** @typedef {{ ejercicioId: number, ejercicioNombre?: string, orden: number, seriesObjetivo: number, repsMin: number, repsMax: number, rirObjetivo: number }} Dosificacion */
/** @typedef {{ id?: number, nombre: string, dosificaciones: Dosificacion[] }} Rutina */
/** @typedef {{ id: number, nombre: string, indicaciones: string | null, rutinas: Rutina[] }} Plan */
/** @typedef {{ id: number, nombre: string, rutinas: string[] }} PlanResumen */

// Del back al front (snake_case → camelCase). `ejercicio_nombre` y el `id` de la rutina son
// campos extra del contrato (ver CLAUDE.md): el front los usa si el back los devuelve.
/** @returns {Dosificacion} */
function aDosificacion(api) {
  return {
    ejercicioId: api.ejercicio_id,
    ejercicioNombre: api.ejercicio_nombre,
    orden: api.orden,
    seriesObjetivo: api.series_objetivo,
    repsMin: api.reps_min,
    repsMax: api.reps_max,
    rirObjetivo: api.rir_objetivo,
  };
}

/** @returns {Plan} */
function aPlan(api) {
  return {
    id: api.id,
    nombre: api.nombre,
    indicaciones: api.indicaciones ?? null,
    rutinas: api.rutinas.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      dosificaciones: r.dosificaciones.map(aDosificacion),
    })),
  };
}

// Del front al back (camelCase → snake_case): cuerpo de POST/PUT /api/planes (Paso 11).
// Las indicaciones son opcionales: si están vacías no se mandan.
function aPlanApi(plan) {
  return {
    nombre: plan.nombre,
    indicaciones: plan.indicaciones?.trim() ? plan.indicaciones : undefined,
    rutinas: plan.rutinas.map((r) => ({
      nombre: r.nombre,
      dosificaciones: r.dosificaciones.map((d) => ({
        ejercicio_id: d.ejercicioId,
        orden: d.orden,
        series_objetivo: d.seriesObjetivo,
        reps_min: d.repsMin,
        reps_max: d.repsMax,
        rir_objetivo: d.rirObjetivo,
      })),
    })),
  };
}

// Controlador /api/planes (ENTRENADOR)
export const planesService = {
  /** US-11 · GET /api/planes → [{ id, nombre, rutinas: [nombre] }] @returns {Promise<PlanResumen[]>} */
  listar: () => http.get('/planes'),

  /** US-11 · GET /api/planes/{id} → { id, nombre, indicaciones, rutinas: [{ nombre, dosificaciones[] }] } @returns {Promise<Plan>} */
  obtener: async (planId) => aPlan(await http.get(`/planes/${planId}`)),

  /**
   * US-06 · POST /api/planes { nombre, indicaciones?, rutinas: [{ nombre, dosificaciones: [...] }] } → { id }
   * Errores: 401, 404 (ejercicio fuera del catálogo), 422 (reglas RN10 y RN15).
   * @param {{ nombre: string, indicaciones?: string, rutinas: Rutina[] }} plan
   * @returns {Promise<{ id: number }>}
   */
  crear: (plan) => http.post('/planes', aPlanApi(plan)),

  // US-09 · PUT /api/planes/{id} (mismo cuerpo que crear) → { id }
  modificar: (planId, plan) => http.put(`/planes/${planId}`, aPlanApi(plan)),

  // US-10 · POST /api/planes/{id}/duplicado → { id } del plan nuevo
  duplicar: (planId) => http.post(`/planes/${planId}/duplicado`),

  // US-08 · POST /api/planes/{id}/asignaciones { deportista_id, vigencia_desde, vigencia_hasta }
  asignar: (planId, asignacion) => http.post(`/planes/${planId}/asignaciones`, asignacion),
};

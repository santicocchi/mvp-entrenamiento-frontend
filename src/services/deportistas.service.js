import { http } from '../api/httpClient';

/** @typedef {{ nombre: string, desde: string, hasta: string }} PlanVigenteResumen */
/** @typedef {{ id: number, nombre: string, email: string, planVigente: PlanVigenteResumen | null }} Deportista */

// Del back (snake_case) al front (camelCase).
// plan_vigente puede no venir mientras el back no tenga el módulo de planes (US-04): se toma como null.
/** @returns {Deportista} */
function aDeportista(api) {
  return {
    id: api.id,
    nombre: api.nombre,
    email: api.email,
    planVigente: api.plan_vigente
      ? { nombre: api.plan_vigente.nombre, desde: api.plan_vigente.vigencia_desde, hasta: api.plan_vigente.vigencia_hasta }
      : null,
  };
}

// Controlador /api/deportistas (ENTRENADOR)
export const deportistasService = {
  /** US-04 · GET /api/deportistas → Deportista[] */
  listar: async () => (await http.get('/deportistas')).map(aDeportista),

  /** US-03 · POST /api/deportistas { email } → Deportista (planVigente: null) */
  vincular: async (email) => aDeportista(await http.post('/deportistas', { email })),

  // US-12 · GET /api/deportistas/{id}/asistencia?desde&hasta → [{ fecha, rutina, cumplimiento }]
  asistencia: (deportistaId, desde, hasta) =>
    http.get(`/deportistas/${deportistaId}/asistencia`, { desde, hasta }),

  // CU19 · GET /api/deportistas/{id}/progreso/{ejercicio_id} → [{ fecha, peso_maximo, repeticiones }]
  progresoEnEjercicio: (deportistaId, ejercicioId) =>
    http.get(`/deportistas/${deportistaId}/progreso/${ejercicioId}`),
};

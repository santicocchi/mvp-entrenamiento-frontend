import { http } from '../api/httpClient';

// Controlador /api/planes (ENTRENADOR)
export const planesService = {
  // US-11 · GET /api/planes → [{ id, nombre, rutinas: [nombre] }]
  listar: () => http.get('/planes'),

  // GET /api/planes/{id} → { id, nombre, indicaciones, rutinas: [{ nombre, dosificaciones[] }] }
  obtener: (planId) => http.get(`/planes/${planId}`),

  // US-06/07 · POST /api/planes { nombre, indicaciones, rutinas: [{ nombre, dosificaciones: [...] }] } → { id }
  crear: (plan) => http.post('/planes', plan),

  // US-09 · PUT /api/planes/{id} (mismo cuerpo que crear) → { id }
  modificar: (planId, plan) => http.put(`/planes/${planId}`, plan),

  // US-10 · POST /api/planes/{id}/duplicado → { id } del plan nuevo
  duplicar: (planId) => http.post(`/planes/${planId}/duplicado`),

  // US-08 · POST /api/planes/{id}/asignaciones { deportista_id, vigencia_desde, vigencia_hasta }
  asignar: (planId, asignacion) => http.post(`/planes/${planId}/asignaciones`, asignacion),
};

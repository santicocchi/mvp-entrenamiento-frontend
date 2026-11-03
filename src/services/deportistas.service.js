import { http } from '../api/httpClient';

// Controlador /api/deportistas (ENTRENADOR)
export const deportistasService = {
  // US-04 · GET /api/deportistas → [{ id, nombre, email, plan_vigente: { nombre, vigencia_desde, vigencia_hasta } | null }]
  listar: () => http.get('/deportistas'),

  // US-03 · POST /api/deportistas { email } → { id, nombre, email }
  vincular: (email) => http.post('/deportistas', { email }),

  // US-12 · GET /api/deportistas/{id}/asistencia?desde&hasta → [{ fecha, rutina, cumplimiento }]
  asistencia: (deportistaId, desde, hasta) =>
    http.get(`/deportistas/${deportistaId}/asistencia`, { desde, hasta }),

  // CU19 · GET /api/deportistas/{id}/progreso/{ejercicio_id} → [{ fecha, peso_maximo, repeticiones }]
  progresoEnEjercicio: (deportistaId, ejercicioId) =>
    http.get(`/deportistas/${deportistaId}/progreso/${ejercicioId}`),
};

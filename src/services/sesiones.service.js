import { http } from '../api/httpClient';

// Controlador /api/sesiones (DEPORTISTA)
export const sesionesService = {
  // US-16 · GET /api/sesiones/hoy?rutina_id → { cumplimiento, ejercicios: [{ ejercicio_id, series_objetivo, series[] }] }
  deHoy: (rutinaId) => http.get('/sesiones/hoy', { rutina_id: rutinaId }),

  // US-20 · GET /api/sesiones?desde&hasta → [{ fecha, rutina, cumplimiento, ejercicios: [{ nombre, cumplimiento, series[] }] }]
  listar: (desde, hasta) => http.get('/sesiones', { desde, hasta }),
};

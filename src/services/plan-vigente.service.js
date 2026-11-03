import { http } from '../api/httpClient';

// Controlador /api/plan-vigente (DEPORTISTA)
export const planVigenteService = {
  // US-13 · GET /api/plan-vigente → { id, nombre, entrenador_nombre, vigencia, indicaciones, rutinas[] }
  // 404 si no tiene plan vigente.
  obtener: () => http.get('/plan-vigente'),
};

import { http } from '../api/httpClient';

// Controlador /api/ejercicios
export const ejerciciosService = {
  // US-05 · GET /api/ejercicios?grupo_muscular&subgrupo → [{ id, nombre, grupo_muscular, subgrupo }] (ENTRENADOR)
  listar: (grupoMuscular, subgrupo) => http.get('/ejercicios', { grupo_muscular: grupoMuscular, subgrupo }),

  // US-14 · GET /api/ejercicios/{id}/ultimas-series → { fecha, series: [{ numero, peso, repeticiones, rir }] } (DEPORTISTA)
  ultimasSeries: (ejercicioId) => http.get(`/ejercicios/${ejercicioId}/ultimas-series`),
};


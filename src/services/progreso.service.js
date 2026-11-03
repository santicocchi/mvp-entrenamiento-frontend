import { http } from '../api/httpClient';

// Controlador /api/progreso (DEPORTISTA)
export const progresoService = {
  // US-19 · GET /api/progreso?ejercicio_id → { record, por_fecha: [{ fecha, peso_maximo, rm_estimado, mejor_serie, volumen }] }
  obtener: (ejercicioId) => http.get('/progreso', { ejercicio_id: ejercicioId }),

  // CU23 · GET /api/progreso/ejercicios → [{ id, nombre }]
  ejerciciosConProgreso: () => http.get('/progreso/ejercicios'),
};

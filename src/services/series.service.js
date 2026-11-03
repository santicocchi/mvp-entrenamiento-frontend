import { http } from '../api/httpClient';

// Controlador /api/series (DEPORTISTA)
export const seriesService = {
  // US-15 · POST /api/series { rutina_id, ejercicio_id, peso, repeticiones, rir } → { serie_id, numero, record_personal }
  registrar: (serie) => http.post('/series', serie),

  // US-17 · PATCH /api/series/{id} { peso, repeticiones, rir } → { serie_id, record_personal }
  corregir: (serieId, cambios) => http.patch(`/series/${serieId}`, cambios),
};

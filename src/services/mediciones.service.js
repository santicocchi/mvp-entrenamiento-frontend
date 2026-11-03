import { http } from '../api/httpClient';

// Controlador /api/mediciones
export const medicionesService = {
  // US-21 · POST /api/mediciones { peso_corporal, altura } → { id, fecha } (DEPORTISTA)
  registrar: (pesoCorporal, altura) =>
    http.post('/mediciones', { peso_corporal: pesoCorporal, altura }),

  // GET /api/mediciones?deportista_id&desde&hasta → [{ fecha, peso_corporal, altura }]
  // deportista_id solo lo manda el entrenador.
  listar: ({ deportistaId, desde, hasta } = {}) =>
    http.get('/mediciones', { deportista_id: deportistaId, desde, hasta }),
};

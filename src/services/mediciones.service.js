import { http } from '../api/httpClient';

/** @typedef {{ fecha: string, pesoCorporal: number, altura: number }} Medicion  fecha en YYYY-MM-DD, peso en kg, altura en m */
/** @typedef {{ id: number, fecha: string }} MedicionRegistrada */

// Del back (snake_case) al front (camelCase)
/** @returns {Medicion} */
function aMedicion(api) {
  return { fecha: api.fecha, pesoCorporal: api.peso_corporal, altura: api.altura };
}

// Controlador /api/mediciones
export const medicionesService = {
  /**
   * US-21 · POST /api/mediciones { peso_corporal, altura } → { id, fecha } (DEPORTISTA)
   * La fecha la pone el back; si ya había una medición de hoy, la reemplaza (RN19).
   * @param {number} pesoCorporal en kg
   * @param {number} altura en metros
   * @returns {Promise<MedicionRegistrada>}
   */
  registrar: (pesoCorporal, altura) => http.post('/mediciones', { peso_corporal: pesoCorporal, altura }),

  /**
   * US-21 · GET /api/mediciones?deportista_id&desde&hasta → Medicion[], en orden cronológico
   * deportistaId solo lo manda el entrenador, para un deportista vinculado (RN17).
   * @param {{ deportistaId?: number | string, desde?: string, hasta?: string }} [filtros]
   * @returns {Promise<Medicion[]>}
   */
  listar: async ({ deportistaId, desde, hasta } = {}) =>
    (await http.get('/mediciones', { deportista_id: deportistaId, desde, hasta })).map(aMedicion),
};

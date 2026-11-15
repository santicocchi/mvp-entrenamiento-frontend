import { http } from '../api/httpClient';

/** @typedef {{ peso: number, repeticiones: number, rir: number }} ValoresSerie */
/** @typedef {ValoresSerie & { rutinaId: number, ejercicioId: number }} RegistroSerie */
/** @typedef {{ serieId: number, numero?: number, recordPersonal: boolean }} SerieRegistrada */

function aSerieRegistrada(api) {
  return {
    serieId: api.serie_id,
    ...(api.numero !== undefined ? { numero: api.numero } : {}),
    recordPersonal: api.record_personal,
  };
}

function aValoresSerieApi({ peso, repeticiones, rir }) {
  return { peso, repeticiones, rir };
}

function aRegistroSerieApi({ rutinaId, ejercicioId, ...valores }) {
  return { rutina_id: rutinaId, ejercicio_id: ejercicioId, ...aValoresSerieApi(valores) };
}

// Controlador /api/series (DEPORTISTA)
export const seriesService = {
  /**
   * US-15 · POST /api/series → serie registrada.
   * @param {RegistroSerie} serie
   * @returns {Promise<SerieRegistrada>}
   */
  registrar: async (serie) =>
    aSerieRegistrada(await http.post('/series', aRegistroSerieApi(serie))),

  /**
   * US-17 · PATCH /api/series/{id} → serie corregida.
   * @param {number} serieId
   * @param {ValoresSerie} cambios
   * @returns {Promise<SerieRegistrada>}
   */
  corregir: async (serieId, cambios) =>
    aSerieRegistrada(await http.patch(`/series/${serieId}`, aValoresSerieApi(cambios))),
};

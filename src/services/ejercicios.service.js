import { http } from '../api/httpClient';

/** @typedef {{ numero: number, peso: number, repeticiones: number, rir: number }} SerieAnterior */
/** @typedef {{ fecha: string | null, series: SerieAnterior[] }} UltimasSeries  fecha null y series [] si nunca hizo el ejercicio */

// Del back al front. El contrato no tiene claves en snake_case, pero se copian los campos
// para que la pantalla no dependa de lo que el back agregue, y se ordenan por número.
/** @returns {UltimasSeries} */
function aUltimasSeries(api) {
  return {
    fecha: api.fecha ?? null,
    series: (api.series ?? [])
      .map(({ numero, peso, repeticiones, rir }) => ({ numero, peso, repeticiones, rir }))
      .sort((a, b) => a.numero - b.numero),
  };
}

// Controlador /api/ejercicios
export const ejerciciosService = {
  // US-05 · GET /api/ejercicios?grupo_muscular&subgrupo → [{ id, nombre, grupo_muscular, subgrupo }] (ENTRENADOR)
  listar: (grupoMuscular, subgrupo) =>
    http.get('/ejercicios', { grupo_muscular: grupoMuscular, subgrupo }),

  /**
   * US-14 · GET /api/ejercicios/{id}/ultimas-series → UltimasSeries (DEPORTISTA)
   * Series de la última sesión anterior a hoy con ese ejercicio; las de hoy no entran.
   * @param {number} ejercicioId
   * @returns {Promise<UltimasSeries>}
   */
  ultimasSeries: async (ejercicioId) =>
    aUltimasSeries(await http.get(`/ejercicios/${ejercicioId}/ultimas-series`)),
};

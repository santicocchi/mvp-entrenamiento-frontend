import { http } from '../api/httpClient';

/** @typedef {{ peso: number, repeticiones: number }} Marca */
/** @typedef {{ peso: number, repeticiones: number, fecha: string }} RecordPersonal */
/** @typedef {{ fecha: string, pesoMaximo: number, rmEstimado: number, mejorSerie: Marca, volumen: number }} ProgresoDeLaFecha */
/** @typedef {{ record: RecordPersonal | null, porFecha: ProgresoDeLaFecha[] }} Progreso */
/** @typedef {{ id: number, nombre: string }} EjercicioConProgreso */
/** @typedef {{ fecha: string, pesoMaximo: number, repeticiones: number }} PesoMaximoDeLaFecha */

// Del back (snake_case) al front (camelCase). Los valores (récord, 1RM, volumen) los calcula el back.
/** @returns {Progreso} */
function aProgreso(api) {
  return {
    record: api.record
      ? { peso: api.record.peso, repeticiones: api.record.repeticiones, fecha: api.record.fecha }
      : null,
    porFecha: api.por_fecha.map((delDia) => ({
      fecha: delDia.fecha,
      pesoMaximo: delDia.peso_maximo,
      rmEstimado: delDia.rm_estimado,
      mejorSerie: { peso: delDia.mejor_serie.peso, repeticiones: delDia.mejor_serie.repeticiones },
      volumen: delDia.volumen,
    })),
  };
}

/** @typedef {{ desde: string, hasta: string, records: number, volumen: number, volumenAnterior: number, sesiones: number, series: number }} ResumenDeLaSemana */

/** @returns {ResumenDeLaSemana} */
function aResumen(api) {
  return {
    desde: api.desde,
    hasta: api.hasta,
    records: api.records,
    volumen: api.volumen,
    volumenAnterior: api.volumen_anterior,
    sesiones: api.sesiones,
    series: api.series,
  };
}

/** @returns {PesoMaximoDeLaFecha} */
function aPesoMaximoDeLaFecha(api) {
  return { fecha: api.fecha, pesoMaximo: api.peso_maximo, repeticiones: api.repeticiones };
}

// Registro de entrenamiento: progreso calculado a partir de las series (modelo de lectura).
export const progresoService = {
  /**
   * US-19 · GET /api/progreso?ejercicio_id → Progreso (récord y una entrada por fecha, de la más antigua a la más reciente)
   * @param {number|string} ejercicioId
   * @returns {Promise<Progreso>}
   */
  obtener: async (ejercicioId) => aProgreso(await http.get('/progreso', { ejercicio_id: ejercicioId })),

  /**
   * Resumen · GET /api/progreso/resumen → de esta semana (lunes a domingo): récords personales,
   * volumen (y el de la semana anterior), sesiones y series.
   * @returns {Promise<ResumenDeLaSemana>}
   */
  resumen: async () => aResumen(await http.get('/progreso/resumen')),

  /**
   * US-19 / CU23 · GET /api/progreso/ejercicios → los ejercicios que el deportista registró alguna vez
   * @returns {Promise<EjercicioConProgreso[]>}
   */
  ejerciciosConProgreso: async () =>
    (await http.get('/progreso/ejercicios')).map(({ id, nombre }) => ({ id, nombre })),

  /**
   * US-06 / CU19 · GET /api/deportistas/{id}/progreso/{ejercicio_id} → peso máximo por fecha (RN17: sin 1RM ni récords)
   * @returns {Promise<PesoMaximoDeLaFecha[]>}
   */
  deDeportista: async (deportistaId, ejercicioId) =>
    (await http.get(`/deportistas/${deportistaId}/progreso/${ejercicioId}`)).map(aPesoMaximoDeLaFecha),
};

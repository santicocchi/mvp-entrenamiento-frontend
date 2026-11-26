// US-20: textos y cuentas que comparten la lista y el detalle de una sesión.
// Solo cuentan lo que mandó el back: el cumplimiento y los récords los decide el back.

/** @typedef {import('../../services/sesiones.service').SesionHistorial} SesionHistorial */

/** @param {SesionHistorial} sesion */
export function resumirSesion(sesion) {
  const series = sesion.ejercicios.reduce((total, e) => total + e.series.length, 0);
  const ejerciciosConRecord = sesion.ejercicios
    .filter((e) => e.series.some((s) => s.recordPersonal))
    .map((e) => e.nombre);
  const records = sesion.ejercicios.reduce(
    (total, e) => total + e.series.filter((s) => s.recordPersonal).length,
    0,
  );
  const incompletos = sesion.ejercicios.filter((e) => e.cumplimiento < 100).length;
  return { series, records, ejerciciosConRecord, incompletos, ejercicios: sesion.ejercicios.length };
}

export const textoSeries = (n) => `${n} ${n === 1 ? 'serie registrada' : 'series registradas'}`;

export const textoRecords = (n) => (n === 1 ? '1 récord personal' : `${n} récords personales`);

// 0 kg es un ejercicio con el peso del cuerpo (RN5)
export const formatearPeso = (peso) => (peso === 0 ? 'Peso corporal' : `${peso.toLocaleString('es-AR')} kg`);

// "Sentadilla", "Sentadilla y Press de banca", "Sentadilla, Remo y Press de banca"
export function enumerar(nombres) {
  if (nombres.length <= 1) return nombres.join('');
  return `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`;
}

// Qué le quedó por hacer, en una frase
export function mensajeCumplimiento({ incompletos, ejercicios }) {
  if (ejercicios === 0) return 'Esta rutina no tiene ejercicios para mostrar.';
  if (incompletos === 0) return 'Completaste todas las series que pedía la rutina.';
  return incompletos === 1
    ? `Te faltaron series en 1 de los ${ejercicios} ejercicios.`
    : `Te faltaron series en ${incompletos} de los ${ejercicios} ejercicios.`;
}

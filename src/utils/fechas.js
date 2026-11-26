// Fechas en ISO 8601 (YYYY-MM-DD), igual que el contrato.
// Ojo: en el back la fecha de hoy la pone el servidor (RN12). Esto es solo para filtros y mocks.
export function hoy() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export function sumarDias(fecha, dias) {
  const [a, m, d] = fecha.split('-').map(Number);
  const nueva = new Date(a, m - 1, d + dias);
  const mes = String(nueva.getMonth() + 1).padStart(2, '0');
  const dia = String(nueva.getDate()).padStart(2, '0');
  return `${nueva.getFullYear()}-${mes}-${dia}`;
}

// 2026-10-21 → 21/10/2026
export function formatearFecha(fecha) {
  if (!fecha) return '';
  const [a, m, d] = fecha.split('-');
  return `${d}/${m}/${a}`;
}

// 2026-10-21 → 21/10
export function formatearFechaCorta(fecha) {
  if (!fecha) return '';
  const [, m, d] = fecha.split('-');
  return `${d}/${m}`;
}

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

// Fecha del calendario en UTC: así los días no se corren por la zona horaria ni el horario de verano
function aUtc(fecha) {
  const [a, m, d] = fecha.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, d));
}

// Días de calendario entre dos fechas: ('2026-10-14', '2026-10-21') → 7
export function diasEntre(desde, hasta) {
  return Math.round((aUtc(hasta) - aUtc(desde)) / 86_400_000);
}

// US-20: cuánto pasó desde esa fecha, en palabras: Hoy, Ayer, Hace 5 días
export function haceCuanto(fecha, referencia = hoy()) {
  const dias = diasEntre(fecha, referencia);
  if (dias <= 0) return 'Hoy';
  if (dias === 1) return 'Ayer';
  return `Hace ${dias} días`;
}

// 2026-10-14 → Miércoles 14 de octubre (con el año solo si no es el actual)
export function formatearFechaLarga(fecha, referencia = hoy()) {
  const d = aUtc(fecha);
  const dia = DIAS_SEMANA[d.getUTCDay()];
  const texto = `${dia[0].toUpperCase()}${dia.slice(1)} ${d.getUTCDate()} de ${MESES[d.getUTCMonth()]}`;
  return fecha.slice(0, 4) === referencia.slice(0, 4) ? texto : `${texto} de ${fecha.slice(0, 4)}`;
}

// 2026-10-14 → { dia: '14', mes: 'oct' }, para el bloque de fecha de las tarjetas
export function partesFecha(fecha) {
  const d = aUtc(fecha);
  return { dia: String(d.getUTCDate()), mes: MESES[d.getUTCMonth()].slice(0, 3) };
}

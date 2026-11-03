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

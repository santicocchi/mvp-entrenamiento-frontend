import { diasEntre, formatearFechaLarga, haceCuanto, partesFecha } from './fechas';

describe('fechas (US-20)', () => {
  it('cuenta los días de calendario entre dos fechas, aunque cambie el mes', () => {
    expect(diasEntre('2026-10-14', '2026-10-21')).toBe(7);
    expect(diasEntre('2026-10-30', '2026-11-02')).toBe(3);
  });

  it.each([
    ['2026-10-21', 'Hoy'],
    ['2026-10-20', 'Ayer'],
    ['2026-10-18', 'Hace 3 días'],
    ['2026-09-21', 'Hace 30 días'],
  ])('%s, visto el 21/10, es "%s"', (fecha, texto) => {
    expect(haceCuanto(fecha, '2026-10-21')).toBe(texto);
  });

  it('escribe la fecha con el día de la semana, y el año solo si no es el actual', () => {
    expect(formatearFechaLarga('2026-10-14', '2026-10-21')).toBe('Miércoles 14 de octubre');
    expect(formatearFechaLarga('2025-12-31', '2026-01-05')).toBe('Miércoles 31 de diciembre de 2025');
  });

  it('separa el día y el mes abreviado para la tarjeta', () => {
    expect(partesFecha('2026-10-04')).toEqual({ dia: '4', mes: 'oct' });
  });
});

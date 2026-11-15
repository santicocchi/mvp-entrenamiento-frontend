import { http } from '../api/httpClient';
import { ejerciciosService } from './ejercicios.service';

vi.mock('../api/httpClient', () => ({ http: { get: vi.fn() } }));

describe('ejerciciosService.ultimasSeries (US-14)', () => {
  it('pide las últimas series del ejercicio y devuelve la fecha y las series', async () => {
    http.get.mockResolvedValue({
      fecha: '2026-10-14',
      series: [
        { numero: 1, peso: 60, repeticiones: 8, rir: 2 },
        { numero: 2, peso: 60, repeticiones: 8, rir: 1 },
      ],
    });

    expect(await ejerciciosService.ultimasSeries(1)).toEqual({
      fecha: '2026-10-14',
      series: [
        { numero: 1, peso: 60, repeticiones: 8, rir: 2 },
        { numero: 2, peso: 60, repeticiones: 8, rir: 1 },
      ],
    });
    expect(http.get).toHaveBeenCalledWith('/ejercicios/1/ultimas-series');
  });

  it('ordena las series por su número', async () => {
    http.get.mockResolvedValue({
      fecha: '2026-10-14',
      series: [
        { numero: 2, peso: 60, repeticiones: 7, rir: 1 },
        { numero: 1, peso: 60, repeticiones: 8, rir: 2 },
      ],
    });

    const { series } = await ejerciciosService.ultimasSeries(1);

    expect(series.map((s) => s.numero)).toEqual([1, 2]);
  });

  it('si nunca hizo el ejercicio devuelve fecha null y series vacías', async () => {
    http.get.mockResolvedValue({ fecha: null, series: [] });

    expect(await ejerciciosService.ultimasSeries(9)).toEqual({ fecha: null, series: [] });
  });

  it('deja subir el error del back sin atraparlo', async () => {
    http.get.mockRejectedValue(new Error('No tenés permisos para realizar esta acción.'));

    await expect(ejerciciosService.ultimasSeries(1)).rejects.toThrow(
      'No tenés permisos para realizar esta acción.',
    );
  });
});

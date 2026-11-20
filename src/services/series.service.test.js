import { http } from '../api/httpClient';
import { seriesService } from './series.service';

vi.mock('../api/httpClient', () => ({ http: { post: vi.fn(), patch: vi.fn() } }));

describe('seriesService (US-15)', () => {
  it('traduce el comando y la respuesta sin enviar fecha, identidad o número del cliente', async () => {
    http.post.mockResolvedValue({ serie_id: 17, numero: 2, record_personal: true });
    const resultado = await seriesService.registrar({
      rutinaId: 1,
      ejercicioId: 2,
      peso: 62.55,
      repeticiones: 8,
      rir: 2,
      fecha: '2026-10-20',
      deportistaId: 99,
      numero: 50,
    });
    expect(http.post).toHaveBeenCalledWith('/series', {
      rutina_id: 1,
      ejercicio_id: 2,
      peso: 62.55,
      repeticiones: 8,
      rir: 2,
    });
    expect(resultado).toEqual({ serieId: 17, numero: 2, recordPersonal: true });
  });
  it('conserva la corrección y traduce su respuesta', async () => {
    http.patch.mockResolvedValue({ serie_id: 17, record_personal: false });
    expect(
      await seriesService.corregir(17, { peso: 0, repeticiones: 8, rir: 0, fecha: '2026-10-20' }),
    ).toEqual({ serieId: 17, recordPersonal: false });
    expect(http.patch).toHaveBeenCalledWith('/series/17', { peso: 0, repeticiones: 8, rir: 0 });
  });
  it('propaga el error original del backend', async () => {
    const error = new Error('El ejercicio no pertenece a esa rutina de tu plan vigente.');
    http.post.mockRejectedValueOnce(error);
    await expect(
      seriesService.registrar({ rutinaId: 1, ejercicioId: 2, peso: 60, repeticiones: 8, rir: 2 }),
    ).rejects.toBe(error);
  });
});

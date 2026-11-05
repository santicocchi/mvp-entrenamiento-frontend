import { http } from '../api/httpClient';
import { sesionesService } from './sesiones.service';

vi.mock('../api/httpClient', () => ({ http: { get: vi.fn() } }));

it('traduce la sesión conservando los números e ids asignados por el servidor', async () => {
  http.get.mockResolvedValue({
    cumplimiento: 33,
    ejercicios: [
      {
        ejercicio_id: 2,
        series_objetivo: 3,
        series: [
          { id: 12, numero: 2, peso: 60, repeticiones: 7, rir: 1 },
          { id: 11, numero: 1, peso: 60, repeticiones: 8, rir: 2 },
        ],
      },
    ],
  });
  expect(await sesionesService.deHoy(1)).toEqual({
    cumplimiento: 33,
    ejercicios: [
      {
        ejercicioId: 2,
        seriesObjetivo: 3,
        series: [
          { id: 11, numero: 1, peso: 60, repeticiones: 8, rir: 2 },
          { id: 12, numero: 2, peso: 60, repeticiones: 7, rir: 1 },
        ],
      },
    ],
  });
  expect(http.get).toHaveBeenCalledWith('/sesiones/hoy', { rutina_id: 1 });
});

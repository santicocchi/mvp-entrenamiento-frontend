import { http } from '../api/httpClient';
import { planVigenteService } from './plan-vigente.service';

vi.mock('../api/httpClient', () => ({ http: { get: vi.fn() } }));

it('traduce el plan vigente y las dosificaciones a camelCase', async () => {
  http.get.mockResolvedValue({
    id: 1,
    nombre: 'Fuerza',
    entrenador_nombre: 'Laura',
    indicaciones: 'Descansar',
    vigencia: { desde: '2026-10-01', hasta: '2026-11-30' },
    rutinas: [
      {
        id: 1,
        nombre: 'Piernas',
        dosificaciones: [
          {
            ejercicio_id: 2,
            ejercicio_nombre: 'Sentadilla',
            orden: 1,
            series_objetivo: 3,
            reps_min: 8,
            reps_max: 10,
            rir_objetivo: 2,
          },
        ],
      },
    ],
  });
  const plan = await planVigenteService.obtener();
  expect(plan.entrenadorNombre).toBe('Laura');
  expect(plan.rutinas[0]).toEqual({
    id: 1,
    nombre: 'Piernas',
    dosificaciones: [
      {
        ejercicioId: 2,
        ejercicioNombre: 'Sentadilla',
        orden: 1,
        seriesObjetivo: 3,
        repsMin: 8,
        repsMax: 10,
        rirObjetivo: 2,
      },
    ],
  });
  expect(http.get).toHaveBeenCalledWith('/plan-vigente');
});

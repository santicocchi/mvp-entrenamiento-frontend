import { http } from '../api/httpClient';
import { progresoService } from './progreso.service';

vi.mock('../api/httpClient', () => ({ http: { get: vi.fn() } }));

describe('progresoService', () => {
  it('obtener: pide el progreso del ejercicio y lo traduce a camelCase (E8)', async () => {
    http.get.mockResolvedValue({
      record: { peso: 65, repeticiones: 8, fecha: '2026-10-21' },
      por_fecha: [
        { fecha: '2026-10-14', peso_maximo: 60, rm_estimado: 76, mejor_serie: { peso: 60, repeticiones: 8 }, volumen: 1440 },
        { fecha: '2026-10-21', peso_maximo: 65, rm_estimado: 82.3, mejor_serie: { peso: 65, repeticiones: 8 }, volumen: 1395 },
      ],
    });

    expect(await progresoService.obtener(1)).toEqual({
      record: { peso: 65, repeticiones: 8, fecha: '2026-10-21' },
      porFecha: [
        { fecha: '2026-10-14', pesoMaximo: 60, rmEstimado: 76, mejorSerie: { peso: 60, repeticiones: 8 }, volumen: 1440 },
        { fecha: '2026-10-21', pesoMaximo: 65, rmEstimado: 82.3, mejorSerie: { peso: 65, repeticiones: 8 }, volumen: 1395 },
      ],
    });
    expect(http.get).toHaveBeenCalledWith('/progreso', { ejercicio_id: 1 });
  });

  it('obtener: si nunca hizo el ejercicio devuelve récord null y sin fechas', async () => {
    http.get.mockResolvedValue({ record: null, por_fecha: [] });
    expect(await progresoService.obtener(9)).toEqual({ record: null, porFecha: [] });
  });

  it('resumen: pide el resumen y lo traduce a camelCase', async () => {
    http.get.mockResolvedValue({
      desde: '2026-10-19', hasta: '2026-10-25', records: 1, volumen: 1020, volumen_anterior: 1440, sesiones: 2, series: 4,
    });
    expect(await progresoService.resumen()).toEqual({
      desde: '2026-10-19', hasta: '2026-10-25', records: 1, volumen: 1020, volumenAnterior: 1440, sesiones: 2, series: 4,
    });
    expect(http.get).toHaveBeenCalledWith('/progreso/resumen');
  });

  it('ejerciciosConProgreso: lista los ejercicios registrados alguna vez', async () => {
    http.get.mockResolvedValue([{ id: 1, nombre: 'Sentadilla con barra' }]);
    expect(await progresoService.ejerciciosConProgreso()).toEqual([{ id: 1, nombre: 'Sentadilla con barra' }]);
    expect(http.get).toHaveBeenCalledWith('/progreso/ejercicios');
  });

  it('deDeportista: peso máximo por fecha de un deportista vinculado (CU19)', async () => {
    http.get.mockResolvedValue([{ fecha: '2026-10-14', peso_maximo: 60, repeticiones: 8 }]);
    expect(await progresoService.deDeportista(3, 1)).toEqual([{ fecha: '2026-10-14', pesoMaximo: 60, repeticiones: 8 }]);
    expect(http.get).toHaveBeenCalledWith('/deportistas/3/progreso/1');
  });
});

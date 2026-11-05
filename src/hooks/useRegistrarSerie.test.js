import { act, renderHook, waitFor } from '@testing-library/react';
import { useRegistrarSerie } from './useRegistrarSerie';
import { seriesService } from '../services/series.service';
import { sesionesService } from '../services/sesiones.service';

vi.mock('../services/series.service', () => ({
  seriesService: { registrar: vi.fn(), corregir: vi.fn() },
}));
vi.mock('../services/sesiones.service', () => ({ sesionesService: { deHoy: vi.fn() } }));

describe('useRegistrarSerie (US-15)', () => {
  const vacia = {
    cumplimiento: 0,
    ejercicios: [{ ejercicioId: 1, seriesObjetivo: 3, series: [] }],
  };
  const valores = { peso: '62,55', repeticiones: '8', rir: '2' };

  beforeEach(() => {
    vi.resetAllMocks();
    sesionesService.deHoy.mockResolvedValue(vacia);
    seriesService.registrar.mockResolvedValue({ serieId: 17, numero: 1, recordPersonal: false });
    seriesService.corregir.mockResolvedValue({ serieId: 17, recordPersonal: false });
  });
  async function preparar() {
    const hook = renderHook(() => useRegistrarSerie('1'));
    await waitFor(() => expect(hook.result.current.cargando).toBe(false));
    return hook;
  }

  it('normaliza coma decimal y refresca sin calcular números ni cumplimiento', async () => {
    const { result } = await preparar();
    const guardada = {
      cumplimiento: 17,
      ejercicios: [
        {
          ejercicioId: 1,
          seriesObjetivo: 3,
          series: [{ id: 17, numero: 4, peso: 62.55, repeticiones: 8, rir: 2 }],
        },
      ],
    };
    sesionesService.deHoy.mockResolvedValueOnce(guardada);
    await act(async () => {
      expect(await result.current.registrar(1, valores)).toBeNull();
    });
    expect(seriesService.registrar).toHaveBeenCalledWith({
      rutinaId: 1,
      ejercicioId: 1,
      peso: 62.55,
      repeticiones: 8,
      rir: 2,
    });
    expect(result.current.sesion).toEqual(guardada);
  });
  it.each([
    [{ peso: '' }, 'El peso es obligatorio.'],
    [{ peso: ' ' }, 'El peso es obligatorio.'],
    [{ peso: null }, 'El peso es obligatorio.'],
    [{ peso: '-5' }, 'El peso no puede ser negativo.'],
    [{ peso: '60.001' }, 'El peso admite hasta 2 decimales.'],
    [{ peso: 'Infinity' }, 'El peso debe ser un número finito.'],
    [{ repeticiones: '' }, 'Las repeticiones son obligatorias.'],
    [{ repeticiones: '0' }, 'Las repeticiones tienen que ser mayores a 0.'],
    [{ repeticiones: '1.5' }, 'Las repeticiones deben ser un entero.'],
    [{ rir: '' }, 'El RIR es obligatorio.'],
    [{ rir: '-1' }, 'El RIR no puede ser negativo.'],
    [{ rir: '1.5' }, 'El RIR debe ser un entero.'],
  ])('rechaza %j antes de enviar el comando', async (cambios, mensaje) => {
    const { result } = await preparar();
    await act(async () => {
      expect(await result.current.registrar(1, { ...valores, ...cambios })).toBe(mensaje);
    });
    expect(seriesService.registrar).not.toHaveBeenCalled();
    expect(result.current.sesion).toEqual(vacia);
  });
  it('acepta peso corporal y RIR cero', async () => {
    const { result } = await preparar();
    await act(async () => {
      expect(
        await result.current.registrar(1, { peso: '0', repeticiones: '1', rir: '0' }),
      ).toBeNull();
    });
    expect(seriesService.registrar).toHaveBeenCalledWith({
      rutinaId: 1,
      ejercicioId: 1,
      peso: 0,
      repeticiones: 1,
      rir: 0,
    });
  });
  it('muestra el error del backend textual y no cambia la sesión', async () => {
    const { result } = await preparar();
    seriesService.registrar.mockRejectedValueOnce(
      new Error('El ejercicio no pertenece a esa rutina de tu plan vigente.'),
    );
    await act(async () => {
      expect(await result.current.registrar(1, valores)).toBe(
        'El ejercicio no pertenece a esa rutina de tu plan vigente.',
      );
    });
    expect(result.current.sesion).toEqual(vacia);
    expect(sesionesService.deHoy).toHaveBeenCalledTimes(1);
  });
  it('muestra y limpia el récord según la respuesta del servidor', async () => {
    const { result } = await preparar();
    seriesService.registrar.mockResolvedValueOnce({ serieId: 17, numero: 1, recordPersonal: true });
    await act(async () => {
      await result.current.registrar(1, valores);
    });
    expect(result.current.record).toEqual({ ejercicioId: 1, peso: 62.55, repeticiones: 8, rir: 2 });
    await act(async () => {
      await result.current.registrar(1, valores);
    });
    expect(result.current.record).toBeNull();
  });
  it('una consulta fallida tras guardar se reintenta sin reenviar el POST', async () => {
    const { result } = await preparar();
    sesionesService.deHoy.mockRejectedValueOnce(new Error('Consulta temporalmente no disponible.'));
    await act(async () => {
      expect(await result.current.registrar(1, valores)).toBeNull();
    });
    expect(result.current.errorActualizacion).toBe('Consulta temporalmente no disponible.');
    await act(async () => {
      expect(await result.current.registrar(1, valores)).toBe(
        'Actualizá la sesión antes de registrar otra serie.',
      );
    });
    await act(async () => {
      await result.current.recargar();
    });
    expect(result.current.errorActualizacion).toBeNull();
    expect(seriesService.registrar).toHaveBeenCalledTimes(1);
  });
  it('bloquea solicitudes duplicadas durante el guardado', async () => {
    const { result } = await preparar();
    let finalizar;
    seriesService.registrar.mockImplementationOnce(
      () =>
        new Promise((resolver) => {
          finalizar = resolver;
        }),
    );
    let pendiente;
    act(() => {
      pendiente = result.current.registrar(1, valores);
    });
    await act(async () => {
      expect(await result.current.registrar(1, valores)).toBe(
        'Esperá a que termine el registro en curso.',
      );
    });
    expect(seriesService.registrar).toHaveBeenCalledTimes(1);
    await act(async () => {
      finalizar({ serieId: 17, numero: 1, recordPersonal: false });
      await pendiente;
    });
    expect(result.current.enviando).toBe(false);
  });
  it('ignora respuestas de una rutina que ya se abandonó', async () => {
    let finalizarAnterior;
    sesionesService.deHoy.mockImplementationOnce(
      () =>
        new Promise((resolver) => {
          finalizarAnterior = resolver;
        }),
    );
    const { result, rerender } = renderHook(({ rutinaId }) => useRegistrarSerie(rutinaId), {
      initialProps: { rutinaId: '1' },
    });
    const torso = {
      cumplimiento: 40,
      ejercicios: [{ ejercicioId: 4, seriesObjetivo: 3, series: [] }],
    };
    sesionesService.deHoy.mockResolvedValueOnce(torso);
    rerender({ rutinaId: '2' });
    await waitFor(() => expect(result.current.sesion).toEqual(torso));
    await act(async () => {
      finalizarAnterior(vacia);
    });
    expect(result.current.sesion).toEqual(torso);
  });
  it('conserva la corrección usando el mismo contrato traducido', async () => {
    const { result } = await preparar();
    await act(async () => {
      expect(await result.current.corregir(17, 1, valores)).toBeNull();
    });
    expect(seriesService.corregir).toHaveBeenCalledWith(17, {
      peso: 62.55,
      repeticiones: 8,
      rir: 2,
    });
    expect(seriesService.registrar).not.toHaveBeenCalled();
  });
});

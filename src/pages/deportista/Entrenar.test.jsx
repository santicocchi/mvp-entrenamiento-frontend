import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Entrenar from './Entrenar';
import { planVigenteService } from '../../services/plan-vigente.service';
import { sesionesService } from '../../services/sesiones.service';
import { ejerciciosService } from '../../services/ejercicios.service';
import { seriesService } from '../../services/series.service';

vi.mock('../../services/plan-vigente.service', () => ({
  planVigenteService: { obtener: vi.fn() },
}));
vi.mock('../../services/sesiones.service', () => ({ sesionesService: { deHoy: vi.fn() } }));
vi.mock('../../services/ejercicios.service', () => ({
  ejerciciosService: { ultimasSeries: vi.fn() },
}));
vi.mock('../../services/series.service', () => ({
  seriesService: { registrar: vi.fn(), corregir: vi.fn() },
}));

describe('Pantalla Entrenar (US-15)', () => {
  const plan = {
    id: 1,
    nombre: 'Fuerza',
    rutinas: [
      {
        id: 1,
        nombre: 'Piernas',
        dosificaciones: [
          {
            ejercicioId: 1,
            ejercicioNombre: 'Sentadilla',
            seriesObjetivo: 3,
            repsMin: 8,
            repsMax: 10,
            rirObjetivo: 2,
          },
        ],
      },
    ],
  };
  const vacia = {
    cumplimiento: 0,
    ejercicios: [{ ejercicioId: 1, seriesObjetivo: 3, series: [] }],
  };
  beforeEach(() => {
    vi.resetAllMocks();
    planVigenteService.obtener.mockResolvedValue(plan);
    sesionesService.deHoy.mockResolvedValue(vacia);
    ejerciciosService.ultimasSeries.mockResolvedValue({
      fecha: '2026-10-14',
      series: [{ numero: 1, peso: 60, repeticiones: 8, rir: 2 }],
    });
    seriesService.registrar.mockResolvedValue({ serieId: 17, numero: 1, recordPersonal: false });
  });
  function abrir(ruta = '/deportista/entrenar/1') {
    return render(
      <MemoryRouter initialEntries={[ruta]}>
        <Routes>
          <Route path="/deportista/entrenar/:rutinaId" element={<Entrenar />} />
        </Routes>
      </MemoryRouter>,
    );
  }
  it('muestra carga y luego el ejercicio del plan con valores precargados', async () => {
    abrir();
    expect(screen.getByText('Cargando…')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Piernas' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByLabelText('Peso (kg)')).toHaveValue('60'));
    expect(screen.getByLabelText('Reps')).toHaveValue(8);
  });
  it('muestra vacío cuando no hay un plan vigente', async () => {
    planVigenteService.obtener.mockRejectedValueOnce(
      Object.assign(new Error('No tenés un plan vigente.'), { status: 404 }),
    );
    abrir();
    expect(
      await screen.findByText('No tenés un plan vigente. Pedile uno a tu entrenador.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('form')).toBeNull();
  });
  it('una ruta ajena no ofrece registrar ejercicios', async () => {
    abrir('/deportista/entrenar/99');
    expect(
      await screen.findByText('La rutina no pertenece a tu plan vigente.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('form')).toBeNull();
  });
  it('muestra el error del servidor sin sustituirlo por un mensaje genérico', async () => {
    sesionesService.deHoy.mockRejectedValueOnce(new Error('La rutina no es de tu plan vigente.'));
    abrir();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'La rutina no es de tu plan vigente.',
    );
  });
  it('un rechazo de negocio no agrega una serie', async () => {
    seriesService.registrar.mockRejectedValueOnce(
      new Error('El ejercicio no pertenece a esa rutina de tu plan vigente.'),
    );
    abrir();
    await screen.findByRole('heading', { name: 'Sentadilla' });
    await waitFor(() => expect(screen.getByLabelText('Peso (kg)')).toHaveValue('60'));
    await userEvent.click(screen.getByRole('button', { name: 'Registrar serie' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El ejercicio no pertenece a esa rutina de tu plan vigente.',
    );
    expect(screen.getByText('0 de 3 series')).toBeInTheDocument();
  });
  it('si falla recargar, conserva el formulario y permite actualizar sin duplicar la serie', async () => {
    abrir();
    await waitFor(() => expect(screen.getByLabelText('Peso (kg)')).toHaveValue('60'));
    sesionesService.deHoy.mockRejectedValueOnce(new Error('No se pudo consultar la sesión.'));
    await userEvent.click(screen.getByRole('button', { name: 'Registrar serie' }));
    expect(await screen.findByText('Serie registrada.')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo consultar la sesión.');
    expect(screen.getByRole('button', { name: 'Registrar serie' })).toBeDisabled();
    sesionesService.deHoy.mockResolvedValueOnce({
      cumplimiento: 33,
      ejercicios: [
        {
          ejercicioId: 1,
          seriesObjetivo: 3,
          series: [{ id: 17, numero: 1, peso: 60, repeticiones: 8, rir: 2 }],
        },
      ],
    });
    await userEvent.click(screen.getByRole('button', { name: 'Actualizar sesión' }));
    await waitFor(() => expect(screen.getByText('1 de 3 series')).toBeInTheDocument());
    expect(within(screen.getByRole('list')).getByText('1')).toBeInTheDocument();
    expect(seriesService.registrar).toHaveBeenCalledTimes(1);
  });
});

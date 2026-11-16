import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import { useAuth } from '../../context/AuthContext';
import { planVigenteService } from '../../services/plan-vigente.service';
import { sesionesService } from '../../services/sesiones.service';
import { ejerciciosService } from '../../services/ejercicios.service';
import { seriesService } from '../../services/series.service';

vi.mock('../../context/AuthContext', () => ({
  useAuth: vi.fn(),
  rutaInicialPorRol: (rol) =>
    rol === 'ENTRENADOR' ? '/entrenador/deportistas' : '/deportista/plan',
}));
vi.mock('../entrenador/Deportistas', () => ({ default: () => <h1>Mis deportistas</h1> }));
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
          ejercicioNombre: 'Sentadilla con barra',
          orden: 1,
          seriesObjetivo: 3,
          repsMin: 8,
          repsMax: 10,
          rirObjetivo: 2,
        },
      ],
    },
  ],
};
const sesionCon = (series) => ({
  cumplimiento: 33,
  ejercicios: [{ ejercicioId: 1, seriesObjetivo: 3, series }],
});
const serieDeHoy = { id: 17, numero: 1, peso: 62.5, repeticiones: 8, rir: 2 };

describe('US-18: aviso en la pantalla protegida del deportista', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    useAuth.mockReturnValue({
      usuario: { id: 3, nombre: 'Juan', rol: 'DEPORTISTA' },
      salir: vi.fn(),
    });
    planVigenteService.obtener.mockResolvedValue(plan);
    sesionesService.deHoy.mockResolvedValue(sesionCon([]));
    ejerciciosService.ultimasSeries.mockResolvedValue({
      fecha: '2026-10-14',
      series: [{ numero: 1, peso: 60, repeticiones: 8, rir: 2 }],
    });
    seriesService.registrar.mockResolvedValue({ serieId: 17, numero: 1, recordPersonal: false });
    seriesService.corregir.mockResolvedValue({ serieId: 17, recordPersonal: false });
  });

  function abrir() {
    return render(
      <MemoryRouter initialEntries={['/deportista/entrenar/1']}>
        <App />
      </MemoryRouter>,
    );
  }
  const aviso = () => screen.queryByText('Nuevo récord personal');
  async function registrarPrimera() {
    const usuario = userEvent.setup();
    abrir();
    await waitFor(() => expect(screen.getByLabelText('Peso (kg)')).toHaveValue('60'));
    await usuario.clear(screen.getByLabelText('Peso (kg)'));
    await usuario.type(screen.getByLabelText('Peso (kg)'), '62,5');
    await usuario.click(screen.getByRole('button', { name: 'Registrar serie' }));
    return usuario;
  }

  it('E2: muestra el récord informado por POST con el nombre y los valores registrados', async () => {
    seriesService.registrar.mockResolvedValueOnce({ serieId: 17, numero: 1, recordPersonal: true });
    await registrarPrimera();
    const titulo = await screen.findByText('Nuevo récord personal');
    expect(titulo.closest('[role="status"]')).toHaveTextContent(
      'Sentadilla con barra: 62.5 kg × 8',
    );
  });

  it('E3: igual peso y menos repeticiones no muestra un aviso si el backend devuelve false', async () => {
    sesionesService.deHoy.mockResolvedValue(sesionCon([serieDeHoy]));
    abrir();
    const usuario = userEvent.setup();
    await waitFor(() => expect(screen.getByLabelText('Reps')).toHaveValue(8));
    await usuario.clear(screen.getByLabelText('Reps'));
    await usuario.type(screen.getByLabelText('Reps'), '7');
    await usuario.click(screen.getByRole('button', { name: 'Registrar serie' }));
    await screen.findByText('Serie registrada.');
    expect(aviso()).toBeNull();
    expect(seriesService.registrar).toHaveBeenCalledWith({
      rutinaId: 1,
      ejercicioId: 1,
      peso: 62.5,
      repeticiones: 7,
      rir: 2,
    });
  });

  it('E6: al corregir a 65 × 8 muestra los valores corregidos del récord', async () => {
    sesionesService.deHoy.mockResolvedValue(sesionCon([serieDeHoy]));
    seriesService.corregir.mockResolvedValueOnce({ serieId: 17, recordPersonal: true });
    abrir();
    const usuario = userEvent.setup();
    await usuario.click(await screen.findByRole('button', { name: 'Corregir' }));
    const formulario = within(screen.getByRole('form', { name: 'Corregir serie 1' }));
    await usuario.clear(formulario.getByLabelText('Peso (kg)'));
    await usuario.type(formulario.getByLabelText('Peso (kg)'), '65');
    await usuario.click(formulario.getByRole('button', { name: 'Guardar' }));
    const titulo = await screen.findByText('Nuevo récord personal');
    expect(titulo.closest('[role="status"]')).toHaveTextContent('Sentadilla con barra: 65 kg × 8');
    expect(seriesService.corregir).toHaveBeenCalledWith(17, { peso: 65, repeticiones: 8, rir: 2 });
  });

  it('cerrar el aviso lo oculta y no reenvía el registro', async () => {
    seriesService.registrar.mockResolvedValueOnce({ serieId: 17, numero: 1, recordPersonal: true });
    const usuario = await registrarPrimera();
    await usuario.click(
      await screen.findByRole('button', { name: 'Cerrar aviso de récord personal' }),
    );
    expect(aviso()).toBeNull();
    expect(seriesService.registrar).toHaveBeenCalledTimes(1);
  });

  it('la primera marca no muestra un aviso; el frontend respeta la decisión del servidor', async () => {
    ejerciciosService.ultimasSeries.mockResolvedValueOnce({ fecha: null, series: [] });
    abrir();
    const usuario = userEvent.setup();
    await screen.findByRole('heading', { name: 'Sentadilla con barra' });
    await usuario.type(screen.getByLabelText('Peso (kg)'), '60');
    await usuario.click(screen.getByRole('button', { name: 'Registrar serie' }));
    await screen.findByText('Serie registrada.');
    expect(aviso()).toBeNull();
  });

  it('conserva el aviso confirmado si falla la consulta posterior al registro', async () => {
    seriesService.registrar.mockResolvedValueOnce({ serieId: 17, numero: 1, recordPersonal: true });
    sesionesService.deHoy
      .mockResolvedValueOnce(sesionCon([]))
      .mockRejectedValueOnce(new Error('No se pudo actualizar la sesión.'));
    await registrarPrimera();
    expect(await screen.findByText('Nuevo récord personal')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo actualizar la sesión.');
    expect(seriesService.registrar).toHaveBeenCalledTimes(1);
  });

  it('un registro rechazado no muestra un récord', async () => {
    seriesService.registrar.mockRejectedValueOnce(
      new Error('El ejercicio no pertenece a esa rutina de tu plan vigente.'),
    );
    await registrarPrimera();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'El ejercicio no pertenece a esa rutina de tu plan vigente.',
    );
    expect(aviso()).toBeNull();
  });

  it('el entrenador es redirigido y no puede abrir el aviso ni ejecutar los comandos', async () => {
    useAuth.mockReturnValue({
      usuario: { id: 1, nombre: 'Laura', rol: 'ENTRENADOR' },
      salir: vi.fn(),
    });
    abrir();
    expect(await screen.findByRole('heading', { name: 'Mis deportistas' })).toBeInTheDocument();
    expect(aviso()).toBeNull();
    expect(seriesService.registrar).not.toHaveBeenCalled();
    expect(seriesService.corregir).not.toHaveBeenCalled();
    expect(planVigenteService.obtener).not.toHaveBeenCalled();
  });
});

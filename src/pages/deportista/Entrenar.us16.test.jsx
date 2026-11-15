import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Entrenar from './Entrenar';
import { planVigenteService } from '../../services/plan-vigente.service';
import { sesionesService } from '../../services/sesiones.service';
import { ejerciciosService } from '../../services/ejercicios.service';

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

// Datos del Paso 10: plan Fuerza, rutina Piernas con Sentadilla y Peso muerto rumano (3 series cada uno)
const dosificacion = (ejercicioId, ejercicioNombre) => ({
  ejercicioId,
  ejercicioNombre,
  seriesObjetivo: 3,
  repsMin: 8,
  repsMax: 10,
  rirObjetivo: 2,
});
const plan = {
  id: 1,
  nombre: 'Fuerza',
  rutinas: [
    {
      id: 1,
      nombre: 'Piernas',
      dosificaciones: [
        dosificacion(1, 'Sentadilla con barra'),
        dosificacion(2, 'Peso muerto rumano'),
      ],
    },
  ],
};
let siguienteId = 11;
const series = (cantidad, peso = 60) =>
  Array.from({ length: cantidad }, (_, i) => ({
    id: siguienteId++,
    numero: i + 1,
    peso,
    repeticiones: 8,
    rir: 2,
  }));
// Lo que devuelve el back: el cumplimiento ya viene calculado, el front no lo calcula
const sesionDeHoy = (cumplimiento, seriesSentadilla = [], seriesPesoMuerto = []) => ({
  cumplimiento,
  ejercicios: [
    { ejercicioId: 1, seriesObjetivo: 3, series: seriesSentadilla },
    { ejercicioId: 2, seriesObjetivo: 3, series: seriesPesoMuerto },
  ],
});

describe('Pantalla Entrenar: series que llevo de cada ejercicio (US-16)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    siguienteId = 11;
    planVigenteService.obtener.mockResolvedValue(plan);
    ejerciciosService.ultimasSeries.mockResolvedValue({ fecha: null, series: [] });
  });

  function abrir() {
    return render(
      <MemoryRouter initialEntries={['/deportista/entrenar/1']}>
        <Routes>
          <Route path="/deportista/entrenar/:rutinaId" element={<Entrenar />} />
        </Routes>
      </MemoryRouter>,
    );
  }

  async function tarjeta(nombreEjercicio) {
    const titulo = await screen.findByRole('heading', { name: nombreEjercicio });
    return within(titulo.closest('article'));
  }

  it('muestra las series registradas frente a las series objetivo de cada ejercicio', async () => {
    sesionesService.deHoy.mockResolvedValue(sesionDeHoy(50, series(2), series(1, 50)));
    abrir();

    expect((await tarjeta('Sentadilla con barra')).getByText('2 de 3 series')).toBeInTheDocument();
    expect((await tarjeta('Peso muerto rumano')).getByText('1 de 3 series')).toBeInTheDocument();
    expect(sesionesService.deHoy).toHaveBeenCalledWith(1);
  });

  it('antes de registrar nada muestra 0 de las series objetivo y 0 % de la sesión', async () => {
    sesionesService.deHoy.mockResolvedValue(sesionDeHoy(0));
    abrir();

    expect((await tarjeta('Sentadilla con barra')).getByText('0 de 3 series')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('muestra el cumplimiento de la sesión que devuelve el back', async () => {
    sesionesService.deHoy.mockResolvedValue(sesionDeHoy(67, series(3), series(1, 50)));
    abrir();
    await tarjeta('Sentadilla con barra');

    expect(screen.getByText('67%')).toBeInTheDocument();
    expect(screen.getByText('de la sesión')).toBeInTheDocument();
  });

  it('muestra todas las series registradas, aunque superen las pedidas, y el cumplimiento no pasa de 100 %', async () => {
    sesionesService.deHoy.mockResolvedValue(sesionDeHoy(100, series(4), series(3, 50)));
    abrir();
    const sentadilla = await tarjeta('Sentadilla con barra');

    expect(sentadilla.getByText('4 de 3 series')).toBeInTheDocument();
    expect(within(sentadilla.getByRole('list')).getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('marca como completo el ejercicio que llegó a sus series objetivo', async () => {
    sesionesService.deHoy.mockResolvedValue(sesionDeHoy(67, series(3), series(1, 50)));
    abrir();

    const completo = (await screen.findByRole('heading', { name: 'Sentadilla con barra' })).closest(
      'article',
    );
    const incompleto = screen
      .getByRole('heading', { name: 'Peso muerto rumano' })
      .closest('article');

    expect(completo).toHaveClass('ejercicio-completo');
    expect(incompleto).not.toHaveClass('ejercicio-completo');
  });
});

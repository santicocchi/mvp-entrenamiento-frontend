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

// Datos del Paso 10: plan Fuerza, rutina Piernas con Sentadilla y Peso muerto rumano
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
const sesionDeHoy = (seriesSentadilla = []) => ({
  cumplimiento: 0,
  ejercicios: [
    { ejercicioId: 1, seriesObjetivo: 3, series: seriesSentadilla },
    { ejercicioId: 2, seriesObjetivo: 3, series: [] },
  ],
});
const ULTIMA_SENTADILLA = {
  fecha: '2026-10-14',
  series: [
    { numero: 1, peso: 60, repeticiones: 8, rir: 2 },
    { numero: 2, peso: 60, repeticiones: 8, rir: 2 },
    { numero: 3, peso: 60, repeticiones: 8, rir: 1 },
  ],
};
const NUNCA = { fecha: null, series: [] };

describe('Pantalla Entrenar: última vez de cada ejercicio (US-14)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    planVigenteService.obtener.mockResolvedValue(plan);
    sesionesService.deHoy.mockResolvedValue(sesionDeHoy());
    // Juan hizo Sentadilla el 14/10 y nunca hizo Peso muerto rumano
    ejerciciosService.ultimasSeries.mockImplementation(async (ejercicioId) =>
      ejercicioId === 1 ? ULTIMA_SENTADILLA : NUNCA,
    );
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

  it('E1: al abrir el ejercicio se ven la fecha y las series de la última vez', async () => {
    abrir();
    const sentadilla = await tarjeta('Sentadilla con barra');

    expect(await sentadilla.findByText('Última vez, 14/10/2026:')).toBeInTheDocument();
    expect(sentadilla.getByText(/60 × 8, 60 × 8, 60 × 8/)).toBeInTheDocument();
    expect(ejerciciosService.ultimasSeries).toHaveBeenCalledWith(1);
  });

  it('si el ejercicio nunca se hizo, informa que es la primera vez', async () => {
    abrir();
    const pesoMuerto = await tarjeta('Peso muerto rumano');

    expect(await pesoMuerto.findByText('Primera vez con este ejercicio.')).toBeInTheDocument();
    expect(pesoMuerto.queryByText(/Última vez/)).not.toBeInTheDocument();
  });

  it('las series registradas hoy se muestran separadas de la última vez', async () => {
    sesionesService.deHoy.mockResolvedValue(
      sesionDeHoy([{ id: 17, numero: 1, peso: 62.5, repeticiones: 8, rir: 2 }]),
    );
    abrir();
    const sentadilla = await tarjeta('Sentadilla con barra');

    const ultimaVez = (await sentadilla.findByText('Última vez, 14/10/2026:')).closest('p');
    const seriesDeHoy = sentadilla.getByRole('list');

    expect(ultimaVez).toHaveTextContent('60 × 8, 60 × 8, 60 × 8');
    expect(ultimaVez).not.toHaveTextContent('62.5');
    expect(seriesDeHoy).toHaveTextContent('62.5 kg × 8 · RIR 2');
    expect(seriesDeHoy).not.toContainElement(ultimaVez);
  });
});

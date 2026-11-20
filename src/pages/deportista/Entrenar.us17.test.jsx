import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Entrenar from './Entrenar';
import { ApiError } from '../../api/httpClient';
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

// Datos del Paso 10: Juan registró hoy Sentadilla 62,5 kg × 8 (serie 1) y 62,5 × 7 (serie 2)
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
  cumplimiento: 67,
  ejercicios: [{ ejercicioId: 1, seriesObjetivo: 3, series }],
});
const SERIES_DE_HOY = [
  { id: 17, numero: 1, peso: 62.5, repeticiones: 8, rir: 2 },
  { id: 18, numero: 2, peso: 62.5, repeticiones: 7, rir: 1 },
];

describe('Pantalla Entrenar: corregir una serie (US-17)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    planVigenteService.obtener.mockResolvedValue(plan);
    sesionesService.deHoy.mockResolvedValue(sesionCon(SERIES_DE_HOY));
    ejerciciosService.ultimasSeries.mockResolvedValue({ fecha: null, series: [] });
    seriesService.corregir.mockResolvedValue({ serieId: 17, recordPersonal: false });
  });

  async function abrir() {
    const usuario = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/deportista/entrenar/1']}>
        <Routes>
          <Route path="/deportista/entrenar/:rutinaId" element={<Entrenar />} />
        </Routes>
      </MemoryRouter>,
    );
    const lista = await screen.findByRole('list');
    return { usuario, lista };
  }

  // Abre el formulario de corrección de la serie que está en esa posición de la lista
  async function corregirSerie(usuario, lista, posicion) {
    const fila = within(lista).getAllByRole('listitem')[posicion];
    await usuario.click(within(fila).getByRole('button', { name: 'Corregir' }));
    return within(lista).getAllByRole('listitem')[posicion];
  }

  it('cada serie de hoy se puede corregir, con sus valores precargados', async () => {
    const { usuario, lista } = await abrir();

    expect(within(lista).getAllByRole('button', { name: 'Corregir' })).toHaveLength(2);

    const fila = await corregirSerie(usuario, lista, 1);

    expect(within(fila).getByRole('form', { name: 'Corregir serie 2' })).toBeInTheDocument();
    expect(within(fila).getByLabelText('Peso (kg)')).toHaveValue(62.5);
    expect(within(fila).getByLabelText('Reps')).toHaveValue(7);
    expect(within(fila).getByLabelText('RIR')).toHaveValue(1);
  });

  it('E6: corrige la serie 1 a 65 kg × 8 y la lista muestra el valor nuevo con el mismo número', async () => {
    const { usuario, lista } = await abrir();
    const fila = await corregirSerie(usuario, lista, 0);

    sesionesService.deHoy.mockResolvedValue(
      sesionCon([{ ...SERIES_DE_HOY[0], peso: 65 }, SERIES_DE_HOY[1]]),
    );
    await usuario.clear(within(fila).getByLabelText('Peso (kg)'));
    await usuario.type(within(fila).getByLabelText('Peso (kg)'), '65');
    await usuario.click(within(fila).getByRole('button', { name: 'Guardar' }));

    expect(await within(lista).findByText('65 kg × 8 · RIR 2')).toBeInTheDocument();
    expect(seriesService.corregir).toHaveBeenCalledWith(17, { peso: 65, repeticiones: 8, rir: 2 });
    expect(seriesService.registrar).not.toHaveBeenCalled();
    // Conserva su número y no aparece una serie nueva
    const filas = within(lista).getAllByRole('listitem');
    expect(filas).toHaveLength(2);
    expect(filas[0]).toHaveTextContent(/^1/);
    expect(screen.queryByRole('form', { name: /Corregir serie/ })).not.toBeInTheDocument();
  });

  it('E6: si al corregir supera el récord, muestra el aviso de récord personal', async () => {
    seriesService.corregir.mockResolvedValue({ serieId: 17, recordPersonal: true });
    const { usuario, lista } = await abrir();
    const fila = await corregirSerie(usuario, lista, 0);

    await usuario.clear(within(fila).getByLabelText('Peso (kg)'));
    await usuario.type(within(fila).getByLabelText('Peso (kg)'), '65');
    await usuario.click(within(fila).getByRole('button', { name: 'Guardar' }));

    const aviso = await screen.findByText('Nuevo récord personal');
    expect(aviso.closest('[role="status"]')).toHaveTextContent('Sentadilla con barra: 65 kg × 8');
  });

  it('E7: si el back rechaza la corrección, muestra su mensaje tal cual y la serie no cambia', async () => {
    seriesService.corregir.mockRejectedValue(
      new ApiError(422, 'Solo se puede corregir el mismo día.'),
    );
    const { usuario, lista } = await abrir();
    const fila = await corregirSerie(usuario, lista, 0);

    await usuario.click(within(fila).getByRole('button', { name: 'Guardar' }));

    expect(await within(lista).findByRole('alert')).toHaveTextContent(
      'Solo se puede corregir el mismo día.',
    );
    // El formulario sigue abierto y la otra serie sigue igual
    expect(within(lista).getByRole('form', { name: 'Corregir serie 1' })).toBeInTheDocument();
    expect(within(lista).getByText('62.5 kg × 7 · RIR 1')).toBeInTheDocument();
    expect(sesionesService.deHoy).toHaveBeenCalledTimes(1);
  });

  it('los valores corregidos se validan igual que al registrar, sin llamar al back', async () => {
    const { usuario, lista } = await abrir();
    const fila = await corregirSerie(usuario, lista, 0);

    await usuario.clear(within(fila).getByLabelText('Reps'));
    await usuario.type(within(fila).getByLabelText('Reps'), '0');
    await usuario.click(within(fila).getByRole('button', { name: 'Guardar' }));

    expect(await within(lista).findByRole('alert')).toHaveTextContent(
      'Las repeticiones tienen que ser mayores a 0.',
    );
    expect(seriesService.corregir).not.toHaveBeenCalled();
  });

  it('cancelar cierra el formulario sin corregir nada', async () => {
    const { usuario, lista } = await abrir();
    const fila = await corregirSerie(usuario, lista, 0);

    await usuario.click(within(fila).getByRole('button', { name: 'Cancelar' }));

    expect(screen.queryByRole('form', { name: /Corregir serie/ })).not.toBeInTheDocument();
    expect(within(lista).getByText('62.5 kg × 8 · RIR 2')).toBeInTheDocument();
    expect(seriesService.corregir).not.toHaveBeenCalled();
  });
});

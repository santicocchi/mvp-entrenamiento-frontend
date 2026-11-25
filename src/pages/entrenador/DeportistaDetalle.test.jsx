import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DeportistaDetalle from './DeportistaDetalle';
import { sesionesService } from '../../services/sesiones.service';
import { deportistasService } from '../../services/deportistas.service';
import { medicionesService } from '../../services/mediciones.service';
import { hoy, sumarDias } from '../../utils/fechas';

vi.mock('../../services/sesiones.service', () => ({ sesionesService: { asistencia: vi.fn() } }));
vi.mock('../../services/deportistas.service', () => ({ deportistasService: { listar: vi.fn() } }));
vi.mock('../../services/mediciones.service', () => ({ medicionesService: { listar: vi.fn() } }));
vi.mock('../../components/GraficoEvolucion', () => ({ default: () => <div data-testid="grafico" /> }));

// Paso 10: Juan Pérez, vinculado a Laura, con el plan Fuerza
const JUAN = { id: 20, nombre: 'Juan Pérez', email: 'juan@gym.com', planVigente: { nombre: 'Fuerza', desde: '2026-10-01', hasta: '2026-11-30' } };
const ASISTENCIA = [
  { fecha: '2026-10-21', rutina: 'Piernas', cumplimiento: 100 },
  { fecha: '2026-10-14', rutina: 'Torso', cumplimiento: 67 },
];

function renderizar(id = 20) {
  return render(
    <MemoryRouter initialEntries={[`/entrenador/deportistas/${id}`]}>
      <Routes>
        <Route path="/entrenador/deportistas/:id" element={<DeportistaDetalle />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Pantalla DeportistaDetalle: asistencia (US-12)', () => {
  beforeEach(() => {
    deportistasService.listar.mockResolvedValue([JUAN]);
    medicionesService.listar.mockResolvedValue([]);
    sesionesService.asistencia.mockResolvedValue(ASISTENCIA);
  });

  it('de cada sesión muestra la fecha, la rutina y el cumplimiento', async () => {
    renderizar();
    await screen.findByRole('table');
    const filas = screen.getAllByRole('row').slice(1);
    expect(within(filas[0]).getAllByRole('cell').map((c) => c.textContent)).toEqual(['21/10/2026', 'Piernas', '100%']);
    expect(within(filas[1]).getAllByRole('cell').map((c) => c.textContent)).toEqual(['14/10/2026', 'Torso', '67%']);
  });

  it('no muestra pesos, repeticiones, RIR, récords ni progreso (RN17)', async () => {
    renderizar();
    const tabla = await screen.findByRole('table');
    expect(within(tabla).getAllByRole('columnheader').map((c) => c.textContent)).toEqual(['Fecha', 'Rutina', 'Cumplimiento']);
    expect(screen.queryByText(/kg|repeticiones|RIR|récord|1RM/i)).not.toBeInTheDocument();
  });

  it('por defecto pide los últimos 30 días del deportista de la URL', async () => {
    renderizar();
    await screen.findByRole('table');
    expect(sesionesService.asistencia).toHaveBeenCalledWith('20', sumarDias(hoy(), -30), hoy());
  });

  it('se puede filtrar la asistencia por rango de fechas', async () => {
    renderizar();
    await screen.findByRole('table');
    fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-10-01' } });
    fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-10-31' } });
    expect(sesionesService.asistencia).toHaveBeenLastCalledWith('20', '2026-10-01', '2026-10-31');
  });

  it('si no entrenó en el rango, lo informa', async () => {
    sesionesService.asistencia.mockResolvedValue([]);
    renderizar();
    expect(await screen.findByText('No entrenó en ese rango de fechas.')).toBeInTheDocument();
  });

  it('si el deportista no está vinculado muestra el mensaje del back tal cual', async () => {
    sesionesService.asistencia.mockRejectedValue(new Error('El deportista no está vinculado con vos.'));
    renderizar(99);
    expect(await screen.findByRole('alert')).toHaveTextContent('El deportista no está vinculado con vos.');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('muestra el plan vigente del deportista', async () => {
    renderizar();
    expect(await screen.findByText('Plan vigente: Fuerza, del 01/10/2026 al 30/11/2026')).toBeInTheDocument();
  });
});

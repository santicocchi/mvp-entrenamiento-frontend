import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Progreso from './Progreso';
import { progresoService } from '../../services/progreso.service';

vi.mock('../../services/progreso.service', () => ({
  progresoService: { ejerciciosConProgreso: vi.fn(), obtener: vi.fn() },
}));
// Recharts no dibuja en jsdom: se reemplaza el gráfico por una marca con las claves que grafica
vi.mock('../../components/GraficoEvolucion', () => ({
  default: ({ series }) => <div data-testid="grafico">{series.map((s) => s.clave).join(',')}</div>,
}));

// Datos del Paso 10 (E8): Sentadilla 60 × 8 el 14/10 y 65 × 8 el 21/10
const PROGRESO_SENTADILLA = {
  record: { peso: 65, repeticiones: 8, fecha: '2026-10-21' },
  porFecha: [
    { fecha: '2026-10-14', pesoMaximo: 60, rmEstimado: 76, mejorSerie: { peso: 60, repeticiones: 8 }, volumen: 1440 },
    { fecha: '2026-10-21', pesoMaximo: 65, rmEstimado: 82.3, mejorSerie: { peso: 65, repeticiones: 8 }, volumen: 1395 },
  ],
};
const EJERCICIOS = [
  { id: 1, nombre: 'Sentadilla con barra' },
  { id: 2, nombre: 'Peso muerto rumano' },
];

describe('Pantalla Progreso (US-19)', () => {
  beforeEach(() => {
    progresoService.ejerciciosConProgreso.mockResolvedValue(EJERCICIOS);
    progresoService.obtener.mockResolvedValue(PROGRESO_SENTADILLA);
  });

  it('solo ofrece los ejercicios que el deportista registró alguna vez', async () => {
    render(<Progreso />);
    const opciones = await screen.findAllByRole('option');
    expect(opciones.map((o) => o.textContent)).toEqual(['Sentadilla con barra', 'Peso muerto rumano']);
    expect(progresoService.obtener).toHaveBeenCalledWith('1');
  });

  it('muestra dos gráficos: peso máximo y 1RM estimado de cada sesión', async () => {
    render(<Progreso />);
    const graficos = await screen.findAllByTestId('grafico');
    expect(graficos.map((g) => g.textContent)).toEqual(['pesoMaximo', 'rmEstimado']);
  });

  it('muestra el récord separado del 1RM y aclara que el 1RM es una estimación (E8)', async () => {
    render(<Progreso />);
    const record = await screen.findByLabelText('Récord personal');
    expect(record).toHaveTextContent('65 kg × 8');
    expect(record).toHaveTextContent('21/10/2026');
    expect(screen.getByLabelText('1RM estimado')).toHaveTextContent('82.3 kg');
    expect(screen.getByText(/fórmula de Epley/)).toHaveTextContent('Es una estimación');
  });

  it('por cada fecha muestra la mejor serie y el volumen, de la más reciente a la más antigua', async () => {
    render(<Progreso />);
    await screen.findByRole('table');
    const filas = screen.getAllByRole('row').slice(1);
    expect(within(filas[0]).getAllByRole('cell').map((c) => c.textContent)).toEqual(['21/10/2026', '65 kg × 8', '1395 kg']);
    expect(within(filas[1]).getAllByRole('cell').map((c) => c.textContent)).toEqual(['14/10/2026', '60 kg × 8', '1440 kg']);
  });

  it('al elegir otro ejercicio pide su progreso', async () => {
    render(<Progreso />);
    await screen.findByRole('table');
    await userEvent.selectOptions(screen.getByRole('combobox'), '2');
    expect(progresoService.obtener).toHaveBeenLastCalledWith('2');
  });

  it('si nunca registró series, avisa que todavía no hay progreso', async () => {
    progresoService.ejerciciosConProgreso.mockResolvedValue([]);
    render(<Progreso />);
    expect(await screen.findByText(/Registrá tu primera serie/)).toBeInTheDocument();
    expect(progresoService.obtener).not.toHaveBeenCalled();
  });

  it('muestra el mensaje de error del back tal cual', async () => {
    progresoService.obtener.mockRejectedValue(new Error('No tenés permiso para ver este progreso.'));
    render(<Progreso />);
    expect(await screen.findByRole('alert')).toHaveTextContent('No tenés permiso para ver este progreso.');
  });
});

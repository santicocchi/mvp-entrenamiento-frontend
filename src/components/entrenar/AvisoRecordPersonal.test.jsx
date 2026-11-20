import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AvisoRecordPersonal from './AvisoRecordPersonal';

describe('AvisoRecordPersonal (US-18)', () => {
  const record = { ejercicioId: 1, peso: 62.5, repeticiones: 8 };

  it('no muestra un aviso cuando el backend no informó un récord', () => {
    render(<AvisoRecordPersonal record={null} nombreEjercicio="Sentadilla" onCerrar={() => {}} />);
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('anuncia el ejercicio, el peso y las repeticiones sin calcular una marca', () => {
    render(
      <AvisoRecordPersonal record={record} nombreEjercicio="Sentadilla" onCerrar={() => {}} />,
    );
    const aviso = screen.getByRole('status');
    expect(aviso).toHaveTextContent('Nuevo récord personal');
    expect(aviso).toHaveTextContent('Sentadilla: 62.5 kg × 8');
    expect(aviso).toHaveAttribute('aria-live', 'polite');
    expect(aviso).toHaveAttribute('aria-atomic', 'true');
  });

  it('permite cerrar el aviso sin repetir el comando de registro', async () => {
    const onCerrar = vi.fn();
    render(
      <AvisoRecordPersonal record={record} nombreEjercicio="Sentadilla" onCerrar={onCerrar} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar aviso de récord personal' }));
    expect(onCerrar).toHaveBeenCalledTimes(1);
  });
});

import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormularioSerie from './FormularioSerie';

describe('FormularioSerie (US-15)', () => {
  const props = { repeticionesObjetivo: 10, rirObjetivo: 2, onRegistrar: vi.fn(async () => null) };

  it('precarga los tres valores de la última serie, con teclados adecuados y sin fecha elegible', () => {
    const { container } = render(
      <FormularioSerie {...props} ultimaSerie={{ peso: 62.5, repeticiones: 8, rir: 1 }} />,
    );
    expect(screen.getByLabelText('Peso (kg)')).toHaveValue('62.5');
    expect(screen.getByLabelText('Reps')).toHaveValue(8);
    expect(screen.getByLabelText('RIR')).toHaveValue(1);
    expect(screen.getByLabelText('Peso (kg)')).toHaveAttribute('inputmode', 'decimal');
    expect(screen.getByLabelText('Reps')).toHaveAttribute('inputmode', 'numeric');
    expect(container.querySelector('input[type="date"]')).toBeNull();
  });
  it('precarga datos que llegan tarde sin pisar campos que el deportista editó', async () => {
    const usuario = userEvent.setup();
    const { rerender } = render(<FormularioSerie {...props} />);
    await usuario.type(screen.getByLabelText('Peso (kg)'), '65');
    rerender(<FormularioSerie {...props} ultimaSerie={{ peso: 60, repeticiones: 8, rir: 1 }} />);
    expect(screen.getByLabelText('Peso (kg)')).toHaveValue('65');
    expect(screen.getByLabelText('Reps')).toHaveValue(8);
    expect(screen.getByLabelText('RIR')).toHaveValue(1);
  });
  it('guarda en un toque y confirma sin pedir confirmaciones extra', async () => {
    const onRegistrar = vi.fn(async () => null);
    render(
      <FormularioSerie
        {...props}
        onRegistrar={onRegistrar}
        ultimaSerie={{ peso: 0, repeticiones: 8, rir: 0 }}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Registrar serie' }));
    expect(onRegistrar).toHaveBeenCalledWith({ peso: 0, repeticiones: 8, rir: 0 });
    expect(screen.getByRole('status')).toHaveTextContent('Serie registrada.');
  });
  it('conserva los valores y muestra el motivo textual del backend', async () => {
    render(
      <FormularioSerie
        {...props}
        onRegistrar={async () => 'El ejercicio no pertenece a esa rutina de tu plan vigente.'}
        ultimaSerie={{ peso: 60, repeticiones: 8, rir: 2 }}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Registrar serie' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'El ejercicio no pertenece a esa rutina de tu plan vigente.',
    );
    expect(screen.getByLabelText('Peso (kg)')).toHaveValue('60');
    expect(screen.queryByRole('status')).toBeNull();
  });
  it('bloquea el doble envío incluso antes de que React actualice el botón', async () => {
    let finalizar;
    const onRegistrar = vi.fn(
      () =>
        new Promise((resolver) => {
          finalizar = resolver;
        }),
    );
    render(<FormularioSerie {...props} onRegistrar={onRegistrar} />);
    const formulario = screen.getByRole('form', { name: 'Registrar serie' });
    fireEvent.submit(formulario);
    fireEvent.submit(formulario);
    expect(onRegistrar).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled();
    await act(async () => {
      finalizar(null);
    });
  });
});

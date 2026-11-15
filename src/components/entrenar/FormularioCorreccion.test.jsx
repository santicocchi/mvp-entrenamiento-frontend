import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FormularioCorreccion from './FormularioCorreccion';

describe('FormularioCorreccion (US-17)', () => {
  const serie = { id: 17, numero: 2, peso: 62.5, repeticiones: 8, rir: 2 };

  function abrir(props = {}) {
    const onGuardar = props.onGuardar ?? vi.fn(async () => null);
    const onCancelar = props.onCancelar ?? vi.fn();
    render(<FormularioCorreccion serie={serie} onGuardar={onGuardar} onCancelar={onCancelar} />);
    return { onGuardar, onCancelar, usuario: userEvent.setup() };
  }

  it('precarga los valores de la serie y muestra su número, que no se puede cambiar', () => {
    const { container } = render(
      <FormularioCorreccion serie={serie} onGuardar={vi.fn()} onCancelar={vi.fn()} />,
    );

    expect(screen.getByRole('form', { name: 'Corregir serie 2' })).toBeInTheDocument();
    expect(screen.getByLabelText('Peso (kg)')).toHaveValue(62.5);
    expect(screen.getByLabelText('Reps')).toHaveValue(8);
    expect(screen.getByLabelText('RIR')).toHaveValue(2);
    // Solo peso, repeticiones y RIR: ni número de serie ni fecha
    expect(container.querySelectorAll('input')).toHaveLength(3);
    expect(container.querySelector('input[type="date"]')).toBeNull();
  });

  it('al guardar envía los valores corregidos', async () => {
    const { onGuardar, usuario } = abrir();

    await usuario.clear(screen.getByLabelText('Peso (kg)'));
    await usuario.type(screen.getByLabelText('Peso (kg)'), '65');
    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onGuardar).toHaveBeenCalledTimes(1);
    expect(onGuardar).toHaveBeenCalledWith({ peso: '65', repeticiones: 8, rir: 2 });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('muestra el error del back tal cual y deja corregir de nuevo', async () => {
    const onGuardar = vi
      .fn()
      .mockResolvedValueOnce('Solo se puede corregir el mismo día.')
      .mockResolvedValueOnce(null);
    const { usuario } = abrir({ onGuardar });

    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Solo se puede corregir el mismo día.',
    );
    expect(screen.getByRole('button', { name: 'Guardar' })).toBeEnabled();

    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(onGuardar).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('el error se borra cuando el deportista cambia un valor', async () => {
    const onGuardar = vi.fn(async () => 'Las repeticiones tienen que ser mayores a 0.');
    const { usuario } = abrir({ onGuardar });

    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();

    await usuario.type(screen.getByLabelText('Reps'), '1');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('mientras guarda deshabilita los campos y los botones, y no envía dos veces', async () => {
    let terminar;
    const onGuardar = vi.fn(() => new Promise((resolver) => (terminar = resolver)));
    const { usuario } = abrir({ onGuardar });

    await usuario.click(screen.getByRole('button', { name: 'Guardar' }));

    const guardando = screen.getByRole('button', { name: 'Guardando…' });
    expect(guardando).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled();
    expect(screen.getByLabelText('Peso (kg)')).toBeDisabled();
    await usuario.click(guardando);
    expect(onGuardar).toHaveBeenCalledTimes(1);

    terminar(null);
    expect(await screen.findByRole('button', { name: 'Guardar' })).toBeEnabled();
  });

  it('cancelar no guarda nada', async () => {
    const { onGuardar, onCancelar, usuario } = abrir();

    await usuario.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onCancelar).toHaveBeenCalledTimes(1);
    expect(onGuardar).not.toHaveBeenCalled();
  });
});

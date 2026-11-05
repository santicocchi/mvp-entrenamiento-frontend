import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import App from '../../App';
import { AuthProvider } from '../../context/AuthContext';
import { tokenStorage } from '../../api/tokenStorage';

// Contrato completo: pantalla → hooks → services → httpClient → mockServer.
describe('US-15 con los mocks del proyecto', () => {
  function abrir(rol, ruta = '/deportista/entrenar/1') {
    if (rol) {
      const id = rol === 'DEPORTISTA' ? 3 : 1;
      tokenStorage.guardar({
        access_token: `mock-access-${id}`,
        refresh_token: `mock-refresh-${id}`,
        usuario: { id, nombre: rol === 'DEPORTISTA' ? 'Juan Pérez' : 'Laura Gómez', rol },
      });
    }
    return render(
      <MemoryRouter initialEntries={[ruta]}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>,
    );
  }

  it('registra series sucesivas, conserva la sesión y separa las rutinas', async () => {
    const usuario = userEvent.setup();
    const inicio = performance.now();
    abrir('DEPORTISTA');
    await screen.findByRole('heading', { name: 'Piernas' });
    const tarjeta = screen
      .getByRole('heading', { name: 'Sentadilla con barra' })
      .closest('article');
    const ejercicio = within(tarjeta);
    await waitFor(() => expect(ejercicio.getByLabelText('Peso (kg)')).toHaveValue('62.5'));
    await usuario.clear(ejercicio.getByLabelText('Peso (kg)'));
    await usuario.type(ejercicio.getByLabelText('Peso (kg)'), '65');
    await usuario.click(ejercicio.getByRole('button', { name: 'Registrar serie' }));
    expect(await ejercicio.findByText('1 de 3 series')).toBeInTheDocument();
    // Medición automatizada local con mocks; no acredita tiempos de usuarios reales.
    expect(performance.now() - inicio).toBeLessThan(10_000);
    expect(screen.getByText('Nuevo récord personal')).toBeInTheDocument();
    await usuario.clear(ejercicio.getByLabelText('Reps'));
    await usuario.type(ejercicio.getByLabelText('Reps'), '7');
    await usuario.click(ejercicio.getByRole('button', { name: 'Registrar serie' }));
    expect(await ejercicio.findByText('2 de 3 series')).toBeInTheDocument();
    expect(screen.queryByText('Nuevo récord personal')).toBeNull();
    expect(within(ejercicio.getByRole('list')).getAllByRole('listitem')).toHaveLength(2);
    await usuario.click(screen.getByRole('link', { name: 'Volver al plan' }));
    await screen.findByRole('heading', { name: 'Fuerza' });
    await usuario.click(screen.getAllByRole('link', { name: 'Entrenar' })[1]);
    await screen.findByRole('heading', { name: 'Torso' });
    expect(screen.getAllByText('0 de 3 series')).toHaveLength(2);
    await usuario.click(screen.getByRole('link', { name: 'Volver al plan' }));
    await screen.findByRole('heading', { name: 'Fuerza' });
    await usuario.click(screen.getAllByRole('link', { name: 'Entrenar' })[0]);
    expect(await screen.findByText('2 de 3 series')).toBeInTheDocument();
  });

  it('un entrenador es redirigido y no ve el formulario de series', async () => {
    abrir('ENTRENADOR');
    expect(await screen.findByRole('heading', { name: 'Mis deportistas' })).toBeInTheDocument();
    expect(screen.queryByRole('form', { name: 'Registrar serie' })).toBeNull();
  });

  it('sin sesión redirige al ingreso', async () => {
    abrir();
    expect(await screen.findByText('Ingresá con tu cuenta.')).toBeInTheDocument();
    expect(screen.queryByRole('form', { name: 'Registrar serie' })).toBeNull();
  });
});

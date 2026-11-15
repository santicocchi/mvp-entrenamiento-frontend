import { render, screen } from '@testing-library/react';
import UltimaVez from './UltimaVez';

describe('UltimaVez (US-14)', () => {
  it('E1: muestra la fecha y las series de la última sesión con ese ejercicio', () => {
    render(
      <UltimaVez
        cargando={false}
        error={null}
        datos={{
          fecha: '2026-10-14',
          series: [
            { numero: 1, peso: 60, repeticiones: 8, rir: 2 },
            { numero: 2, peso: 60, repeticiones: 8, rir: 2 },
            { numero: 3, peso: 60, repeticiones: 8, rir: 1 },
          ],
        }}
      />,
    );

    expect(screen.getByText('Última vez, 14/10/2026:')).toBeInTheDocument();
    expect(screen.getByText(/60 × 8, 60 × 8, 60 × 8/)).toBeInTheDocument();
  });

  it('si el ejercicio nunca se hizo, informa que es la primera vez', () => {
    render(<UltimaVez cargando={false} error={null} datos={{ fecha: null, series: [] }} />);

    expect(screen.getByText('Primera vez con este ejercicio.')).toBeInTheDocument();
    expect(screen.queryByText(/Última vez/)).not.toBeInTheDocument();
  });

  it('mientras carga no muestra nada', () => {
    const { container } = render(<UltimaVez cargando datos={null} error={null} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('muestra el error del back tal cual', () => {
    render(
      <UltimaVez
        cargando={false}
        datos={null}
        error={new Error('No tenés permisos para realizar esta acción.')}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'No tenés permisos para realizar esta acción.',
    );
  });
});

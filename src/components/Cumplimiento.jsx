// Barra con el % de cumplimiento de una sesión o un ejercicio (US-12, US-16, US-20).
// El valor lo calcula el back (CalculadoraCumplimiento, tope 100 %): acá solo se dibuja.

// Solo visual: color de la barra según el porcentaje
function nivelCumplimiento(valor) {
  if (valor >= 100) return 'completo';
  if (valor >= 50) return 'medio';
  return 'bajo';
}

// grande: barra más grande y con color por nivel (vista de sesiones del deportista)
export default function Cumplimiento({ valor, grande = false }) {
  return (
    <span className="cumplimiento">
      <span
        className={grande ? 'cumplimiento-barra cumplimiento-barra-grande' : 'cumplimiento-barra'}
        data-nivel={grande ? nivelCumplimiento(valor) : undefined}
      >
        <span style={{ width: `${valor}%` }} />
      </span>
      {valor}%
    </span>
  );
}

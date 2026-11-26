// Barra con el % de cumplimiento de una sesión o un ejercicio (US-12, US-16, US-20).
// El valor lo calcula el back (CalculadoraCumplimiento, tope 100 %): acá solo se dibuja.
export default function Cumplimiento({ valor }) {
  return (
    <span className="cumplimiento">
      <span className="cumplimiento-barra"><span style={{ width: `${valor}%` }} /></span>
      {valor}%
    </span>
  );
}

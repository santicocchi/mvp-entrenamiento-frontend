/**
 * US-18: aviso presentado dentro de la ruta protegida del deportista.
 * El backend decide si hay récord; el componente solo muestra sus datos.
 * @param {{ record: { ejercicioId: number, peso: number, repeticiones: number } | null, nombreEjercicio: string, onCerrar: () => void }} props
 */
export default function AvisoRecordPersonal({ record, nombreEjercicio, onCerrar }) {
  if (!record) return null;

  return (
    <div className="aviso-record" role="status" aria-live="polite" aria-atomic="true">
      <div>
        <strong>Nuevo récord personal</strong>
        <span>
          {nombreEjercicio}: {record.peso} kg × {record.repeticiones}
        </span>
      </div>
      <button
        type="button"
        className="boton-texto"
        aria-label="Cerrar aviso de récord personal"
        onClick={onCerrar}
      >
        Cerrar
      </button>
    </div>
  );
}

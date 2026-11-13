import { useState } from 'react';
import { planesService } from '../services/planes.service';

// Use case del front: armar / modificar un plan (US-06, US-07, US-09).
// Maneja el estado del formulario y arma el plan que recibe el service (que lo traduce al contrato).
// Las reglas (RN10, RN15) las decide el back; acá solo se da feedback rápido de formato, con los
// mismos mensajes que devuelve el back, y se evita mandar algo obviamente incompleto.

const dosificacionNueva = (ejercicio) => ({
  ejercicioId: ejercicio.id,
  ejercicioNombre: ejercicio.nombre,
  seriesObjetivo: 3,
  repsMin: 8,
  repsMax: 10,
  rirObjetivo: 2,
});

let claveLocal = 0;
const rutinaNueva = (nombre = '') => ({ clave: ++claveLocal, nombre, dosificaciones: [] });

function desdePlanExistente(plan) {
  return {
    nombre: plan.nombre,
    indicaciones: plan.indicaciones ?? '',
    rutinas: plan.rutinas.map((r) => ({ clave: ++claveLocal, nombre: r.nombre, dosificaciones: r.dosificaciones.map((d) => ({ ...d })) })),
  };
}

const esEntero = (valor) => Number.isInteger(Number(valor)) && String(valor).trim() !== '';

// Devuelve el primer error de formato o null (US-06: nombre, rutina con nombre y ejercicios,
// series ≥ 1, repeticiones mínimo ≤ máximo, RIR ≥ 0)
function validar(plan) {
  if (!plan.nombre.trim()) return 'El plan tiene que tener un nombre.';
  if (plan.rutinas.length === 0) return 'El plan tiene que tener al menos una rutina.';
  for (const rutina of plan.rutinas) {
    if (!rutina.nombre.trim()) return 'La rutina tiene que tener un nombre.';
    if (rutina.dosificaciones.length === 0) return 'La rutina tiene que tener al menos un ejercicio.';
    for (const d of rutina.dosificaciones) {
      if (!esEntero(d.repsMin) || Number(d.repsMin) < 1 || !esEntero(d.repsMax) || Number(d.repsMax) < 1) {
        return 'Las repeticiones tienen que ser mayores a 0.';
      }
      if (Number(d.repsMin) > Number(d.repsMax)) return 'Las repeticiones mínimas no pueden ser mayores a las máximas.';
      if (!esEntero(d.seriesObjetivo) || Number(d.seriesObjetivo) < 1) return 'Las series objetivo tienen que ser 1 o más.';
      if (!esEntero(d.rirObjetivo) || Number(d.rirObjetivo) < 0) return 'El RIR objetivo no puede ser negativo.';
    }
  }
  return null;
}

export function useArmarPlan(planExistente) {
  const [plan, setPlan] = useState(() =>
    planExistente ? desdePlanExistente(planExistente) : { nombre: '', indicaciones: '', rutinas: [rutinaNueva('Rutina 1')] },
  );
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  const cambiarRutinas = (clave, cambio) =>
    setPlan((p) => ({ ...p, rutinas: p.rutinas.map((r) => (r.clave === clave ? cambio(r) : r)) }));

  const acciones = {
    cambiarDatos: (campo, valor) => setPlan((p) => ({ ...p, [campo]: valor })),
    // Devuelve la clave de la rutina nueva para que la pantalla pueda seleccionarla
    agregarRutina: () => {
      const nueva = rutinaNueva(`Rutina ${plan.rutinas.length + 1}`);
      setPlan((p) => ({ ...p, rutinas: [...p.rutinas, nueva] }));
      return nueva.clave;
    },
    quitarRutina: (clave) => setPlan((p) => ({ ...p, rutinas: p.rutinas.filter((r) => r.clave !== clave) })),
    renombrarRutina: (clave, nombre) => cambiarRutinas(clave, (r) => ({ ...r, nombre })),

    // RN15: un ejercicio no se repite dentro de la misma rutina
    agregarEjercicio: (clave, ejercicio) =>
      cambiarRutinas(clave, (r) =>
        r.dosificaciones.some((d) => d.ejercicioId === ejercicio.id)
          ? r
          : { ...r, dosificaciones: [...r.dosificaciones, dosificacionNueva(ejercicio)] },
      ),
    quitarEjercicio: (clave, ejercicioId) =>
      cambiarRutinas(clave, (r) => ({ ...r, dosificaciones: r.dosificaciones.filter((d) => d.ejercicioId !== ejercicioId) })),
    cambiarDosificacion: (clave, ejercicioId, campo, valor) =>
      cambiarRutinas(clave, (r) => ({
        ...r,
        dosificaciones: r.dosificaciones.map((d) => (d.ejercicioId === ejercicioId ? { ...d, [campo]: valor } : d)),
      })),
    // US-07: ordenar ejercicios
    moverEjercicio: (clave, indice, direccion) =>
      cambiarRutinas(clave, (r) => {
        const destino = indice + direccion;
        if (destino < 0 || destino >= r.dosificaciones.length) return r;
        const lista = [...r.dosificaciones];
        [lista[indice], lista[destino]] = [lista[destino], lista[indice]];
        return { ...r, dosificaciones: lista };
      }),
  };

  // Arma el plan que recibe el service: números reales y `orden` correlativo (1, 2, 3…) según la posición
  const aPlanParaGuardar = () => ({
    nombre: plan.nombre.trim(),
    indicaciones: plan.indicaciones.trim(),
    rutinas: plan.rutinas.map((r) => ({
      nombre: r.nombre.trim(),
      dosificaciones: r.dosificaciones.map((d, i) => ({
        ejercicioId: d.ejercicioId,
        orden: i + 1,
        seriesObjetivo: Number(d.seriesObjetivo),
        repsMin: Number(d.repsMin),
        repsMax: Number(d.repsMax),
        rirObjetivo: Number(d.rirObjetivo),
      })),
    })),
  });

  // Devuelve el id del plan guardado, o null si hubo error
  const guardar = async (planId) => {
    const errorFormato = validar(plan);
    if (errorFormato) {
      setError(errorFormato);
      return null;
    }

    setGuardando(true);
    setError(null);
    try {
      const respuesta = planId
        ? await planesService.modificar(planId, aPlanParaGuardar())
        : await planesService.crear(aPlanParaGuardar());
      return respuesta.id;
    } catch (e) {
      setError(e.message); // el mensaje del back, tal cual (Paso 12)
      return null;
    } finally {
      setGuardando(false);
    }
  };

  return { plan, acciones, guardar, guardando, error };
}

import { useState } from 'react';
import { planesService } from '../services/planes.service';

// Use case del front: armar / modificar un plan (US-06, US-07, US-09).
// Maneja el estado del formulario y arma el JSON del contrato. Las reglas (RN10, RN15) las decide el back;
// acá solo se evita mandar algo obviamente incompleto.

const dosificacionNueva = (ejercicio) => ({
  ejercicio_id: ejercicio.id,
  ejercicio_nombre: ejercicio.nombre,
  series_objetivo: 3,
  reps_min: 8,
  reps_max: 10,
  rir_objetivo: 2,
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
    agregarRutina: () => setPlan((p) => ({ ...p, rutinas: [...p.rutinas, rutinaNueva(`Rutina ${p.rutinas.length + 1}`)] })),
    quitarRutina: (clave) => setPlan((p) => ({ ...p, rutinas: p.rutinas.filter((r) => r.clave !== clave) })),
    renombrarRutina: (clave, nombre) => cambiarRutinas(clave, (r) => ({ ...r, nombre })),

    // RN15: un ejercicio no se repite dentro de la misma rutina
    agregarEjercicio: (clave, ejercicio) =>
      cambiarRutinas(clave, (r) =>
        r.dosificaciones.some((d) => d.ejercicio_id === ejercicio.id)
          ? r
          : { ...r, dosificaciones: [...r.dosificaciones, dosificacionNueva(ejercicio)] },
      ),
    quitarEjercicio: (clave, ejercicioId) =>
      cambiarRutinas(clave, (r) => ({ ...r, dosificaciones: r.dosificaciones.filter((d) => d.ejercicio_id !== ejercicioId) })),
    cambiarDosificacion: (clave, ejercicioId, campo, valor) =>
      cambiarRutinas(clave, (r) => ({
        ...r,
        dosificaciones: r.dosificaciones.map((d) => (d.ejercicio_id === ejercicioId ? { ...d, [campo]: valor } : d)),
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

  // Arma el cuerpo de POST/PUT /api/planes
  const aContrato = () => ({
    nombre: plan.nombre.trim(),
    indicaciones: plan.indicaciones.trim(),
    rutinas: plan.rutinas.map((r) => ({
      nombre: r.nombre.trim(),
      dosificaciones: r.dosificaciones.map((d, i) => ({
        ejercicio_id: d.ejercicio_id,
        orden: i + 1,
        series_objetivo: Number(d.series_objetivo),
        reps_min: Number(d.reps_min),
        reps_max: Number(d.reps_max),
        rir_objetivo: Number(d.rir_objetivo),
      })),
    })),
  });

  // Devuelve el id del plan guardado, o null si hubo error
  const guardar = async (planId) => {
    setGuardando(true);
    setError(null);
    try {
      const respuesta = planId ? await planesService.modificar(planId, aContrato()) : await planesService.crear(aContrato());
      return respuesta.id;
    } catch (e) {
      setError(e.message);
      return null;
    } finally {
      setGuardando(false);
    }
  };

  return { plan, acciones, guardar, guardando, error };
}

import { hoy, sumarDias } from '../utils/fechas';

// Datos del Paso 10 del informe. Las fechas se calculan desde hoy para que el plan siempre esté vigente.
const HOY = hoy();

export function crearDatosIniciales() {
  return {
    usuarios: [
      { id: 1, nombre: 'Laura Gómez', email: 'laura@gym.com', contrasena: 'clave1234', rol: 'ENTRENADOR' },
      { id: 2, nombre: 'Martín Díaz', email: 'martin@gym.com', contrasena: 'clave1234', rol: 'ENTRENADOR' },
      { id: 3, nombre: 'Juan Pérez', email: 'juan@gym.com', contrasena: 'clave1234', rol: 'DEPORTISTA' },
      { id: 4, nombre: 'Sofía Ruiz', email: 'sofia@gym.com', contrasena: 'clave1234', rol: 'DEPORTISTA' },
    ],
    // RN18: un deportista solo puede estar vinculado a un entrenador
    vinculos: [{ entrenador_id: 1, deportista_id: 3 }],
    ejercicios: [
      { id: 1, nombre: 'Sentadilla con barra', grupo_muscular: 'PIERNA', subgrupo: 'CUADRICEPS' },
      { id: 2, nombre: 'Peso muerto rumano', grupo_muscular: 'PIERNA', subgrupo: 'FEMORAL' },
      { id: 3, nombre: 'Prensa 45°', grupo_muscular: 'PIERNA', subgrupo: 'CUADRICEPS' },
      { id: 4, nombre: 'Press banca plano', grupo_muscular: 'PECHO', subgrupo: null },
      { id: 5, nombre: 'Remo con barra', grupo_muscular: 'ESPALDA', subgrupo: 'DORSALES' },
      { id: 6, nombre: 'Press militar', grupo_muscular: 'HOMBRO', subgrupo: null },
      { id: 7, nombre: 'Dominadas', grupo_muscular: 'ESPALDA', subgrupo: 'DORSALES' },
      { id: 8, nombre: 'Plancha', grupo_muscular: 'CORE', subgrupo: null },
      { id: 9, nombre: 'Crunch en polea', grupo_muscular: 'CORE', subgrupo: null },
    ],
    planes: [
      {
        id: 1,
        nombre: 'Fuerza',
        entrenador_id: 1,
        indicaciones: 'Descansar de 2 a 3 minutos entre series.',
        rutinas: [
          {
            id: 1,
            nombre: 'Piernas',
            dosificaciones: [
              { ejercicio_id: 1, orden: 1, series_objetivo: 3, reps_min: 8, reps_max: 10, rir_objetivo: 2 },
              { ejercicio_id: 2, orden: 2, series_objetivo: 3, reps_min: 8, reps_max: 10, rir_objetivo: 2 },
            ],
          },
          {
            id: 2,
            nombre: 'Torso',
            dosificaciones: [
              { ejercicio_id: 4, orden: 1, series_objetivo: 3, reps_min: 8, reps_max: 10, rir_objetivo: 2 },
              { ejercicio_id: 5, orden: 2, series_objetivo: 3, reps_min: 8, reps_max: 10, rir_objetivo: 2 },
            ],
          },
        ],
        asignaciones: [
          { deportista_id: 3, vigencia_desde: sumarDias(HOY, -30), vigencia_hasta: sumarDias(HOY, 30) },
        ],
      },
    ],
    sesiones: [
      {
        id: 1, deportista_id: 3, plan_id: 1, rutina_id: 1, fecha: sumarDias(HOY, -14),
        series: [
          { id: 1, ejercicio_id: 1, numero: 1, peso: 60, repeticiones: 8, rir: 2 },
          { id: 2, ejercicio_id: 1, numero: 2, peso: 60, repeticiones: 8, rir: 2 },
          { id: 3, ejercicio_id: 1, numero: 3, peso: 60, repeticiones: 8, rir: 1 },
          { id: 4, ejercicio_id: 2, numero: 1, peso: 50, repeticiones: 10, rir: 2 },
        ],
      },
      {
        id: 2, deportista_id: 3, plan_id: 1, rutina_id: 2, fecha: sumarDias(HOY, -12),
        series: [
          { id: 5, ejercicio_id: 4, numero: 1, peso: 50, repeticiones: 8, rir: 2 },
          { id: 6, ejercicio_id: 4, numero: 2, peso: 50, repeticiones: 8, rir: 2 },
          { id: 7, ejercicio_id: 4, numero: 3, peso: 50, repeticiones: 7, rir: 1 },
          { id: 8, ejercicio_id: 5, numero: 1, peso: 45, repeticiones: 10, rir: 2 },
          { id: 9, ejercicio_id: 5, numero: 2, peso: 45, repeticiones: 9, rir: 2 },
          { id: 10, ejercicio_id: 5, numero: 3, peso: 45, repeticiones: 9, rir: 1 },
        ],
      },
      {
        id: 3, deportista_id: 3, plan_id: 1, rutina_id: 1, fecha: sumarDias(HOY, -7),
        series: [
          { id: 11, ejercicio_id: 1, numero: 1, peso: 62.5, repeticiones: 8, rir: 2 },
          { id: 12, ejercicio_id: 1, numero: 2, peso: 62.5, repeticiones: 8, rir: 2 },
          { id: 13, ejercicio_id: 1, numero: 3, peso: 62.5, repeticiones: 7, rir: 1 },
          { id: 14, ejercicio_id: 2, numero: 1, peso: 55, repeticiones: 10, rir: 2 },
          { id: 15, ejercicio_id: 2, numero: 2, peso: 55, repeticiones: 9, rir: 2 },
          { id: 16, ejercicio_id: 2, numero: 3, peso: 55, repeticiones: 8, rir: 1 },
        ],
      },
    ],
    mediciones: [
      { id: 1, deportista_id: 3, fecha: sumarDias(HOY, -21), peso_corporal: 78.4, altura: 1.76 },
      { id: 2, deportista_id: 3, fecha: sumarDias(HOY, -10), peso_corporal: 78.0, altura: 1.76 },
      { id: 3, deportista_id: 3, fecha: sumarDias(HOY, -3), peso_corporal: 77.6, altura: 1.76 },
    ],
  };
}

import { crearDatosIniciales } from './datos';
import { hoy, formatearFechaCorta } from '../utils/fechas';

// Simula el backend NestJS respetando el contrato del Paso 11: mismas rutas, JSON en snake_case,
// errores { error } y mensajes del Paso 10. Los datos viven en memoria (se reinician al recargar).
// Cuando el back esté listo, se pone VITE_USE_MOCKS=false y este archivo deja de usarse.

const db = crearDatosIniciales();
const secuencias = { usuario: 5, plan: 2, rutina: 3, sesion: 4, serie: 17, medicion: 4 };
const siguienteId = (tipo) => secuencias[tipo]++;

class ErrorHttp extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}
const error = (status, mensaje) => { throw new ErrorHttp(status, mensaje); };

// ---------- Auth ----------
const crearTokens = (usuario) => ({
  access_token: `mock-access-${usuario.id}`,
  refresh_token: `mock-refresh-${usuario.id}`,
});

function usuarioDelToken(token) {
  const id = Number(token?.replace('mock-access-', ''));
  return db.usuarios.find((u) => u.id === id) ?? null;
}

const usuarioPublico = ({ id, nombre, email, rol }) => ({ id, nombre, email, rol });

// ---------- Helpers de dominio (en el back esto lo deciden entidades, VOs y services de dominio) ----------
const nombreEjercicio = (id) => db.ejercicios.find((e) => e.id === id)?.nombre ?? `Ejercicio ${id}`;
const nombreUsuario = (id) => db.usuarios.find((u) => u.id === id)?.nombre ?? '';
const estaVinculado = (entrenadorId, deportistaId) =>
  db.vinculos.some((v) => v.entrenador_id === entrenadorId && v.deportista_id === deportistaId);
const contiene = (a, fecha) => a.vigencia_desde <= fecha && fecha <= a.vigencia_hasta;
const seSuperponen = (a, b) => a.vigencia_desde <= b.vigencia_hasta && b.vigencia_desde <= a.vigencia_hasta;

function planVigenteDe(deportistaId, fecha = hoy()) {
  for (const plan of db.planes) {
    const asignacion = plan.asignaciones.find((a) => a.deportista_id === deportistaId && contiene(a, fecha));
    if (asignacion) return { plan, asignacion };
  }
  return null;
}

function rutinaConNombres(rutina) {
  return {
    id: rutina.id,
    nombre: rutina.nombre,
    dosificaciones: [...rutina.dosificaciones]
      .sort((a, b) => a.orden - b.orden)
      .map((d) => ({ ...d, ejercicio_nombre: nombreEjercicio(d.ejercicio_id) })),
  };
}

function buscarRutina(planId, rutinaId) {
  return db.planes.find((p) => p.id === planId)?.rutinas.find((r) => r.id === rutinaId) ?? null;
}

// CalculadoraCumplimiento: registradas ÷ objetivo, tope 100 % por ejercicio
function cumplimientoEjercicio(registradas, objetivo) {
  return Math.round((Math.min(registradas, objetivo) / objetivo) * 100);
}

function cumplimientoSesion(sesion) {
  const rutina = buscarRutina(sesion.plan_id, sesion.rutina_id);
  if (!rutina) return 0;
  let hechas = 0;
  let objetivo = 0;
  rutina.dosificaciones.forEach((d) => {
    const registradas = sesion.series.filter((s) => s.ejercicio_id === d.ejercicio_id).length;
    hechas += Math.min(registradas, d.series_objetivo);
    objetivo += d.series_objetivo;
  });
  return objetivo ? Math.round((hechas / objetivo) * 100) : 0;
}

function seriesDelDeportista(deportistaId, ejercicioId) {
  return db.sesiones
    .filter((s) => s.deportista_id === deportistaId)
    .flatMap((s) => s.series.filter((serie) => serie.ejercicio_id === ejercicioId).map((serie) => ({ ...serie, fecha: s.fecha })));
}

// DetectorRecordPersonal (RN9): mayor peso; a igual peso, más repeticiones
const esMejor = (a, b) => a.peso > b.peso || (a.peso === b.peso && a.repeticiones > b.repeticiones);

function recordActual(deportistaId, ejercicioId, excluirSerieId) {
  return seriesDelDeportista(deportistaId, ejercicioId)
    .filter((s) => s.id !== excluirSerieId)
    .reduce((mejor, s) => (!mejor || esMejor(s, mejor) ? s : mejor), null);
}

// VOs Peso, Repeticiones, RIR (RN4, RN5, RN6)
function validarSerie({ peso, repeticiones, rir }) {
  if (!Number.isInteger(repeticiones) || repeticiones <= 0) error(422, 'Las repeticiones tienen que ser mayores a 0.');
  if (typeof peso !== 'number' || Number.isNaN(peso)) error(422, 'El peso es obligatorio.');
  if (peso < 0) error(422, 'El peso no puede ser negativo.');
  if (!Number.isInteger(rir) || rir < 0) error(422, 'El RIR no puede ser negativo.');
}

// RN10 y RN15
function validarPlan({ nombre, rutinas }) {
  if (!nombre?.trim()) error(422, 'El nombre del plan es obligatorio.');
  if (!rutinas?.length || rutinas.some((r) => !r.dosificaciones?.length)) {
    error(422, 'Cada rutina del plan tiene que tener al menos un ejercicio.');
  }
  rutinas.forEach((r) => {
    if (!r.nombre?.trim()) error(422, 'Cada rutina tiene que tener un nombre.');
    const ids = r.dosificaciones.map((d) => d.ejercicio_id);
    if (new Set(ids).size !== ids.length) error(422, 'Un ejercicio no se puede repetir en la misma rutina.');
    r.dosificaciones.forEach((d) => {
      if (!(d.series_objetivo >= 1)) error(422, 'Las series objetivo tienen que ser al menos 1.');
      if (!(d.reps_min <= d.reps_max)) error(422, 'Las repeticiones mínimas no pueden superar a las máximas.');
      if (!(d.rir_objetivo >= 0)) error(422, 'El RIR objetivo no puede ser negativo.');
    });
  });
}

const armarRutinas = (rutinas) =>
  rutinas.map((r) => ({
    id: siguienteId('rutina'),
    nombre: r.nombre.trim(),
    dosificaciones: r.dosificaciones.map((d, i) => ({ ...d, orden: d.orden ?? i + 1 })),
  }));

function planDelEntrenador(planId, entrenadorId) {
  const plan = db.planes.find((p) => p.id === planId);
  if (!plan) error(404, 'El plan no existe.');
  if (plan.entrenador_id !== entrenadorId) error(403, 'El plan no es tuyo.');
  return plan;
}

function deportistaVinculado(entrenadorId, deportistaId) {
  if (!estaVinculado(entrenadorId, deportistaId)) error(403, 'El deportista no está vinculado con vos.');
}

// ---------- Rutas ----------
const rutas = [];
const ruta = (method, patron, opciones, handler) => {
  const regex = new RegExp(`^${patron.replace(/:(\w+)/g, '(?<$1>[^/]+)')}$`);
  rutas.push({ method, regex, handler, ...opciones });
};
const ENTRENADOR = ['ENTRENADOR'];
const DEPORTISTA = ['DEPORTISTA'];

// ---- auth ----
ruta('POST', '/auth/register', { publica: true }, ({ body }) => {
  const { nombre, email, contrasena, rol } = body ?? {};
  if (!nombre?.trim()) error(422, 'El nombre es obligatorio.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email ?? '')) error(422, 'El email no tiene un formato válido.');
  if ((contrasena ?? '').length < 8) error(422, 'La contraseña debe tener al menos 8 caracteres.');
  if (!/[A-Za-z]/.test(contrasena) || !/\d/.test(contrasena)) error(422, 'La contraseña debe tener al menos una letra y un número.');
  if (!['ENTRENADOR', 'DEPORTISTA'].includes(rol)) error(422, 'El rol debe ser ENTRENADOR o DEPORTISTA.');
  const emailNormalizado = email.trim().toLowerCase();
  if (db.usuarios.some((u) => u.email === emailNormalizado)) error(422, 'Ya existe una cuenta con ese email.');
  const usuario = { id: siguienteId('usuario'), nombre: nombre.trim(), email: emailNormalizado, contrasena, rol };
  db.usuarios.push(usuario);
  return [201, usuarioPublico(usuario)];
});

ruta('POST', '/auth/login', { publica: true }, ({ body }) => {
  const usuario = db.usuarios.find((u) => u.email === body?.email?.trim().toLowerCase());
  if (!usuario || usuario.contrasena !== body?.contrasena) error(401, 'Email o contraseña incorrectos.');
  return [200, { ...crearTokens(usuario), usuario: usuarioPublico(usuario) }];
});

ruta('POST', '/auth/refresh', { publica: true }, ({ body }) => {
  const id = Number(body?.refresh_token?.replace('mock-refresh-', ''));
  const usuario = db.usuarios.find((u) => u.id === id);
  if (!usuario) error(401, 'Sesión vencida.');
  return [200, crearTokens(usuario)];
});

ruta('GET', '/usuario/perfil', {}, ({ usuario }) => [200, usuarioPublico(usuario)]);

// ---- catálogo ----
ruta('GET', '/ejercicios', { roles: ENTRENADOR }, ({ query }) => {
  const grupo = query.get('grupo_muscular');
  if (grupo && !['MMII', 'MMSS', 'CORE'].includes(grupo)) error(422, 'El grupo muscular no es válido.');
  return [200, db.ejercicios.filter((e) => !grupo || e.grupo_muscular === grupo)];
});

// ---- deportistas ----
ruta('GET', '/deportistas', { roles: ENTRENADOR }, ({ usuario }) => {
  const lista = db.vinculos
    .filter((v) => v.entrenador_id === usuario.id)
    .map((v) => {
      const d = db.usuarios.find((u) => u.id === v.deportista_id);
      const vigente = planVigenteDe(d.id);
      return {
        id: d.id,
        nombre: d.nombre,
        email: d.email,
        plan_vigente: vigente
          ? { nombre: vigente.plan.nombre, vigencia_desde: vigente.asignacion.vigencia_desde, vigencia_hasta: vigente.asignacion.vigencia_hasta }
          : null,
      };
    });
  return [200, lista];
});

ruta('POST', '/deportistas', { roles: ENTRENADOR }, ({ usuario, body }) => {
  const deportista = db.usuarios.find((u) => u.email === body?.email?.trim().toLowerCase() && u.rol === 'DEPORTISTA');
  if (!deportista) error(422, 'No existe una cuenta de deportista con ese email.');
  if (db.vinculos.some((v) => v.deportista_id === deportista.id)) {
    error(422, `${deportista.nombre.split(' ')[0]} ya tiene entrenador.`); // E12
  }
  db.vinculos.push({ entrenador_id: usuario.id, deportista_id: deportista.id });
  return [201, { id: deportista.id, nombre: deportista.nombre, email: deportista.email }];
});

ruta('GET', '/deportistas/:id/asistencia', { roles: ENTRENADOR }, ({ usuario, params, query }) => {
  const deportistaId = Number(params.id);
  deportistaVinculado(usuario.id, deportistaId);
  const desde = query.get('desde');
  const hasta = query.get('hasta');
  // RN17: sin pesos ni repeticiones
  const lista = db.sesiones
    .filter((s) => s.deportista_id === deportistaId && (!desde || s.fecha >= desde) && (!hasta || s.fecha <= hasta))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .map((s) => ({ fecha: s.fecha, rutina: buscarRutina(s.plan_id, s.rutina_id)?.nombre ?? '', cumplimiento: cumplimientoSesion(s) }));
  return [200, lista];
});

ruta('GET', '/deportistas/:id/progreso/:ejercicioId', { roles: ENTRENADOR }, ({ usuario, params }) => {
  const deportistaId = Number(params.id);
  deportistaVinculado(usuario.id, deportistaId);
  const porFecha = new Map();
  seriesDelDeportista(deportistaId, Number(params.ejercicioId)).forEach((s) => {
    const actual = porFecha.get(s.fecha);
    if (!actual || esMejor(s, actual)) porFecha.set(s.fecha, s);
  });
  const lista = [...porFecha.values()]
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((s) => ({ fecha: s.fecha, peso_maximo: s.peso, repeticiones: s.repeticiones }));
  return [200, lista];
});

// ---- planes ----
ruta('GET', '/planes', { roles: ENTRENADOR }, ({ usuario }) => [
  200,
  db.planes.filter((p) => p.entrenador_id === usuario.id).map((p) => ({ id: p.id, nombre: p.nombre, rutinas: p.rutinas.map((r) => r.nombre) })),
]);

ruta('GET', '/planes/:id', { roles: ENTRENADOR }, ({ usuario, params }) => {
  const plan = planDelEntrenador(Number(params.id), usuario.id);
  return [200, { id: plan.id, nombre: plan.nombre, indicaciones: plan.indicaciones, rutinas: plan.rutinas.map(rutinaConNombres) }];
});

ruta('POST', '/planes', { roles: ENTRENADOR }, ({ usuario, body }) => {
  validarPlan(body ?? {});
  const plan = {
    id: siguienteId('plan'),
    nombre: body.nombre.trim(),
    entrenador_id: usuario.id,
    indicaciones: body.indicaciones ?? '',
    rutinas: armarRutinas(body.rutinas),
    asignaciones: [],
  };
  db.planes.push(plan);
  return [201, { id: plan.id }];
});

ruta('PUT', '/planes/:id', { roles: ENTRENADOR }, ({ usuario, params, body }) => {
  const plan = planDelEntrenador(Number(params.id), usuario.id);
  // RN13: solo si ningún deportista empezó la vigencia
  if (plan.asignaciones.some((a) => a.vigencia_desde <= hoy())) error(422, 'El plan ya empezó; no se puede modificar.');
  validarPlan(body ?? {});
  plan.nombre = body.nombre.trim();
  plan.indicaciones = body.indicaciones ?? '';
  plan.rutinas = armarRutinas(body.rutinas);
  return [200, { id: plan.id }];
});

ruta('POST', '/planes/:id/duplicado', { roles: ENTRENADOR }, ({ usuario, params }) => {
  const original = planDelEntrenador(Number(params.id), usuario.id);
  const copia = {
    id: siguienteId('plan'),
    nombre: `${original.nombre} (copia)`,
    entrenador_id: usuario.id,
    indicaciones: original.indicaciones,
    rutinas: armarRutinas(original.rutinas),
    asignaciones: [], // E15: el plan nuevo no tiene deportistas
  };
  db.planes.push(copia);
  return [201, { id: copia.id }];
});

ruta('POST', '/planes/:id/asignaciones', { roles: ENTRENADOR }, ({ usuario, params, body }) => {
  const plan = planDelEntrenador(Number(params.id), usuario.id);
  const deportistaId = Number(body?.deportista_id);
  const nueva = { deportista_id: deportistaId, vigencia_desde: body?.vigencia_desde, vigencia_hasta: body?.vigencia_hasta };
  if (!nueva.vigencia_desde || !nueva.vigencia_hasta) error(422, 'La vigencia tiene que tener fecha desde y hasta.');
  if (nueva.vigencia_desde > nueva.vigencia_hasta) error(422, 'La fecha desde no puede ser posterior a la fecha hasta.');
  if (!estaVinculado(usuario.id, deportistaId)) error(422, 'El deportista no está vinculado con vos.'); // E11
  // RN11: entre todos los planes del deportista
  const superpuesta = db.planes.flatMap((p) => p.asignaciones).find((a) => a.deportista_id === deportistaId && seSuperponen(a, nueva));
  if (superpuesta) {
    error(422, `Se superpone con el plan vigente (${formatearFechaCorta(superpuesta.vigencia_desde)} al ${formatearFechaCorta(superpuesta.vigencia_hasta)}).`);
  }
  plan.asignaciones.push(nueva);
  return [201, { plan_id: plan.id, ...nueva }];
});

// ---- plan vigente ----
ruta('GET', '/plan-vigente', { roles: DEPORTISTA }, ({ usuario }) => {
  const vigente = planVigenteDe(usuario.id);
  if (!vigente) error(404, 'No tenés un plan vigente.');
  const { plan, asignacion } = vigente;
  return [200, {
    id: plan.id,
    nombre: plan.nombre,
    entrenador_nombre: nombreUsuario(plan.entrenador_id),
    vigencia: { desde: asignacion.vigencia_desde, hasta: asignacion.vigencia_hasta },
    indicaciones: plan.indicaciones,
    rutinas: plan.rutinas.map(rutinaConNombres),
  }];
});

// ---- registro: series y sesiones ----
ruta('GET', '/ejercicios/:id/ultimas-series', { roles: DEPORTISTA }, ({ usuario, params }) => {
  const ejercicioId = Number(params.id);
  const anterior = db.sesiones
    .filter((s) => s.deportista_id === usuario.id && s.fecha < hoy() && s.series.some((x) => x.ejercicio_id === ejercicioId))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
  if (!anterior) return [200, { fecha: null, series: [] }];
  const series = anterior.series
    .filter((s) => s.ejercicio_id === ejercicioId)
    .map(({ numero, peso, repeticiones, rir }) => ({ numero, peso, repeticiones, rir }));
  return [200, { fecha: anterior.fecha, series }];
});

ruta('POST', '/series', { roles: DEPORTISTA }, ({ usuario, body }) => {
  const { rutina_id: rutinaId, ejercicio_id: ejercicioId, peso, repeticiones, rir } = body ?? {};
  validarSerie({ peso, repeticiones, rir });
  // RN3
  const vigente = planVigenteDe(usuario.id);
  const rutina = vigente?.plan.rutinas.find((r) => r.id === rutinaId);
  if (!rutina || !rutina.dosificaciones.some((d) => d.ejercicio_id === ejercicioId)) {
    error(422, 'El ejercicio no pertenece a una rutina de tu plan vigente.');
  }
  const recordAnterior = recordActual(usuario.id, ejercicioId);
  // RN2: una sesión por deportista, rutina y fecha; se crea con la primera serie
  let sesion = db.sesiones.find((s) => s.deportista_id === usuario.id && s.rutina_id === rutinaId && s.fecha === hoy());
  if (!sesion) {
    sesion = { id: siguienteId('sesion'), deportista_id: usuario.id, plan_id: vigente.plan.id, rutina_id: rutinaId, fecha: hoy(), series: [] };
    db.sesiones.push(sesion);
  }
  // RN7: número correlativo dentro del ejercicio
  const numero = sesion.series.filter((s) => s.ejercicio_id === ejercicioId).length + 1;
  const serie = { id: siguienteId('serie'), ejercicio_id: ejercicioId, numero, peso, repeticiones, rir };
  sesion.series.push(serie);
  const recordPersonal = Boolean(recordAnterior) && esMejor(serie, recordAnterior); // la primera vez no cuenta
  return [201, { serie_id: serie.id, numero, record_personal: recordPersonal }];
});

ruta('PATCH', '/series/:id', { roles: DEPORTISTA }, ({ usuario, params, body }) => {
  const serieId = Number(params.id);
  const sesion = db.sesiones.find((s) => s.series.some((x) => x.id === serieId));
  if (!sesion) error(404, 'La serie no existe.');
  if (sesion.deportista_id !== usuario.id) error(403, 'La serie no es tuya.');
  if (sesion.fecha !== hoy()) error(422, 'Solo se puede corregir el mismo día.'); // RN8
  const { peso, repeticiones, rir } = body ?? {};
  validarSerie({ peso, repeticiones, rir });
  const serie = sesion.series.find((x) => x.id === serieId);
  const recordAnterior = recordActual(usuario.id, serie.ejercicio_id, serieId);
  Object.assign(serie, { peso, repeticiones, rir });
  return [200, { serie_id: serieId, record_personal: Boolean(recordAnterior) && esMejor(serie, recordAnterior) }];
});

ruta('GET', '/sesiones/hoy', { roles: DEPORTISTA }, ({ usuario, query }) => {
  const rutinaId = Number(query.get('rutina_id'));
  const vigente = planVigenteDe(usuario.id);
  const rutina = vigente?.plan.rutinas.find((r) => r.id === rutinaId);
  if (!rutina) error(403, 'La rutina no es de tu plan vigente.');
  const sesion = db.sesiones.find((s) => s.deportista_id === usuario.id && s.rutina_id === rutinaId && s.fecha === hoy());
  const ejercicios = [...rutina.dosificaciones]
    .sort((a, b) => a.orden - b.orden)
    .map((d) => ({
      ejercicio_id: d.ejercicio_id,
      series_objetivo: d.series_objetivo,
      // incluye id de la serie para poder corregirla con PATCH /api/series/{id}
      series: (sesion?.series ?? [])
        .filter((s) => s.ejercicio_id === d.ejercicio_id)
        .map(({ id, numero, peso, repeticiones, rir }) => ({ id, numero, peso, repeticiones, rir })),
    }));
  return [200, { cumplimiento: sesion ? cumplimientoSesion(sesion) : 0, ejercicios }];
});

ruta('GET', '/sesiones', { roles: DEPORTISTA }, ({ usuario, query }) => {
  const desde = query.get('desde');
  const hasta = query.get('hasta');
  const lista = db.sesiones
    .filter((s) => s.deportista_id === usuario.id && (!desde || s.fecha >= desde) && (!hasta || s.fecha <= hasta))
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .map((s) => {
      const rutina = buscarRutina(s.plan_id, s.rutina_id);
      return {
        fecha: s.fecha,
        rutina: rutina?.nombre ?? '',
        cumplimiento: cumplimientoSesion(s),
        ejercicios: (rutina?.dosificaciones ?? []).map((d) => {
          const series = s.series.filter((x) => x.ejercicio_id === d.ejercicio_id);
          return {
            nombre: nombreEjercicio(d.ejercicio_id),
            cumplimiento: cumplimientoEjercicio(series.length, d.series_objetivo),
            series: series.map(({ numero, peso, repeticiones, rir }) => ({ numero, peso, repeticiones, rir })),
          };
        }),
      };
    });
  return [200, lista];
});

// ---- progreso ----
ruta('GET', '/progreso/ejercicios', { roles: DEPORTISTA }, ({ usuario }) => {
  const ids = new Set(db.sesiones.filter((s) => s.deportista_id === usuario.id).flatMap((s) => s.series.map((x) => x.ejercicio_id)));
  return [200, [...ids].map((id) => ({ id, nombre: nombreEjercicio(id) }))];
});

ruta('GET', '/progreso', { roles: DEPORTISTA }, ({ usuario, query }) => {
  const ejercicioId = Number(query.get('ejercicio_id'));
  const series = seriesDelDeportista(usuario.id, ejercicioId);
  const record = recordActual(usuario.id, ejercicioId);
  const fechas = [...new Set(series.map((s) => s.fecha))].sort();
  const porFecha = fechas.map((fecha) => {
    const delDia = series.filter((s) => s.fecha === fecha);
    const mejor = delDia.reduce((m, s) => (!m || esMejor(s, m) ? s : m), null);
    // CalculadoraProgreso: 1RM con Epley (RN16)
    const rm = Math.max(...delDia.map((s) => s.peso * (1 + s.repeticiones / 30)));
    return {
      fecha,
      peso_maximo: mejor.peso,
      rm_estimado: Math.round(rm * 10) / 10,
      mejor_serie: `${mejor.peso} × ${mejor.repeticiones}`,
      volumen: delDia.reduce((total, s) => total + s.peso * s.repeticiones, 0),
    };
  });
  return [200, {
    record: record ? { peso: record.peso, repeticiones: record.repeticiones, fecha: record.fecha } : null,
    por_fecha: porFecha,
  }];
});

// ---- mediciones ----
ruta('POST', '/mediciones', { roles: DEPORTISTA }, ({ usuario, body }) => {
  const peso = body?.peso_corporal;
  const altura = body?.altura;
  if (!(peso > 0)) error(422, 'El peso corporal tiene que ser mayor a 0.');
  if (!(altura > 0)) error(422, 'La altura tiene que ser mayor a 0.');
  // RN19: una por día; si ya existe la de hoy, se reemplaza
  let medicion = db.mediciones.find((m) => m.deportista_id === usuario.id && m.fecha === hoy());
  if (medicion) {
    Object.assign(medicion, { peso_corporal: peso, altura });
  } else {
    medicion = { id: siguienteId('medicion'), deportista_id: usuario.id, fecha: hoy(), peso_corporal: peso, altura };
    db.mediciones.push(medicion);
  }
  return [201, { id: medicion.id, fecha: medicion.fecha }];
});

ruta('GET', '/mediciones', {}, ({ usuario, query }) => {
  let deportistaId = usuario.id;
  if (usuario.rol === 'ENTRENADOR') {
    deportistaId = Number(query.get('deportista_id'));
    deportistaVinculado(usuario.id, deportistaId);
  }
  const desde = query.get('desde');
  const hasta = query.get('hasta');
  const lista = db.mediciones
    .filter((m) => m.deportista_id === deportistaId && (!desde || m.fecha >= desde) && (!hasta || m.fecha <= hasta))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map(({ fecha, peso_corporal, altura }) => ({ fecha, peso_corporal, altura }));
  return [200, lista];
});

// ---------- Despachador ----------
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

export const mockServer = {
  async handle(method, rutaConQuery, body) {
    await esperar(200); // simula la latencia de red
    const [ruta, textoQuery = ''] = rutaConQuery.split('?');
    const query = new URLSearchParams(textoQuery);
    const token = JSON.parse(localStorage.getItem('mvp-entrenamiento-sesion') ?? 'null')?.access_token;

    for (const r of rutas) {
      if (r.method !== method) continue;
      const match = ruta.match(r.regex);
      if (!match) continue;
      try {
        const usuario = usuarioDelToken(token);
        if (!r.publica && !usuario) error(401, 'No autenticado.'); // E13
        if (r.roles && !r.roles.includes(usuario.rol)) error(403, 'No tenés permiso para esta acción.');
        const [status, data] = r.handler({ usuario, params: match.groups ?? {}, query, body: structuredClone(body) });
        return { status, data: structuredClone(data) };
      } catch (e) {
        if (e instanceof ErrorHttp) return { status: e.status, data: { error: e.message } };
        throw e;
      }
    }
    return { status: 404, data: { error: `No existe la ruta ${method} ${ruta}.` } };
  },
};

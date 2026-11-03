# CLAUDE.md — Frontend React (MVP Entrenamiento, Grupo 7)

React 18 + Vite + React Router 6 + Recharts, en **JavaScript** (`.js` / `.jsx`). Deploy en Vercel. Back: [mvp-entrenamiento-backend](https://github.com/JuanCapuano/mvp-entrenamiento-backend).
Código, nombres y comentarios **en español**, con los términos del glosario del informe (`plan`, `rutina`, `dosificacion`, `serie`, `sesion`…).

## Antes de implementar una US

1. Leé la US y sus criterios en `Analisis/Proyecto 3 - Informe Documentación Grupo 7.md` (repo del back).
2. Buscá en el **Paso 11** el contrato de los endpoints que usa tu pantalla, y en **Campos extra del contrato** (abajo) lo que el front espera además.
3. Ubicá tu pantalla, tu service y tu hook en este archivo. **Casi todo ya existe**: tu trabajo es completarlo, conectarlo al back real y testearlo, no rehacerlo.
4. Si el endpoint del back todavía no está, trabajá con `VITE_USE_MOCKS=true`. Si cambia el contrato, actualizá también `src/mocks/mockServer.js`.

## Regla de oro

**El componente orquesta. El service comunica.**

Las dependencias van siempre hacia abajo, nunca al revés:

```
pages/ → hooks/ o context/ → services/ → api/httpClient.js → backend (o mocks/)
```

- Una pantalla **nunca** llama a `fetch` ni importa `httpClient`: usa un service o un hook.
- Un service **nunca** importa componentes, hooks ni contextos, ni usa `useState`/`useEffect`.
- `httpClient.js` es el **único** lugar que hace `fetch`.

## Capas

| Capa | Carpeta | Qué hace | Qué NO hace |
|---|---|---|---|
| Pantallas | `pages/{auth,entrenador,deportista}/` | Una por ruta. Arma la pantalla, estado local con `useState`, usa services o hooks, **decide cómo mostrar** carga, errores y vacíos. | Conocer URLs, headers o tokens |
| Componentes | `components/` | UI reutilizable. Reciben datos por **props**. | Llamar a services (salvo que se documente) |
| Hooks | `hooks/` | "Use cases del front": coordinan un flujo de varios pasos de **una** pantalla (`useArmarPlan`, `useRegistrarSerie`) o lógica genérica (`useCarga`). | Hablar con el back sin un service |
| Contextos | `context/` | Estado compartido por una rama del árbol. Hoy: `AuthContext`. | Reemplazar a un service |
| Services | `services/` | Un archivo por dominio con funciones que hablan con el back y **traducen** sus datos. Se prueban sin React. | Devolver JSX, guardar estado, decidir cómo se muestra un error |
| Cliente HTTP | `api/httpClient.js`, `api/tokenStorage.js` | URL base, token, refresh ante 401, `ApiError`, elegir back real o mocks. | Saber de planes, series, etc. |
| Mocks | `mocks/` | Simulan el back con el mismo contrato y los mensajes del Paso 10. | Usarse desde pantallas o services: solo los llama `httpClient` |
| Utilidades | `utils/` | Formato de fechas y números para mostrar. | Lógica de negocio |

## httpClient (ya hecho, no duplicar)

`api/httpClient.js` ya resuelve todo lo transversal:
- URL base desde `VITE_API_URL`; los services pasan **solo la ruta** (`'/planes'`), nunca la URL completa.
- `Authorization: Bearer` con el token de `tokenStorage`.
- Ante **401**: un solo intento de `POST /auth/refresh`; si falla, limpia la sesión y dispara `EVENTO_SESION_EXPIRADA` (lo escucha `AuthContext`).
- Si `status >= 400`, lanza `ApiError(status, mensaje)` con el `{ error }` del back.
- `VITE_USE_MOCKS=true` → usa `mockServer.handle` en vez de `fetch`. Es el **único** punto que decide esto.
- Métodos: `http.get(ruta, query)`, `http.post(ruta, body)`, `http.put`, `http.patch`. Si hace falta `delete`, se agrega acá.

## Services: uno por dominio

El criterio para separar services **no es la cantidad de funciones**, sino quién pide el cambio y por qué: dos funciones van juntas si cambian por el mismo motivo. Ni un "god service", ni uno por endpoint.

| Service | Funciones | Endpoints | US |
|---|---|---|---|
| `auth.service.js` | `crearCuenta`, `ingresar` | `/auth/register`, `/auth/login` | US-01, 02 |
| `usuario.service.js` | `obtenerPerfil` | `/usuario/perfil` | US-02 |
| `deportistas.service.js` | `listar`, `vincular` | `/deportistas` | US-03, 04 |
| `ejercicios.service.js` | `listar`, `ultimasSeries` | `/ejercicios`, `/ejercicios/{id}/ultimas-series` | US-05, 14 |
| `planes.service.js` | `listar`, `obtener`, `crear`, `modificar`, `duplicar`, `asignar` | `/planes…` | US-06 a 11 |
| `plan-vigente.service.js` | `obtener` | `/plan-vigente` | US-13 |
| `series.service.js` | `registrar`, `corregir` | `/series` | US-15, 17, 18 |
| `sesiones.service.js` | `deHoy`, `listar`, **`asistencia`** | `/sesiones/hoy`, `/sesiones`, `/deportistas/{id}/asistencia` | US-16, 20, 12 |
| `progreso.service.js` | `obtener`, `ejerciciosConProgreso`, **`deDeportista`** | `/progreso…`, `/deportistas/{id}/progreso/{ejercicio_id}` | US-19, 06 |
| `mediciones.service.js` | `registrar`, `listar` | `/mediciones` | US-21 |

> **A mover:** hoy `asistencia` y `progresoEnEjercicio` están en `deportistas.service.js` porque la URL empieza con `/deportistas`. Pero cambian cuando cambia el **registro** de entrenamiento, no la gestión de deportistas, así que van en `sesiones.service.js` y `progreso.service.js`. Los mueve el dueño de US-12 y de US-19.

### Traducción snake_case → camelCase: la hace el service

El back habla en snake_case (`plan_vigente`, `vigencia_desde`, `ejercicio_id`); el front, en camelCase. **La traducción se hace en el service, una sola vez**, con funciones `aX` (del back al front) y `aXApi` (del front al back). Las pantallas y hooks nunca ven una clave con guión bajo.

```js
// services/deportistas.service.js
import { http } from '../api/httpClient';

/** @typedef {{ id: number, nombre: string, email: string, planVigente: { nombre: string, desde: string, hasta: string } | null }} Deportista */

/** @returns {Deportista} */
function aDeportista(api) {
  return {
    id: api.id,
    nombre: api.nombre,
    email: api.email,
    planVigente: api.plan_vigente
      ? { nombre: api.plan_vigente.nombre, desde: api.plan_vigente.vigencia_desde, hasta: api.plan_vigente.vigencia_hasta }
      : null,
  };
}

export const deportistasService = {
  /** US-04 · GET /api/deportistas → Deportista[] */
  listar: async () => (await http.get('/deportistas')).map(aDeportista),

  /** US-03 · POST /api/deportistas { email } */
  vincular: async (email) => aDeportista(await http.post('/deportistas', { email })),
};
```

> **A migrar:** hoy los services devuelven el JSON del back tal cual y las pantallas leen snake_case (`d.plan_vigente.vigencia_desde`). Cada integrante migra **el service y las pantallas de sus US** cuando las toca. No se hace todo de una para no pisarse.

Reglas de los services:
- Funciones con verbo en español: `listar`, `obtener`, `crear`, `modificar`, `duplicar`, `asignar`, `registrar`, `corregir`, `vincular`.
- Encima de cada función, un comentario con la US, el método, la ruta y lo que devuelve (como ya está).
- Como es JavaScript, la forma de los datos se documenta con **JSDoc** (`@typedef`, `@returns`) en el service. Es lo que reemplaza a los tipos.
- No atrapan errores: dejan subir el `ApiError`. La pantalla (o el hook) decide cómo mostrarlo.
- No calculan reglas de negocio (ver abajo).

## Hooks: los "use cases" del front

Para pantallas con un flujo de varios pasos se usa un hook que **coordina**: maneja el estado, llama a los services y expone acciones. La pantalla solo muestra y conecta eventos.

| Hook | Qué coordina | US |
|---|---|---|
| `useArmarPlan(planExistente)` | Estado del plan en armado: rutinas, dosificaciones, orden; arma el cuerpo del contrato y guarda | US-06, 07, 09 |
| `useRegistrarSerie(rutinaId)` | Sesión de hoy, registrar y corregir series, aviso de récord | US-15 a 18 |
| `useCarga(funcion, deps)` | Genérico: `{ datos, cargando, error, recargar }` para cualquier consulta | todas |

- Para una consulta simple, usá `useCarga(() => xService.listar())`. No escribas `useEffect` + `useState` a mano en cada pantalla.
- Validaciones de formulario (campos obligatorios, mínimo ≤ máximo) van **en el hook**, no en la pantalla. Si se suma `yup`, el schema va en el hook y se corre antes de llamar al service.

## Contextos (useContext)

Solo para estado compartido por una rama del árbol. Cada cambio de su valor re-renderiza a todos los que lo leen, así que mejor **varios contextos chicos, uno por tema**.

**Sí, para:**
- `AuthContext` (ya existe): usuario logueado, rol, `ingresar()`, `salir()`. Se lee con `useAuth()`.
- Un flujo que ocupe **varias pantallas o rutas**. Ejemplo: si el armado de plan se divide en pasos con rutas distintas, `useArmarPlan` pasa a ser un `ArmarPlanProvider` con `useReducer`.

**No, para:**
- Pasar un dato a un hijo directo: props.
- Datos de una sola pantalla: `useState` o `useCarga`.
- Hablar con el back: eso es un service (el Provider lo llama, no lo reemplaza).

Forma obligatoria: exportar el `Provider` y un hook `useX()` que **falle si no hay Provider**, nunca el contexto suelto:

```js
export function useAuth() {
  const valor = useContext(AuthContext);
  if (!valor) throw new Error('useAuth tiene que usarse dentro de <AuthProvider>');
  return valor;
}
```

(`useAuth` hoy no tiene el chequeo: agregarlo.)

## Dónde va cada estado

| Tipo de estado | Ejemplo | Herramienta |
|---|---|---|
| Local de la pantalla | un input, mensaje de ok, modal abierto | `useState` |
| Flujo de una pantalla | plan en armado, sesión de hoy | hook propio (`useArmarPlan`, `useRegistrarSerie`) |
| Compartido por una rama | sesión del usuario | Context |
| Del servidor | planes, series, progreso | service + `useCarga` |
| En la URL | id del plan, rutina elegida | `useParams` del router |

El estado del servidor **no es del front**: es una copia de lo que tiene el back. Después de un comando (crear, asignar, registrar), se vuelve a pedir (`recargar()`) o se usa lo que devolvió el back. No se "adivina" el resultado.

## Reglas de negocio: las decide el back

- El front **no** calcula récords, 1RM, volumen, cumplimiento ni superposición de vigencias: muestra lo que devuelve el back. (El `mockServer` sí los calcula porque **simula** al back; eso no cuenta.)
- Se puede validar formato para dar feedback rápido (obligatorio, número ≥ 0, mín. ≤ máx., no repetir ejercicio en la rutina), pero el back siempre revalida.
- **Los mensajes de error del back se muestran tal cual** (Paso 12), con `<MensajeError>{error.message}</MensajeError>`. Nada de "Ocurrió un error" si el back mandó un mensaje.
- **La fecha de hoy la pone el back**: no se manda `fecha` al registrar series ni mediciones (RN12, RN19). `utils/fechas.hoy()` se usa solo para valores por defecto de filtros y en los mocks.
- **El rol decide qué se ve** (`RutaProtegida` + menú del `Layout`), pero ocultar algo no reemplaza el 403 del back.
- **O1 — registrar una serie en menos de 10 segundos**: inputs con `inputMode="decimal"` / `"numeric"`, valores precargados con la última serie, un toque para guardar, sin confirmaciones extra.
- **RN17 en pantalla**: la vista del entrenador sobre un deportista muestra asistencia, peso corporal y peso máximo; **nunca** series, 1RM ni récords.

## Rutas y pantallas

Definidas en `App.jsx`, protegidas por `RutaProtegida rol="…"` dentro de `Layout`. Una ruta nueva se agrega ahí y, si va en el menú, en `MENU` de `Layout.jsx`.

| Ruta | Rol | Pantalla | US | Dueño |
|---|---|---|---|---|
| `/login`, `/registro` | pública | `Login`, `Registro` | 02, 01 | Capuano |
| `/entrenador/deportistas` | ENTRENADOR | `Deportistas` | 04, 03 | Santiesteban, Capuano |
| `/entrenador/deportistas/:id` | ENTRENADOR | `DeportistaDetalle` (asistencia + peso corporal) | 12, 21 | Cocchi, Banegas |
| `/entrenador/catalogo` | ENTRENADOR | `Catalogo` | 05 | Capuano |
| `/entrenador/planes` | ENTRENADOR | `Planes` | 11 | Tosco |
| `/entrenador/planes/nuevo`, `/:id/editar` | ENTRENADOR | `PlanForm` + `useArmarPlan` | 06, 07, 09 | Bernardi, Santiesteban, Tosco |
| `/entrenador/planes/:id` | ENTRENADOR | `PlanDetalle` (detalle, duplicar, asignar) | 11, 10, 08 | Tosco, Bernardi |
| `/deportista/plan` | DEPORTISTA | `PlanVigente` | 13 | Santiesteban |
| `/deportista/entrenar/:rutinaId` | DEPORTISTA | `Entrenar` + `useRegistrarSerie` | 14 a 18 | Falvo, Banegas |
| `/deportista/sesiones` | DEPORTISTA | `Sesiones` | 20 | Capuano |
| `/deportista/progreso` | DEPORTISTA | `Progreso` | 19 | Cocchi |
| `/deportista/mediciones` | DEPORTISTA | `Mediciones` | 21 | Banegas |

### Pantallas compartidas entre varios dueños

`PlanForm`, `PlanDetalle` y `Entrenar` tienen US de más de una persona. Para no pisarse:
- Cada US que agrega UI propia la hace como **componente aparte** en `components/<pantalla>/` (ejemplo: `components/entrenar/UltimaVez.jsx` para US-14, `components/entrenar/FormularioSerie.jsx` para US-15, `components/plan/AsignarPlan.jsx` para US-08), y la pantalla solo lo monta.
- El archivo de la pantalla lo toca su primer dueño de la tabla; los demás solo agregan la línea que monta su componente.

## Campos extra del contrato

El front necesita algunos datos que el Paso 11 no detalla. **El back tiene que devolverlos** (avisarle a su dueño) y el mock ya los devuelve:

| Endpoint | Campo extra | Para qué | Dueño en el back |
|---|---|---|---|
| `GET /sesiones/hoy` | `id` en cada serie | Corregirla con `PATCH /series/{id}` (US-17) | Banegas / Falvo |
| `GET /plan-vigente`, `GET /planes/{id}` | `ejercicio_nombre` en cada dosificación | El deportista no tiene acceso al catálogo | Santiesteban, Bernardi |
| `GET /plan-vigente`, `GET /planes/{id}` | `id` en cada rutina | Se usa como `rutina_id` al registrar series | Santiesteban, Bernardi |
| `GET /plan-vigente` | `vigencia: { desde, hasta }` | Mostrar la vigencia | Santiesteban |

Si agregás otro campo que el Paso 11 no tiene, sumalo a esta tabla y avisale al dueño del back.

## Mocks

- `VITE_USE_MOCKS=true` hace funcionar la app sin back, con los datos del Paso 10 (usuarios y contraseñas en el README).
- `mockServer.js` replica rutas, roles, códigos HTTP y **mensajes exactos** del Paso 10. Si el back responde distinto, se corrige el que esté mal según el informe, no se "adapta" la pantalla.
- Nunca importar `mocks/` desde una pantalla o un service.
- Antes de la entrega, cada pantalla se prueba con `VITE_USE_MOCKS=false` contra el back real.

## Componentes compartidos (usar, no reinventar)

- `Estado.jsx`: `<Cargando />`, `<MensajeError>`, `<MensajeOk>`, `<Vacio>`. Toda pantalla muestra los tres estados: cargando, error y vacío.
- `GraficoEvolucion.jsx`: gráfico de líneas (Recharts) para cualquier evolución por fecha: peso máximo y 1RM (US-19, con la aclaración de que el 1RM es una estimación), peso corporal (US-21). No sumar otra librería de gráficos.
- `RutaProtegida.jsx`, `Layout.jsx`.
- Estilos en `styles.css` con las clases existentes (`boton`, `boton-secundario`, `campo`, `tabla`, `alerta-error`…). No agregar otra librería de UI ni CSS-in-JS.

## Convenciones de nombres

| Qué | Archivo | Ejemplo |
|---|---|---|
| Pantalla | `PascalCase.jsx` en `pages/<rol>/` | `PlanDetalle.jsx` |
| Componente | `PascalCase.jsx` | `FormularioSerie.jsx` |
| Hook | `useX.js` | `useRegistrarSerie.js` |
| Contexto | `XContext.jsx` (exporta `XProvider` y `useX`) | `AuthContext.jsx` |
| Service | `kebab-case.service.js` (exporta `xService`) | `plan-vigente.service.js` → `planVigenteService` |
| Utilidad | `kebab-case.js` | `fechas.js` |
| Test | junto al archivo, `.test.js(x)` | `deportistas.service.test.js` |

## Tests  (pendiente de configurar)

El plan pide **Vitest + React Testing Library**, y todavía no están en `package.json`. Primero hay que instalarlos y agregar los scripts `test` y `lint` (pieza compartida, ver abajo).

| Qué | Cómo |
|---|---|
| Services | Mockear `http`; verificar la ruta y la traducción snake_case → camelCase |
| `httpClient` | Token en el header, refresh una sola vez ante 401, `ApiError` con el mensaje del back |
| Hooks | `renderHook` con el service mockeado: `useArmarPlan` arma bien el cuerpo del contrato, `useRegistrarSerie` muestra el récord |
| Pantallas | RTL con el service mockeado: muestra datos, el error del back tal cual, y el vacío |

Los criterios de aceptación de cada US son los casos de prueba.

## Piezas compartidas (se hacen primero)

| Pieza | Responsable |
|---|---|
| Instalar Vitest + RTL + jsdom, scripts `test`, y un primer test de `httpClient` | Cocchi |
| ESLint (con `react-hooks`) y Prettier, scripts `lint` y `format` | Cocchi |
| `useAuth` que falle sin Provider | Capuano |
| Mover `asistencia` a `sesionesService` y `progresoEnEjercicio` a `progresoService` | Cocchi |

## Variables de entorno

`.env` nunca se commitea (ya está en `.gitignore`); `.env.example` sí.
```
VITE_API_URL=http://localhost:3000/api
VITE_USE_MOCKS=true
```
En Vercel: `VITE_API_URL` apunta al back de Railway y `VITE_USE_MOCKS=false`.

## Antes de cada PR

```
npm run lint
npm run test
npm run build
```
Y probar la pantalla con los dos roles: el que la usa y el que no debería verla.

## Git

Igual que en el back: ramas desde `develop` (`feature/us-15-registrar-serie`), PR a `develop`, commits `feature(...)`, `fix(...)`, `refactor(...)`, integrar cada 48 horas como máximo. En archivos compartidos (`App.jsx`, `Layout.jsx`, `httpClient.js`, `mockServer.js`, `styles.css`) solo agregar, sin reordenar ni reformatear.

# MVP Entrenamiento — Frontend (Grupo 7)

React 18 + Vite + React Router + Recharts. Base para conectar con [mvp-entrenamiento-backend](https://github.com/JuanCapuano/mvp-entrenamiento-backend).

## Arrancar

```bash
npm install
cp .env.example .env
npm run dev
```

Con `VITE_USE_MOCKS=true` funciona sin backend, con los datos del Paso 10:

| Usuario | Email | Contraseña |
|---|---|---|
| Laura Gómez (entrenadora) | laura@gym.com | clave1234 |
| Martín Díaz (entrenador) | martin@gym.com | clave1234 |
| Juan Pérez (deportista, vinculado a Laura) | juan@gym.com | clave1234 |
| Sofía Ruiz (deportista, sin entrenador) | sofia@gym.com | clave1234 |

Para usar el back real: `VITE_USE_MOCKS=false` y `VITE_API_URL=http://localhost:3000/api`.

## Estructura

```
src/
├── api/
│   ├── httpClient.js      ← único lugar que hace fetch; token, refresh, errores { error }; decide back real o mocks
│   └── tokenStorage.js
├── services/              ← un service por controlador del back (rutas del Paso 11)
│   ├── auth.service.js           /api/auth
│   ├── usuario.service.js        /api/usuario
│   ├── ejercicios.service.js     /api/ejercicios
│   ├── planes.service.js         /api/planes
│   ├── plan-vigente.service.js   /api/plan-vigente
│   ├── deportistas.service.js    /api/deportistas
│   ├── series.service.js         /api/series
│   ├── sesiones.service.js       /api/sesiones
│   ├── progreso.service.js       /api/progreso
│   └── mediciones.service.js     /api/mediciones
├── hooks/                 ← use cases del front, solo en lo más importante
│   ├── useArmarPlan.js           US-06, 07, 09
│   ├── useRegistrarSerie.js      US-15, 16, 17, 18
│   └── useCarga.js               helper genérico de carga
├── mocks/                 ← simula el back (mismas rutas, mensajes del Paso 10)
├── context/AuthContext.jsx
├── components/            ← Layout, RutaProtegida, estados
└── pages/
    ├── auth/              Login (US-02), Registro (US-01)
    ├── entrenador/        Deportistas (US-03, 04), DeportistaDetalle (US-12 + peso corporal),
    │                      Catalogo (US-05), Planes (US-11), PlanForm (US-06, 07, 09 + historial CU19),
    │                      PlanDetalle (US-08, 10)
    └── deportista/        PlanVigente (US-13), Entrenar (US-14 a 18), Sesiones (US-20),
                           Progreso (US-19), Mediciones (US-21)
```

Las páginas nunca llaman a `fetch`: usan services (o hooks que usan services). Para pasar de mocks al back no se toca ningún componente.

## Campos que el front espera y el Paso 11 no detalla

- `GET /api/sesiones/hoy`: cada serie con su `id`, para poder corregirla con `PATCH /api/series/{id}`.
- `GET /api/plan-vigente` y `GET /api/planes/{id}`: cada dosificación con `ejercicio_nombre` (el deportista no tiene acceso al catálogo), y cada rutina con `id` (se usa como `rutina_id` al registrar series).
- `GET /api/plan-vigente`: `vigencia` como `{ desde, hasta }`.

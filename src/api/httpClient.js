import { API_URL, USE_MOCKS } from '../config';
import { tokenStorage } from './tokenStorage';
import { mockServer } from '../mocks/mockServer';

// Error con el formato del contrato: { "error": "mensaje legible" }.
// Los errores de negocio (422) se muestran tal como los devuelve el back (Paso 12).
export class ApiError extends Error {
  constructor(status, mensaje) {
    super(mensaje ?? 'Ocurrió un error inesperado.');
    this.status = status;
  }
}

export const EVENTO_SESION_EXPIRADA = 'sesion-expirada';

function armarQuery(query) {
  if (!query) return '';
  const params = new URLSearchParams();
  Object.entries(query).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') params.append(clave, valor);
  });
  const texto = params.toString();
  return texto ? `?${texto}` : '';
}

async function llamarBackend(method, ruta, body) {
  const token = tokenStorage.accessToken();
  const respuesta = await fetch(`${API_URL}${ruta}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const texto = await respuesta.text();
  const data = texto ? JSON.parse(texto) : null;
  return { status: respuesta.status, data };
}

// POST /api/auth/refresh { refresh_token } → { access_token, refresh_token }
async function intentarRefresh() {
  const refreshToken = tokenStorage.refreshToken();
  if (!refreshToken) return false;
  const llamar = USE_MOCKS ? mockServer.handle : llamarBackend;
  const { status, data } = await llamar('POST', '/auth/refresh', { refresh_token: refreshToken });
  if (status !== 200) return false;
  tokenStorage.actualizarTokens(data.access_token, data.refresh_token);
  return true;
}

async function request(method, ruta, { body, query } = {}) {
  const rutaCompleta = `${ruta}${armarQuery(query)}`;
  // Único punto donde se decide si se usa el back real o los mocks.
  const llamar = USE_MOCKS ? mockServer.handle : llamarBackend;

  let { status, data } = await llamar(method, rutaCompleta, body);

  // Token vencido: se intenta un refresh una sola vez y se repite el pedido.
  if (status === 401 && !ruta.startsWith('/auth/')) {
    const refrescado = await intentarRefresh();
    if (refrescado) {
      ({ status, data } = await llamar(method, rutaCompleta, body));
    }
    if (status === 401) {
      tokenStorage.limpiar();
      window.dispatchEvent(new Event(EVENTO_SESION_EXPIRADA));
    }
  }

  if (status >= 400) throw new ApiError(status, data?.error);
  return data;
}

export const http = {
  get: (ruta, query) => request('GET', ruta, { query }),
  post: (ruta, body) => request('POST', ruta, { body }),
  put: (ruta, body) => request('PUT', ruta, { body }),
  patch: (ruta, body) => request('PATCH', ruta, { body }),
};

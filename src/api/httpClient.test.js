import { http, ApiError, EVENTO_SESION_EXPIRADA } from './httpClient';
import { tokenStorage } from './tokenStorage';

vi.mock('../config', () => ({ API_URL: 'http://localhost:3000/api', USE_MOCKS: false }));

describe('httpClient', () => {
  const respuesta = (status, datos) => ({ status, text: async () => JSON.stringify(datos) });
  beforeEach(() => {
    tokenStorage.guardar({
      access_token: 'access-prueba',
      refresh_token: 'refresh-prueba',
      usuario: { id: 3, rol: 'DEPORTISTA' },
    });
    vi.stubGlobal('fetch', vi.fn());
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('envía el token y el comando al único cliente de red', async () => {
    fetch.mockResolvedValueOnce(
      respuesta(201, { serie_id: 17, numero: 1, record_personal: false }),
    );
    await http.post('/series', {
      rutina_id: 1,
      ejercicio_id: 1,
      peso: 60,
      repeticiones: 8,
      rir: 2,
    });
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/series',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer access-prueba' }),
      }),
    );
  });
  it('conserva el mensaje textual de un 422', async () => {
    fetch.mockResolvedValueOnce(
      respuesta(422, { error: 'Las repeticiones tienen que ser mayores a 0.' }),
    );
    await expect(http.post('/series', {})).rejects.toEqual(
      new ApiError(422, 'Las repeticiones tienen que ser mayores a 0.'),
    );
  });
  it('refresca el token una sola vez y reintenta el comando con el nuevo access token', async () => {
    fetch
      .mockResolvedValueOnce(respuesta(401, { error: 'Token vencido.' }))
      .mockResolvedValueOnce(
        respuesta(200, { access_token: 'access-nuevo', refresh_token: 'refresh-nuevo' }),
      )
      .mockResolvedValueOnce(respuesta(201, { serie_id: 17 }));
    await expect(http.post('/series', {})).resolves.toEqual({ serie_id: 17 });
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(fetch.mock.calls[1][0]).toBe('http://localhost:3000/api/auth/refresh');
    expect(fetch.mock.calls[2][1].headers.Authorization).toBe('Bearer access-nuevo');
  });
  it('si falla el refresh limpia la sesión y avisa la expiración', async () => {
    const alExpirar = vi.fn();
    window.addEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
    fetch.mockResolvedValue(respuesta(401, { error: 'Token inválido.' }));
    await expect(http.post('/series', {})).rejects.toBeInstanceOf(ApiError);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(tokenStorage.obtener()).toBeNull();
    expect(alExpirar).toHaveBeenCalledTimes(1);
    window.removeEventListener(EVENTO_SESION_EXPIRADA, alExpirar);
  });
});

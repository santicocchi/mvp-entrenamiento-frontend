import { useState } from 'react';
import { Link } from 'react-router-dom';
import { deportistasService } from '../../services/deportistas.service';
import { useCarga } from '../../hooks/useCarga';
import { Cargando, MensajeError, MensajeOk, Vacio } from '../../components/Estado';
import { formatearFecha } from '../../utils/fechas';

// US-03 (vincular) y US-04 (lista con plan vigente)
export default function Deportistas() {
  const { datos: deportistas, cargando, error, recargar } = useCarga(() => deportistasService.listar());
  const [email, setEmail] = useState('');
  const [errorVinculo, setErrorVinculo] = useState(null);
  const [ok, setOk] = useState(null);

  const vincular = async (e) => {
    e.preventDefault();
    setErrorVinculo(null);
    setOk(null);
    try {
      const d = await deportistasService.vincular(email);
      setOk(`${d.nombre} quedó vinculado.`);
      setEmail('');
      recargar();
    } catch (err) {
      setErrorVinculo(err.message);
    }
  };

  return (
    <section>
      <h1>Mis deportistas</h1>

      <form className="fila-formulario" onSubmit={vincular} noValidate>
        <label className="campo campo-ancho">
          Vincular deportista por email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="deportista@email.com" required />
        </label>
        <button className="boton">Vincular</button>
      </form>
      <MensajeError>{errorVinculo}</MensajeError>
      <MensajeOk>{ok}</MensajeOk>

      {cargando && <Cargando />}
      <MensajeError>{error?.message}</MensajeError>
      {deportistas?.length === 0 && <Vacio>Todavía no tenés deportistas. Vinculá uno con su email.</Vacio>}
      {deportistas?.length > 0 && (
        <div className="tabla-contenedor">
          <table className="tabla">
            <thead>
              <tr><th>Nombre</th><th>Email</th><th>Plan vigente</th><th>Vigencia</th><th></th></tr>
            </thead>
            <tbody>
              {deportistas.map((d) => (
                <tr key={d.id}>
                  <td>{d.nombre}</td>
                  <td>{d.email}</td>
                  <td>{d.planVigente?.nombre ?? <span className="texto-suave">Sin plan</span>}</td>
                  <td>
                    {d.planVigente
                      ? `${formatearFecha(d.planVigente.desde)} al ${formatearFecha(d.planVigente.hasta)}`
                      : '—'}
                  </td>
                  <td><Link to={`/entrenador/deportistas/${d.id}`}>Ver asistencia</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

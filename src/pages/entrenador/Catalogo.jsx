import { useState } from 'react';
import { ejerciciosService } from '../../services/ejercicios.service';
import { useCarga } from '../../hooks/useCarga';
import { Cargando, MensajeError } from '../../components/Estado';

export const GRUPOS = [
  { valor: '', texto: 'Todos' },
  { valor: 'MMII', texto: 'Miembros inferiores' },
  { valor: 'MMSS', texto: 'Miembros superiores' },
  { valor: 'CORE', texto: 'Core' },
];

// US-05
export default function Catalogo() {
  const [grupo, setGrupo] = useState('');
  const { datos: ejercicios, cargando, error } = useCarga(() => ejerciciosService.listar(grupo), [grupo]);

  return (
    <section>
      <h1>Catálogo de ejercicios</h1>
      <div className="filtros" role="group" aria-label="Grupo muscular">
        {GRUPOS.map((g) => (
          <button key={g.valor} type="button" className={`filtro ${grupo === g.valor ? 'filtro-activo' : ''}`} onClick={() => setGrupo(g.valor)}>
            {g.texto}
          </button>
        ))}
      </div>
      {cargando && <Cargando />}
      <MensajeError>{error?.message}</MensajeError>
      {ejercicios && (
        <ul className="lista-simple">
          {ejercicios.map((e) => (
            <li key={e.id}>
              <span>{e.nombre}</span>
              <span className="etiqueta">{e.grupo_muscular}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

import { useState } from 'react';
import { GRUPOS, textoClasificacion } from '../../utils/grupos-musculares';
import { Cargando, Vacio } from '../Estado';

// Para buscar sin importar mayúsculas ni tildes ("gluteo" encuentra "Glúteo")
const normalizar = (texto) => texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

// Panel para elegir ejercicios del catálogo y agregarlos a una rutina (US-06).
// Recibe el catálogo ya cargado por props: no habla con el back.
export default function SelectorEjercicios({ catalogo, yaAgregados, onAgregar }) {
  const [abierto, setAbierto] = useState(false);
  const [grupo, setGrupo] = useState('');
  const [busqueda, setBusqueda] = useState('');

  if (!abierto) {
    return (
      <button type="button" className="boton-secundario" onClick={() => setAbierto(true)}>
        + Agregar ejercicio
      </button>
    );
  }

  const texto = normalizar(busqueda.trim());
  const visibles = catalogo?.filter(
    (e) => (!grupo || e.grupo_muscular === grupo) && normalizar(e.nombre).includes(texto),
  );

  return (
    <div className="selector-ejercicios">
      <div className="selector-cabecera">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar ejercicio del catálogo"
          aria-label="Buscar ejercicio"
        />
        <button type="button" className="boton-texto" onClick={() => setAbierto(false)}>Cerrar</button>
      </div>

      <div className="filtros" role="group" aria-label="Filtrar por grupo muscular">
        {GRUPOS.map((g) => (
          <button
            key={g.valor}
            type="button"
            className={`filtro ${grupo === g.valor ? 'filtro-activo' : ''}`}
            onClick={() => setGrupo(g.valor)}
          >
            {g.texto}
          </button>
        ))}
      </div>

      {!catalogo && <Cargando />}
      {visibles?.length === 0 && <Vacio>No hay ejercicios con esos filtros.</Vacio>}
      {visibles?.length > 0 && (
        <ul className="selector-lista">
          {visibles.map((e) => {
            const agregado = yaAgregados.has(e.id); // RN15: no se repite dentro de la rutina
            return (
              <li key={e.id} className="selector-item">
                <span className="selector-nombre">
                  {e.nombre}
                  <span className={`etiqueta etiqueta-${e.grupo_muscular.toLowerCase()}`}>
                    {textoClasificacion(e.grupo_muscular, e.subgrupo)}
                  </span>
                </span>
                <button type="button" className="boton-secundario boton-chico" disabled={agregado} onClick={() => onAgregar(e)}>
                  {agregado ? 'Agregado' : 'Agregar'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

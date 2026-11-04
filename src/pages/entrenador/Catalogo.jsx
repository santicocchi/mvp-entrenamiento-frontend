import { useState } from 'react';
import { ejerciciosService } from '../../services/ejercicios.service';
import { useCarga } from '../../hooks/useCarga';
import { Cargando, MensajeError, Vacio } from '../../components/Estado';
import { GRUPOS, SUBGRUPOS, textoClasificacion } from '../../utils/grupos-musculares';

// PlanForm todavía importa GRUPOS desde acá
export { GRUPOS };

// Para buscar sin importar mayúsculas ni tildes ("gluteo" encuentra "Glúteo")
const normalizar = (texto) => texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();

// US-05
export default function Catalogo() {
  const [grupo, setGrupo] = useState('');
  const [subgrupo, setSubgrupo] = useState('');
  const [busqueda, setBusqueda] = useState('');
  // El grupo y el subgrupo los filtra el back; el nombre se busca sobre lo que ya llegó
  const { datos: ejercicios, cargando, error } = useCarga(() => ejerciciosService.listar(grupo, subgrupo), [grupo, subgrupo]);

  // Al cambiar de grupo se limpia el subgrupo, que depende de él
  const elegirGrupo = (valor) => {
    setGrupo(valor);
    setSubgrupo('');
  };
  const limpiar = () => {
    elegirGrupo('');
    setBusqueda('');
  };

  const visibles = ejercicios?.filter((e) => normalizar(e.nombre).includes(normalizar(busqueda.trim())));
  const hayFiltros = grupo || subgrupo || busqueda;

  return (
    <section>
      <h1>Catálogo de ejercicios</h1>

      <div className="fila-formulario">
        <label className="campo campo-ancho">
          Buscar
          <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Nombre del ejercicio" />
        </label>
        <label className="campo">
          Grupo muscular
          <select value={grupo} onChange={(e) => elegirGrupo(e.target.value)}>
            {GRUPOS.map((g) => <option key={g.valor} value={g.valor}>{g.texto}</option>)}
          </select>
        </label>
        {SUBGRUPOS[grupo] && (
          <label className="campo">
            Subgrupo
            <select value={subgrupo} onChange={(e) => setSubgrupo(e.target.value)}>
              <option value="">Todos</option>
              {SUBGRUPOS[grupo].map((s) => <option key={s.valor} value={s.valor}>{s.texto}</option>)}
            </select>
          </label>
        )}
        {hayFiltros && <button type="button" className="boton-texto" onClick={limpiar}>Limpiar filtros</button>}
      </div>

      {cargando && <Cargando />}
      <MensajeError>{error?.message}</MensajeError>
      {visibles && (
        <>
          <p className="contador-resultados" aria-live="polite">{visibles.length} {visibles.length === 1 ? 'ejercicio' : 'ejercicios'}</p>
          {visibles.length === 0 ? (
            <Vacio>No hay ejercicios con esos filtros.</Vacio>
          ) : (
            <ul className="lista-simple">
              {visibles.map((e) => (
                <li key={e.id}>
                  <span>{e.nombre}</span>
                  <span className="etiquetas">
                    <span className={`etiqueta etiqueta-${e.grupo_muscular.toLowerCase()}`}>{textoClasificacion(e.grupo_muscular)}</span>
                    {e.subgrupo && (
                      <span className={`etiqueta etiqueta-sub etiqueta-${e.grupo_muscular.toLowerCase()}`}>{textoClasificacion(e.subgrupo)}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

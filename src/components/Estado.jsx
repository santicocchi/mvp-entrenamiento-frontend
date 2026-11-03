// Componentes chicos para los estados de carga, error y vacío.
export function Cargando() {
  return <p className="estado">Cargando…</p>;
}

export function MensajeError({ children }) {
  if (!children) return null;
  return <p className="alerta alerta-error" role="alert">{children}</p>;
}

export function MensajeOk({ children }) {
  if (!children) return null;
  return <p className="alerta alerta-ok" role="status">{children}</p>;
}

export function Vacio({ children }) {
  return <p className="estado estado-vacio">{children}</p>;
}

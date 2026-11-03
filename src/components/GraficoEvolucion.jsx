import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatearFechaCorta, formatearFecha } from '../utils/fechas';

// Gráfico de líneas genérico para evoluciones por fecha.
// series: [{ clave: 'peso_maximo', nombre: 'Peso máximo', color: '#12607a' }]
export default function GraficoEvolucion({ datos, series, unidad = 'kg', alto = 280 }) {
  return (
    <div className="grafico">
      <ResponsiveContainer width="100%" height={alto}>
        <LineChart data={datos} margin={{ top: 10, right: 16, bottom: 0, left: -8 }}>
          <CartesianGrid stroke="#e3e8ec" vertical={false} />
          <XAxis dataKey="fecha" tickFormatter={formatearFechaCorta} tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} domain={['auto', 'auto']} unit={` ${unidad}`} width={70} />
          <Tooltip
            labelFormatter={formatearFecha}
            formatter={(valor, nombre) => [`${valor} ${unidad}`, nombre]}
          />
          {series.length > 1 && <Legend />}
          {series.map((s) => (
            <Line
              key={s.clave}
              type="monotone"
              dataKey={s.clave}
              name={s.nombre}
              stroke={s.color}
              strokeWidth={2.5}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

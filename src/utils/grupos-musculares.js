export const GRUPOS = [
  { valor: '', texto: 'Todos' },
  { valor: 'PIERNA', texto: 'Pierna' },
  { valor: 'PECHO', texto: 'Pecho' },
  { valor: 'ESPALDA', texto: 'Espalda' },
  { valor: 'HOMBRO', texto: 'Hombro' },
  { valor: 'BRAZO', texto: 'Brazo' },
  { valor: 'CORE', texto: 'Core' },
];

// Solo los grupos que se subdividen tienen subgrupos
export const SUBGRUPOS = {
  PIERNA: [
    { valor: 'CUADRICEPS', texto: 'Cuádriceps' },
    { valor: 'FEMORAL', texto: 'Femoral' },
    { valor: 'GLUTEO', texto: 'Glúteo' },
    { valor: 'GEMELOS', texto: 'Gemelos' },
  ],
  ESPALDA: [
    { valor: 'DORSALES', texto: 'Dorsales' },
    { valor: 'TRAPECIO', texto: 'Trapecio' },
  ],
  BRAZO: [
    { valor: 'BICEPS', texto: 'Bíceps' },
    { valor: 'TRICEPS', texto: 'Tríceps' },
  ],
};

const TEXTOS = Object.fromEntries(
  [...GRUPOS, ...Object.values(SUBGRUPOS).flat()].map((x) => [x.valor, x.texto]),
);

/** 'PIERNA', 'GLUTEO' → 'Pierna · Glúteo' */
export const textoClasificacion = (grupo, subgrupo) =>
  [TEXTOS[grupo] ?? grupo, subgrupo && (TEXTOS[subgrupo] ?? subgrupo)].filter(Boolean).join(' · ');

import { Level } from './types';

export const LEVELS: Level[] = [
  {
    id: '1',
    cols: 5,
    rows: 3,
    start: { x: 0, y: 1, dir: 1 },
    goal: { x: 4, y: 1 },
    walls: [],
    par: 4,
    intro:
      'Encadena comandos y dale a Ejecutar. La ruta corre entera de golpe: no puedes corregir a mitad.',
  },
  {
    id: '2',
    cols: 4,
    rows: 4,
    start: { x: 0, y: 3, dir: 1 },
    goal: { x: 3, y: 0 },
    walls: [],
    par: 7,
    intro:
      'Avanzar va en la dirección que mira el dron. Para subir, antes tendrás que girar.',
  },
  {
    id: '3',
    cols: 5,
    rows: 3,
    start: { x: 0, y: 1, dir: 1 },
    goal: { x: 4, y: 1 },
    walls: [[2, 1]],
    par: 10,
    intro:
      'Hay un bloque en medio. Planéalo en tu cabeza antes de ejecutar: si chocas, vuelves al inicio.',
  },
  {
    id: '4',
    cols: 5,
    rows: 5,
    start: { x: 0, y: 4, dir: 0 },
    goal: { x: 4, y: 4 },
    walls: [
      [1, 1],
      [2, 1],
      [3, 1],
      [1, 2],
      [2, 2],
      [3, 2],
      [1, 3],
      [2, 3],
      [3, 3],
    ],
    par: 14,
    intro:
      'Rodea el edificio. Cuantos menos comandos uses, mejor: intenta igualar el par.',
  },
  {
    id: '5',
    cols: 5,
    rows: 5,
    start: { x: 0, y: 0, dir: 1 },
    goal: { x: 4, y: 4 },
    open: [
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
      [4, 0],
      [4, 1],
      [0, 2],
      [1, 2],
      [2, 2],
      [3, 2],
      [4, 2],
      [0, 3],
      [0, 4],
      [1, 4],
      [2, 4],
      [3, 4],
      [4, 4],
    ],
    par: 20,
    intro:
      "Un pasillo en zigzag. Toca repetir 'avanzar' muchas veces… fíjate en lo cansino que se vuelve.",
    outro:
      '¿Te has fijado? Has escrito «avanzar» una y otra vez. En el próximo mundo desbloquearás los BUCLES: decir «repite 4 veces» en lugar de copiar y pegar. Justo eso que acabas de echar de menos.',
  },
];

export const colors = {
  bg: '#0E1116',
  panel: '#161B22',
  panel2: '#1B222C',
  line: 'rgba(255,255,255,0.07)',
  grid: 'rgba(255,255,255,0.05)',
  ink: '#E6EDF3',
  muted: '#8B98A5',
  accent: '#38E1C6',
  accentDim: 'rgba(56,225,198,0.16)',
  goal: '#6EE787',
  hazard: '#3A2A1C',
  hazardEdge: '#F0883E',
  danger: '#FF6B6B',
} as const;

export type Color = (typeof colors)[keyof typeof colors];

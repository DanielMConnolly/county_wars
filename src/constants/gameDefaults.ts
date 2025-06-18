export const GAME_DEFAULTS = {
  HIGHLIGHT_COLOR: '#EF4444', // Red
  RESOURCES: 1000,
  POPULATION: 1000,
  MAP_STYLE: 'terrain',
  GAME_DURATION_HOURS: 1,
  START_YEAR: 1945,
  END_YEAR: 2025,
  START_MONTH: 1,
} as const;

export const COLOR_OPTIONS = [
  { name: 'Red', value: '#EF4444', class: 'bg-red-500' },
  { name: 'Blue', value: '#3B82F6', class: 'bg-blue-500' },
  { name: 'Green', value: '#10B981', class: 'bg-emerald-500' },
  { name: 'Purple', value: '#8B5CF6', class: 'bg-violet-500' },
  { name: 'Orange', value: '#F97316', class: 'bg-orange-500' },
  { name: 'Pink', value: '#EC4899', class: 'bg-pink-500' },
  { name: 'Yellow', value: '#EAB308', class: 'bg-yellow-500' },
  { name: 'Teal', value: '#14B8A6', class: 'bg-teal-500' },
  { name: 'Indigo', value: '#6366F1', class: 'bg-indigo-500' },
  { name: 'Lime', value: '#84CC16', class: 'bg-lime-500' },
  { name: 'Cyan', value: '#06B6D4', class: 'bg-cyan-500' },
  { name: 'Rose', value: '#F43F5E', class: 'bg-rose-500' }
] as const;
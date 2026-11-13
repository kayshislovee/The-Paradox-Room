// Buat file baru: src/data/tapeData.ts
export const TAPE_DATA: Record<string, {
  label: string;
  category: string;
  content: { key: string; value: string }[];
}> = {
  item_tape_a: {
    label: 'TAPE A',
    category: 'PERSONNEL SEARCH',
    content: [
      { key: 'Department', value: 'Research' },
      { key: 'Shift', value: 'Night' },
      { key: 'Id', value: '583' },
      { key: 'Identify the personnel', value: '' },
    ],
  },
  item_tape_d: {
    label: 'TAPE D',
    category: 'MAINTENANCE LOG',
    content: [
      { key: 'Position', value: 'Technician' },
      { key: 'Shift', value: 'Day' },
      { key: 'Identify the personnel', value: '' },
    ],
  },
  item_tape_e: {
    label: 'TAPE E',
    category: 'SECURITY LOG',
    content: [
      { key: 'Department', value: 'Security' },
      { key: 'Shift', value: 'Night' },
      { key: 'Identify the personnel.', value: '' },
    ],
  },
};
import type { Festival } from '../types'

export const INDIA_FESTIVALS_2026: Festival[] = [
  { date: '2026-01-14', name: 'Makar Sankranti', type: 'national' },
  { date: '2026-01-26', name: 'Republic Day', type: 'national' },
  { date: '2026-02-14', name: "Valentine's Day", type: 'creator' },
  { date: '2026-03-10', name: 'Holi Eve', type: 'national' },
  { date: '2026-03-11', name: 'Holi', type: 'national' },
  { date: '2026-03-22', name: 'Gudi Padwa', type: 'regional' },
  { date: '2026-04-06', name: 'Ram Navami', type: 'national' },
  { date: '2026-04-14', name: 'Ambedkar Jayanti', type: 'national' },
  { date: '2026-04-30', name: 'Akshaya Tritiya', type: 'national' },
  { date: '2026-05-01', name: 'Labour Day', type: 'national' },
  { date: '2026-05-12', name: "Mother's Day", type: 'creator' },
  { date: '2026-06-05', name: 'World Environment Day', type: 'creator' },
  { date: '2026-06-21', name: 'World Yoga Day', type: 'creator' },
  { date: '2026-07-17', name: 'Guru Purnima', type: 'national' },
  { date: '2026-08-09', name: 'Friendship Day', type: 'creator' },
  { date: '2026-08-15', name: 'Independence Day', type: 'national' },
  { date: '2026-08-29', name: 'Onam', type: 'regional' },
  { date: '2026-09-05', name: "Teachers' Day", type: 'national' },
  { date: '2026-09-18', name: 'Ganesh Chaturthi', type: 'national' },
  { date: '2026-10-02', name: 'Gandhi Jayanti', type: 'national' },
  { date: '2026-10-20', name: 'Navratri Start', type: 'national' },
  { date: '2026-10-29', name: 'Dussehra', type: 'national' },
  { date: '2026-11-05', name: 'Karva Chauth', type: 'national' },
  { date: '2026-11-14', name: "Children's Day", type: 'national' },
  { date: '2026-11-15', name: 'Diwali', type: 'national' },
  { date: '2026-11-16', name: 'Diwali Day 2', type: 'national' },
  { date: '2026-11-24', name: 'Dev Diwali', type: 'regional' },
  { date: '2026-12-25', name: 'Christmas', type: 'national' },
  { date: '2026-12-31', name: "New Year's Eve", type: 'creator' },
]

export function getFestivalsForDate(dateStr: string): Festival[] {
  return INDIA_FESTIVALS_2026.filter((f) => f.date === dateStr)
}

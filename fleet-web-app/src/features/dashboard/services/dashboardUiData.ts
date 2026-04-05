export interface WeeklyTripDay {
  date: Date;
  dayLabel: string;
  dayNumber: number;
  isToday: boolean;
  tripsCount: number;
}

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const baseTripCounts = [12, 15, 10, 18, 21, 9, 7];

export const startOfWeekMonday = (date: Date) => {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  return start;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const buildWeeklyTrips = (referenceDate = new Date()): WeeklyTripDay[] => {
  const monday = startOfWeekMonday(referenceDate);
  const weekSeed = Number(
    `${monday.getFullYear()}${String(monday.getMonth() + 1).padStart(2, '0')}${String(monday.getDate()).padStart(2, '0')}`,
  );
  const offset = weekSeed % 4;

  return dayLabels.map((label, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const tripsCount = Math.max(4, baseTripCounts[index] + ((index + offset) % 3) - 1);

    return {
      date,
      dayLabel: label,
      dayNumber: date.getDate(),
      isToday: isSameDay(date, new Date()),
      tripsCount,
    };
  });
};

export const formatWeekRange = (referenceDate = new Date()) => {
  const monday = startOfWeekMonday(referenceDate);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const start = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const end = sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${start} - ${end}`;
};

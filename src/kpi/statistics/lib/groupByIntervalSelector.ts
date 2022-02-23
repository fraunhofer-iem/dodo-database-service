import { Intervals } from '.';

export function groupByIntervalSelector(path: string, interval: Intervals) {
  return {
    year: { $year: path },
    month: interval === Intervals.MONTH ? { $month: path } : undefined,
    week: interval === Intervals.WEEK ? { $week: path } : undefined,
    day: interval === Intervals.DAY ? { $dayOfYear: path } : undefined,
  };
}

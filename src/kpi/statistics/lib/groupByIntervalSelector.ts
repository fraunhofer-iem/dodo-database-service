import { Intervals } from '.';

/**
 * Returns a selector that can be used in the group stage of a pipeline.
 * This selector will create groups of i.e. <year>-<calendar week>, if
 * Intervals.WEEK is provided as interval param.
 *
 * @param path Path to the field, that contains the date which should be used to construct the groups
 * @param interval Granularity of the groups
 */
export function groupByIntervalSelector(path: string, interval: Intervals) {
  return {
    year: { $year: path },
    month: interval === Intervals.MONTH ? { $month: path } : undefined,
    week: interval === Intervals.WEEK ? { $week: path } : undefined,
    day: interval === Intervals.DAY ? { $dayOfYear: path } : undefined,
  };
}

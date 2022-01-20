import { DevSpreadDates } from 'src/github-api/model/DevFocus';

/**
 * Helper function to eliminate duplicate weeks, sprints or months
 * because the calculated intervals per developer may differ
 * and would have been taken as separate intervals into account,
 * altough it was the same interval of commiting.
 * @param timeSpreadPairs An object with timestamps as keys, and an object with developer:sprad pairs as a value
 * @param days The days, the interval blongs to, i.e. 7 (weeks), 14 (sprint), 30(month)
 * @returns
 */
export function rearangeTimeslots(
  timeSpreadPairs: { [key: string]: { [key: string]: number } },
  days: number,
): { [key: string]: { [key: string]: number } } {
  // copy the old timeSpreadPairs to modify on that
  const newTimeSpreadPairs: { [key: string]: { [key: string]: number } } = {
    ...timeSpreadPairs,
  };
  const timestamps: string[] = Object.keys(timeSpreadPairs).sort();
  // go through every sorted timestamp and look to successor
  for (let i = 1; i <= timestamps.length; ) {
    const currentDate: string = timestamps[i - 1];
    const nextDate: string = timestamps[i];
    // check, if the next interval date should actualy be in current interval
    if (addDays(currentDate, days) > new Date(timestamps[i])) {
      // append the values together, update the current interval object
      const devSpreadObj1 = timeSpreadPairs[currentDate];
      const devSpreadObj2 = timeSpreadPairs[nextDate];
      const mergedObj = { ...devSpreadObj1, ...devSpreadObj2 };
      newTimeSpreadPairs[currentDate] = mergedObj;
      // delete the unnessacary date and skip the next date
      delete newTimeSpreadPairs[nextDate];
      i += 2;
    } else {
      i += 1;
    }
  }
  return newTimeSpreadPairs;
}

/**
 * Helper function to add a number of days to an existing date.
 * @param date The date, which should be increased.
 * @param days The number of days, which should be added to the date.
 * @returns The new increased date in Date() format
 */
export function addDays(date: string, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * This function calculates all spread values for a given object with timestamps
 * as keys and arrays of repoIds as values. Therefor, in daySpread, weekSpread,
 * sprintSpread and monthSpread are stored all spreads precisely, i.e. their values
 * considered as an object in which every timestamp (or beginning timestamp of that interval)
 * is a key, with an array of the corresponding repoIds for that timestmamp as a value.
 * The Sum properties are the sums of the lenghts of all repoId arrays in a category.
 * The days, weeks, sprint, month properties are the amount of all keys (timestamps)
 * in a category (for later avg computation).
 * @param timeRepoPairs An Object of timestamps as keys, with repoId arrays as values (for a developer),
 * i.e. it's already the daySpread of a developer.
 * @returns An object with computed spreads for timeintervals, the sums of the single spreads
 * and the number of timestamps for a category.
 */
export function spreadsGroupedByTimeslots(timeRepoPairs: {
  [key: string]: string[];
}): DevSpreadDates {
  // sort the timestamps to ensure correct interval computation
  const timestamps: string[] = Object.keys(timeRepoPairs).sort();
  // the return object dates
  const dates: DevSpreadDates = {
    daySpread: {},
    weekSpread: {},
    sprintSpread: {},
    monthSpread: {},
    daySpreadSum: 0,
    weekSpreadSum: 0,
    sprintSpreadSum: 0,
    monthSpreadSum: 0,
    days: 0,
    weeks: 0,
    sprints: 0,
    months: 0,
  };
  // init first dayspread entry
  dates.daySpread[timestamps[0]] = timeRepoPairs[timestamps[0]];
  // init all category counters with the first timestamp
  let weekDate = timestamps[0];
  let sprintDate = timestamps[0];
  let monthDate = timestamps[0];
  // counter for category sums
  let daySpreadSum = timeRepoPairs[timestamps[0]].length; // already init it with the length of the first entrys repoID array
  let weekSpreadSum = 0;
  let sprintSpreadSum = 0;
  let monthSpreadSum = 0;
  // counstruct sets for week, sprint and month categorys to get unique repoIds to calculate the spreads
  const weekSpread: Set<string> = new Set();
  const sprintSpread: Set<string> = new Set();
  const monthSpread: Set<string> = new Set();
  // always compare the next date; if the interval fits, increase the category counters
  for (let i = 1; i < timestamps.length; i++) {
    // repo array for each timestamp
    const repoArr = timeRepoPairs[timestamps[i]];
    dates.daySpread[timestamps[i]] = repoArr; // always add entry to the daySpread category
    daySpreadSum += timeRepoPairs[timestamps[i]].length; // always add the length (spread) to the daySpreadSum
    // for other intervals, add every repo of current entry to the set
    // Then, if one timeslot is reached, increase counters with length of the set,
    // clear the set and set the category date to the new date
    repoArr.forEach((repo) => {
      weekSpread.add(repo);
      sprintSpread.add(repo);
      monthSpread.add(repo);
    });
    if (addDays(weekDate, 7) <= new Date(timestamps[i])) {
      dates.weekSpread[weekDate] = Array.from(weekSpread);
      weekSpreadSum += weekSpread.size;
      weekSpread.clear();
      weekDate = timestamps[i];
    }
    if (addDays(sprintDate, 14) <= new Date(timestamps[i])) {
      dates.sprintSpread[sprintDate] = Array.from(sprintSpread);
      sprintSpreadSum += sprintSpread.size;
      sprintSpread.clear();
      sprintDate = timestamps[i];
    }
    if (addDays(monthDate, 30) <= new Date(timestamps[i])) {
      dates.monthSpread[monthDate] = Array.from(monthSpread);
      monthSpreadSum += monthSpread.size;
      monthSpread.clear();
      monthDate = timestamps[i];
    }
  }
  // after all, add the computed numbers to the dates object
  dates.daySpreadSum = daySpreadSum;
  dates.weekSpreadSum = weekSpreadSum;
  dates.sprintSpreadSum = sprintSpreadSum;
  dates.monthSpreadSum = monthSpreadSum;
  dates.days = Object.keys(dates.daySpread).length;
  dates.weeks = Object.keys(dates.weekSpread).length;
  dates.sprints = Object.keys(dates.sprintSpread).length;
  dates.months = Object.keys(dates.monthSpread).length;
  return dates;
}

export function msToDateString(ms: number) {
  const seconds = ms / 1000;
  const minutes = ms / (1000 * 60);
  const hours = ms / (1000 * 60 * 60);
  const days = ms / (1000 * 60 * 60 * 24);
  if (seconds < 60) return seconds.toFixed(1) + ' Sec';
  else if (minutes < 60) return minutes.toFixed(1) + ' Min';
  else if (hours < 24) return hours.toFixed(1) + ' Hrs';
  else return days + ' Days';
}

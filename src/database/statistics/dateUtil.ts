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

export function getSpreadsForDev(timeRepoPairs: {
  [key: string]: string[];
}): DevSpreadDates {
  // sort because timestamp order is broken after mixing them together from different repos
  const timestamps: string[] = Object.keys(timeRepoPairs).sort();

  let dates: DevSpreadDates = generateDayWeekSprintMonthSpread(
    timeRepoPairs,
    timestamps,
  );
  dates = calculateSprintsOfWeeks(dates);
  return dates;
}

function generateDayWeekSprintMonthSpread1(
  timeRepoPairs: {
    [key: string]: string[];
  },
  timestamps: string[],
) {
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
  // first day spread entry is always first entry of sorted timestamps
  dates.daySpread[timestamps[0]] = timeRepoPairs[timestamps[0]];

  // compare values for each category
  let weekDate = timestamps[0];
  let sprintDate = timestamps[0];
  let monthDate = timestamps[0];

  if (timestamps.length == 1) {
    dates.weekSpread[timestamps[0]] = timeRepoPairs[timestamps[0]];
    const month = new Date(monthDate).getMonth() + 1;
    dates.monthSpread[month] = timeRepoPairs[timestamps[0]];
  }

  // sums of the lenghts of all repoId arrays in a category
  // init all except sprint, because exact two following weeks are necessary
  let daySpreadSum = timeRepoPairs[timestamps[0]].length;
  let weekSpreadSum = timeRepoPairs[timestamps[0]].length;
  let sprintSpreadSum = 0;
  let monthSpreadSum = timeRepoPairs[timestamps[0]].length;

  // TODO: must the init set entrys have to be from timestamps[0]??
  const weekSpread: Set<string> = new Set(timeRepoPairs[timestamps[0]]);
  const sprintSpread: Set<string> = new Set();
  const monthSpread: Set<string> = new Set(timeRepoPairs[timestamps[0]]);

  for (let i = 1; i < timestamps.length; i++) {
    // repo array for each timestamp
    const repoArr = timeRepoPairs[timestamps[i]];
    dates.daySpread[timestamps[i]] = repoArr; // always add entry to the daySpread category
    daySpreadSum += timeRepoPairs[timestamps[i]].length;

    repoArr.forEach((repo) => {
      weekSpread.add(repo);
      sprintSpread.add(repo);
      monthSpread.add(repo);
    });

    const currentWeek = getCalendarWeek(weekDate);
    const currentSprint = getCalendarWeek(sprintDate);
    const currentMonth = new Date(monthDate);
    const nextCalenderDate = getCalendarWeek(timestamps[i]);
    const nextMonth = new Date(timestamps[i]);

    if (!datesAreInSameWeek(currentWeek, nextCalenderDate)) {
      dates.weekSpread[currentWeek] = Array.from(weekSpread);
      weekSpreadSum += weekSpread.size;
      weekSpread.clear();
      weekDate = timestamps[i];

      if (datesAreSprint(currentSprint, nextCalenderDate)) {
        dates.sprintSpread[currentSprint] = Array.from(sprintSpread);
        sprintSpreadSum += sprintSpread.size;
        sprintSpread.clear();
        sprintDate = timestamps[i];
      }
    } else if (i == timestamps.length - 1) {
      dates.weekSpread[currentWeek] = Array.from(weekSpread);
      weekSpreadSum += weekSpread.size;
    }

    if (!datesAreInSameMonth(currentMonth.getMonth(), nextMonth.getMonth())) {
      dates.monthSpread[currentMonth.getMonth()] = Array.from(monthSpread);
      monthSpreadSum += monthSpread.size;
      monthSpread.clear();
      monthDate = timestamps[i];
    }
    // maybe just set the initial start month always!
    // wenn der letzte eintrag ein neuer monat ist, gilt das if darüber
    // wenn der letzte eintrag noch kein neuer monat ist, wird der aktuelle noch eingefügt
    else if (i == timestamps.length - 1) {
      // const yetMonths = Object.keys(dates.monthSpread);
      // console.log(yetMonths);
      // const lastMonth = new Date(yetMonths[yetMonths.length - 1]);
      // if (!datesAreInSameMonth(lastMonth, nextMonth)) {
      console.log(monthSpread);
      dates.monthSpread[currentMonth.getMonth()] = Array.from(monthSpread);
      monthSpreadSum += monthSpread.size;
      // }
    }
  }
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

function generateDayWeekSprintMonthSpread(
  timeRepoPairs: {
    [key: string]: string[];
  },
  timestamps: string[],
) {
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
  // compare values for each category
  let weekDate = timestamps[0];
  let sprintDate = timestamps[0];
  let monthDate = timestamps[0];

  // first day spread entry is always first entry of sorted timestamps
  dates.daySpread[timestamps[0]] = timeRepoPairs[timestamps[0]];
  const week = getCalendarWeek(weekDate);
  dates.weekSpread[week] = timeRepoPairs[timestamps[0]];
  const month = new Date(monthDate).getMonth() + 1;
  dates.monthSpread[month] = timeRepoPairs[timestamps[0]];

  // sums of the lenghts of all repoId arrays in a category
  // init all except sprint, because exact two following weeks are necessary
  let daySpreadSum = timeRepoPairs[timestamps[0]].length;
  let weekSpreadSum = 0;
  let sprintSpreadSum = 0;
  let monthSpreadSum = 0;

  for (let i = 1; i < timestamps.length; i++) {
    const repoArr = timeRepoPairs[timestamps[i]];
    dates.daySpread[timestamps[i]] = repoArr; // always add entry to the daySpread category
    daySpreadSum += timeRepoPairs[timestamps[i]].length;

    // console.log(repoArr);
    const currentWeek = getCalendarWeek(weekDate);
    const currentSprint = getCalendarWeek(sprintDate);
    const currentMonth = new Date(monthDate).getMonth() + 1;
    const nextCalenderDate = getCalendarWeek(timestamps[i]);
    const nextMonth = new Date(timestamps[i]).getMonth() + 1;

    if (!datesAreInSameWeek(currentWeek, nextCalenderDate)) {
      dates.weekSpread[nextCalenderDate] = repoArr;
      weekDate = timestamps[i];
      weekSpreadSum += dates.weekSpread[currentWeek].length;
      console.log(dates.weekSpread[currentWeek]);
      console.log(currentWeek, dates.weekSpread[currentWeek].length);
      // if (datesAreSprint(currentSprint, nextCalenderDate)) {
      //   dates.sprintSpread[currentWeek] = Array.from(sprintSpread);
      //   sprintSpreadSum += sprintSpread.size;
      //   sprintSpread.clear();
      //   sprintDate = timestamps[i];
      // }
    } else {
      const currentRepos = dates.weekSpread[currentWeek];
      const mergedRepos = [].concat(currentRepos, repoArr);
      dates.weekSpread[currentWeek] = Array.from(new Set(mergedRepos));
    }
    if (!datesAreInSameMonth(currentMonth, nextMonth)) {
      dates.monthSpread[nextMonth] = repoArr;
      monthDate = timestamps[i];
      monthSpreadSum += dates.monthSpread[currentMonth].length;
    } else {
      const currentRepos = dates.monthSpread[currentMonth];
      const mergedRepos = [].concat(currentRepos, repoArr);
      dates.monthSpread[currentMonth] = Array.from(new Set(mergedRepos));
    }
    // add the repo amounts for the next week/month in last step
    // as they are not considered otherwise
    if (i == timestamps.length - 1) {
      weekSpreadSum += dates.weekSpread[nextCalenderDate].length;
      monthSpreadSum += dates.monthSpread[nextMonth].length;
    }
  }

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

function getCalendarWeek(strDate: string): number {
  const date = new Date(strDate);
  date.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  // January 4 is always in week 1.
  var week1 = new Date(date.getFullYear(), 0, 4);
  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
  return (
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7,
    )
  );
}

function datesAreInSameWeek(week1: number, week2: number): boolean {
  if (week1 == week2) {
    return true;
  }
  return false;
}

function datesAreInSameMonth(month1: number, month2: number): boolean {
  if (month1 == month2) {
    return true;
  }
  return false;
}

function datesAreSprint(week1: number, week2: number): boolean {
  if (Math.abs(week1 - week2) == 1) {
    return true;
  }
  return false;
}

function calculateSprintsOfWeeks(dates: DevSpreadDates) {
  const weekSpread = dates.weekSpread;
  const weeks = Object.keys(weekSpread);
  let sprintSpreadSum = 0;
  for (let i = 0; i < weeks.length; ) {
    let currentWeek = Number(weeks[i]);
    let nextWeek = Number(weeks[i + 1]);
    if (datesAreSprint(currentWeek, nextWeek)) {
      const currentRepos = weekSpread[currentWeek];
      const nextRepos = weekSpread[nextWeek];
      const mergedRepos = [].concat(currentRepos, nextRepos);
      dates.sprintSpread[currentWeek] = Array.from(new Set(mergedRepos));
      sprintSpreadSum += dates.sprintSpread[currentWeek].length;
      i += 2;
    } else {
      i += 1;
    }
  }
  dates.sprintSpreadSum = sprintSpreadSum;
  dates.sprints = Object.keys(dates.sprintSpread).length;
  return dates;
}

import { DevSpreadDates } from 'src/github-api/model/DevFocus';

/**
 * Computes all spread values for a developer,
 * based on his @param timeRepoPairs. The timestamp
 * is the commit date, the repo Ids identify the repos,
 * in which was committed on that date.
 * @param timeRepoPairs timestamp: [repoId] pairs object.
 * @returns An object with computed spreads for time category,
 * the sum of the spread for each time category
 * and the total number of timestamps in a category (days, weeks, ...)
 */
export function getSpreadsForDev(timeRepoPairs: {
  [key: string]: string[];
}): DevSpreadDates {
  // sort because timestamp order is broken after mixing them together from different repos
  const timestamps: string[] = Object.keys(timeRepoPairs).sort();

  let dates: DevSpreadDates = calculateDayWeekMonthSpread(
    timeRepoPairs,
    timestamps,
  );
  dates = calculateSprintsByWeeks(dates);
  return dates;
}

/**
 * Actual computation of the day spread (in date), week spread (in calender weeks)
 * and month spread (in month numbers) for a developer.
 * Also, the sum of each spread in a time category,
 * i.e. the sum of the repo Id amount for every
 * item in one time category, and the total number of items
 * in one category are being calculated.
 * @param timeRepoPairs timestamp: [repoId] pairs object.
 * @param timestamps sorted array of timestamps.
 * @returns DevSpreadDates for a developer,
 * without sprint related values being calculated.
 */
function calculateDayWeekMonthSpread(
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

  // values to compare with next timestamp in the loop
  let weekDate = timestamps[0];
  let monthDate = timestamps[0];
  let yearDate = timestamps[0];

  // initialize all spread objects with the first timestamp and related repoID arr,
  // as the first timestamp relates to first day, first week and first month at all.
  dates.daySpread[timestamps[0]] = timeRepoPairs[timestamps[0]];
  const week = getCalendarWeek(weekDate);
  dates.weekSpread[getYear(yearDate) + '-' + week] =
    timeRepoPairs[timestamps[0]];
  const month = getMonthNumber(monthDate);
  dates.monthSpread[getYear(yearDate) + '-' + month] =
    timeRepoPairs[timestamps[0]];

  // only apply on daySpreadSum, because week and month may not be complete yet
  let daySpreadSum = timeRepoPairs[timestamps[0]].length;
  let weekSpreadSum = 0;
  let monthSpreadSum = 0;

  for (let i = 1; i < timestamps.length; i++) {
    const repoArr = timeRepoPairs[timestamps[i]];
    // days are always complete, so just apply every step
    dates.daySpread[timestamps[i]] = repoArr;
    daySpreadSum += timeRepoPairs[timestamps[i]].length;

    const currentWeek = getCalendarWeek(weekDate);
    const currentMonth = getMonthNumber(monthDate);
    const currentYear = getYear(yearDate);
    const nextWeek = getCalendarWeek(timestamps[i]);
    const nextMonth = getMonthNumber(timestamps[i]);
    const nextYear = getYear(timestamps[i]);

    if (
      !weeksAreEqual(currentWeek, nextWeek) &&
      yearsAreEqual(currentYear, nextYear)
    ) {
      dates.weekSpread[currentYear + '-' + nextWeek] = repoArr;
      weekDate = timestamps[i];
      weekSpreadSum += dates.weekSpread[currentYear + '-' + currentWeek].length;
    } else if (
      weeksAreEqual(currentWeek, nextWeek) &&
      !yearsAreEqual(currentYear, nextYear)
    ) {
      dates.weekSpread[nextYear + '-' + nextWeek] = repoArr;
      weekDate = timestamps[i];
      weekSpreadSum += dates.weekSpread[currentYear + '-' + currentWeek].length;
    } else if (
      weeksAreEqual(currentWeek, nextWeek) &&
      yearsAreEqual(currentYear, nextYear)
    ) {
      // add repo Ids to current week entry and make set for no duplicates
      const currentRepos = dates.weekSpread[currentYear + '-' + currentWeek];
      const mergedRepos = [].concat(currentRepos, repoArr);
      dates.weekSpread[currentYear + '-' + currentWeek] = Array.from(
        new Set(mergedRepos),
      );
    }

    if (
      !monthsAreEqual(currentMonth, nextMonth) &&
      yearsAreEqual(currentYear, nextYear)
    ) {
      dates.monthSpread[currentYear + '-' + nextMonth] = repoArr;
      monthDate = timestamps[i];
      monthSpreadSum +=
        dates.monthSpread[currentYear + '-' + currentMonth].length;
    } else if (
      monthsAreEqual(currentMonth, nextMonth) &&
      !yearsAreEqual(currentYear, nextYear)
    ) {
      dates.monthSpread[nextYear + '-' + nextMonth] = repoArr;
      monthDate = timestamps[i];
      monthSpreadSum +=
        dates.monthSpread[currentYear + '-' + currentMonth].length;
    } else if (
      monthsAreEqual(currentMonth, nextMonth) &&
      yearsAreEqual(currentYear, nextYear)
    ) {
      // add repo Ids to current month entry and make set for no duplicates
      const currentRepos = dates.monthSpread[currentYear + '-' + currentMonth];
      const mergedRepos = [].concat(currentRepos, repoArr);
      dates.monthSpread[currentYear + '-' + currentMonth] = Array.from(
        new Set(mergedRepos),
      );
    }

    // set year counter
    if (!yearsAreEqual(currentYear, nextYear)) {
      yearDate = timestamps[i];
    }

    // add the current repo amounts for next week/month in last step
    // as they are not considered otherwise
    if (i == timestamps.length - 1) {
      weekSpreadSum +=
        dates.weekSpread[getYear(yearDate) + '-' + nextWeek].length;
      monthSpreadSum +=
        dates.monthSpread[getYear(yearDate) + '-' + nextMonth].length;
    }
  }

  dates.daySpreadSum = daySpreadSum;
  dates.weekSpreadSum = weekSpreadSum;
  dates.monthSpreadSum = monthSpreadSum;
  dates.days = Object.keys(dates.daySpread).length;
  dates.weeks = Object.keys(dates.weekSpread).length;
  dates.months = Object.keys(dates.monthSpread).length;
  return dates;
}

/**
 * Put in a date @param strDate and get the
 * calender week number as @return.
 * @source https://weeknumber.com/how-to/javascript
 */
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

/**
 * If two weeks @param week1 and @param week2 are equal,
 * @return true, else false.
 */
function weeksAreEqual(week1: number, week2: number): boolean {
  return week1 == week2;
}

/**
 * If two months @param month1 and @param month2 are equal,
 * @return true, else false.
 */
function monthsAreEqual(month1: number, month2: number): boolean {
  return month1 == month2;
}

/**
 * If two months @param year1 and @param year2 are equal,
 * @return true, else false.
 */
function yearsAreEqual(year1: number, year2: number): boolean {
  return year1 == year2;
}

/**
 * Calculates sprintSpread, sprintSpreadSum and sprints for
 * @param dates, based on the precalculated weeks in weekSpread.
 * Therefor, if a week and its successor week are a sprint,
 * the week spreads of the single weeks are being merged
 * and the start week number builds the new entry in sprintSpread object.
 * @returns DevSpreadDates for a developer,
 * with all sprint related values being calculated.
 */
function calculateSprintsByWeeks(dates: DevSpreadDates): DevSpreadDates {
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

/**
 * If two weeks @param week1 and @param week2 are sprints,
 * i.e. if they are a sequence,
 * @return true, else false.
 */
function datesAreSprint(week1: number, week2: number): boolean {
  return Math.abs(week1 - week2) == 1;
}

/**
 * For a given string @param date, @return the correct month index
 * as a number
 */
function getMonthNumber(date: string): number {
  return new Date(date).getMonth() + 1;
}

/**
 * For a given string @param date, @return the full year
 * as a number
 */
function getYear(date: string): number {
  return new Date(date).getFullYear();
}

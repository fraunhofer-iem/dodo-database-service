import { Intervals } from '.';

export function serialize(
  result: {
    avg: number;
    data: {
      _id: {
        year: number | undefined;
        month: number | undefined;
        week: number | undefined;
        day: number | undefined;
      };
      avg: number;
      data: any[];
    }[];
  },
  interval: Intervals,
  dataName?: string,
) {
  if (!result) {
    throw new Error('Could not calculate: no data in selected time frame');
  }
  const ret = {};
  for (const dataPoint of result.data) {
    const { _id, avg, data } = dataPoint;
    const { year, ...intervals } = _id;
    if (!ret[year]) {
      ret[year] = {};
    }
    ret[year][intervals[interval]] = {
      avg: avg,
    };
    if (dataName) {
      ret[year][intervals[interval]][dataName] = data;
    }
  }
  return { avg: result.avg, data: ret };
}

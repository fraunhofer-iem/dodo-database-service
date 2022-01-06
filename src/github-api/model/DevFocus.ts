export interface DevSpread {
  [key: string]: DevSpreadDates;
}

export interface DevSpreadDates {
  daySpread: { [key: string]: string[] };
  weekSpread: { [key: string]: string[] };
  sprintSpread: { [key: string]: string[] };
  monthSpread: { [key: string]: string[] };
  daySpreadSum: number;
  weekSpreadSum: number;
  sprintSpreadSum: number;
  monthSpreadSum: number;
  days: number;
  weeks: number;
  sprints: number;
  months: number;
}

export interface DevSpreadAvg {
  [key: string]: {
    daySpread: number;
    weekSpread: number;
    sprintSpread: number;
    monthSpread: number;
    days: number;
    weeks: number;
    sprints: number;
    months: number;
  };
}

export interface DevSpreadTotal {
  daySpread: number;
  weekSpread: number;
  sprintSpread: number;
  monthSpread: number;
  days: number;
  weeks: number;
  sprints: number;
  months: number;
}

export interface RepoSpread {
  daySpread: { [key: string]: { [key: string]: number } };
  weekSpread: { [key: string]: { [key: string]: number } };
  sprintSpread: { [key: string]: { [key: string]: number } };
  monthSpread: { [key: string]: { [key: string]: number } };
  days: number;
  weeks: number;
  sprints: number;
  months: number;
}

export interface RepoSpreadAvg {
  daySpread: number;
  weekSpread: number;
  sprintSpread: number;
  monthSpread: number;
}

export interface RepoSpreadTotal {
  daySpread: { [key: string]: number };
  weekSpread: { [key: string]: number };
  sprintSpread: { [key: string]: number };
  monthSpread: { [key: string]: number };
}

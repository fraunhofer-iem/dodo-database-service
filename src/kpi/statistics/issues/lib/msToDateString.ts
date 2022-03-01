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

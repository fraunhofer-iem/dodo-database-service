// first index is a string of all coupled files, separated by whitespace
// second index is an object with number of occurences and a string array with related PR object ids.
export interface coupling {
  [index: number]: string | { occs: number; pullrequests: string[] };
}

export function transformMapToObject(map: Map<any, unknown>) {
  const json = {};
  map.forEach((value, key) => {
    json[key] = value;
  });
  return json;
}

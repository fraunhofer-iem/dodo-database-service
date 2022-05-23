export function transformMapToObject(
  map: Map<any, unknown>,
  transformator: (value: unknown) => any = (value) => value,
) {
  const json = {};
  map.forEach((value, key) => {
    json[key] = transformator(value);
  });
  return json;
}

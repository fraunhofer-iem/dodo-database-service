export function transformMapToObject(
    map: Map<any, Object>
  ) {
    const json = {};
    map.forEach((value, key) => {
      json[key] = value;
    });
    return json;
  }
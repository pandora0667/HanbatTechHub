export function appendRedisKey(
  prefix: string,
  suffix: string | number,
): string {
  return `${prefix}${suffix}`;
}

export function joinRedisKeySegments(
  ...segments: Array<string | undefined | null>
): string {
  return segments.filter((segment): segment is string => Boolean(segment)).join(':');
}

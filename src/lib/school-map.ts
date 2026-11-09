export function hasSchoolCoordinates(school: {
  latitude: number | null;
  longitude: number | null;
}): school is { latitude: number; longitude: number } {
  return (
    school.latitude !== null &&
    school.longitude !== null &&
    Number.isFinite(school.latitude) &&
    Number.isFinite(school.longitude) &&
    Math.abs(school.latitude) <= 90 &&
    Math.abs(school.longitude) <= 180
  );
}
export function distanceKm(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
) {
  const rad = (value: number) => (value * Math.PI) / 180;
  const dlat = rad(b.latitude - a.latitude);
  const dlon = rad(b.longitude - a.longitude);
  const h =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dlon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)));
}

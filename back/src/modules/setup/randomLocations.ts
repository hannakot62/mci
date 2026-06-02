/** Sensible warehouse/port legs for a single truck load demo */
const ROUTE_CODES: Array<[string, string]> = [
  ['AMS', 'RTM'],
  ['AMS', 'HAM'],
  ['BER', 'RTM'],
  ['BER', 'HAM'],
  ['AMS', 'BER'],
];

export type LocationRef = { id: string; code: string };

export function pickRandomRoute(
  locations: LocationRef[],
  rng: () => number = Math.random
): { firstLocationId: string; lastLocationId: string; firstCode: string; lastCode: string } {
  const byCode = new Map(locations.map((l) => [l.code, l.id]));
  const [fromCode, toCode] = ROUTE_CODES[Math.floor(rng() * ROUTE_CODES.length)];
  const firstId = byCode.get(fromCode) ?? locations[0].id;
  const lastId = byCode.get(toCode) ?? locations[Math.min(1, locations.length - 1)].id;
  const firstCode = locations.find((l) => l.id === firstId)?.code ?? fromCode;
  const lastCode = locations.find((l) => l.id === lastId)?.code ?? toCode;
  return { firstLocationId: firstId, lastLocationId: lastId, firstCode, lastCode };
}

/** Occasionally breaks location consistency inside a product subtree (MCI demo). */
export function maybeAlternateRoute(
  base: { firstLocationId: string; lastLocationId: string },
  locations: LocationRef[],
  rng: () => number = Math.random
): { firstLocationId: string; lastLocationId: string } {
  if (rng() > 0.12) return base;
  const alt = pickRandomRoute(locations, rng);
  return { firstLocationId: alt.firstLocationId, lastLocationId: alt.lastLocationId };
}

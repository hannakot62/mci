/**
 * Runs `createMany` in chunks to stay within SQLite parameter limits and avoid O(n) round-trips.
 */
export function chunk<T>(items: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let offset = 0; offset < items.length; offset += batchSize) {
    batches.push(items.slice(offset, offset + batchSize));
  }
  return batches;
}

export async function createManyInBatches<T>(
  items: T[],
  batchSize: number,
  insert: (batch: T[]) => Promise<{ count: number }>
): Promise<number> {
  let inserted = 0;
  for (let offset = 0; offset < items.length; offset += batchSize) {
    const batch = items.slice(offset, offset + batchSize);
    const result = await insert(batch);
    inserted += result.count;
  }
  return inserted;
}

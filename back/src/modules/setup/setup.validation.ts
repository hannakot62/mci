import { SETUP_MAX_PACKAGING_UNITS } from '../../shared/constants/limits';
import type { ProductGroupConfig } from './setup.types';

/** Estimated packaging nodes for one product group (roots + all nested children). */
export function estimatePackagingCount(group: ProductGroupConfig): number {
  const roots = Math.max(1, group.rootPackagingCount ?? 1);
  let total = roots;
  let atLevel = roots;

  for (const level of group.nestingLevels ?? []) {
    if (level.childCount <= 0) break;
    atLevel *= level.childCount;
    if (!Number.isFinite(atLevel)) {
      return SETUP_MAX_PACKAGING_UNITS + 1;
    }
    total += atLevel;
    if (total > SETUP_MAX_PACKAGING_UNITS) {
      return total;
    }
  }

  return total;
}

export function validateSetupProductGroups(groups: ProductGroupConfig[]): string | null {
  let totalPackaging = 0;

  for (let i = 0; i < groups.length; i++) {
    const estimate = estimatePackagingCount(groups[i]);
    totalPackaging += estimate;

    if (estimate > SETUP_MAX_PACKAGING_UNITS) {
      return (
        `Product ${i + 1}: ~${estimate.toLocaleString('en-US')} packaging units exceeds the ` +
        `${SETUP_MAX_PACKAGING_UNITS.toLocaleString('en-US')} limit. Reduce root units, child counts, or nesting depth.`
      );
    }
  }

  if (totalPackaging > SETUP_MAX_PACKAGING_UNITS) {
    return (
      `Total packaging (~${totalPackaging.toLocaleString('en-US')}) exceeds the ` +
      `${SETUP_MAX_PACKAGING_UNITS.toLocaleString('en-US')} limit.`
    );
  }

  return null;
}

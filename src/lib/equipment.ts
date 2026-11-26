import { EQUIPMENT_IDS, type EquipmentId } from '../content/schema';

/**
 * Equipment assumed until the user sets their own "My club has…" checklist (Phase 3):
 * everything in a typical Basic-Fit club, minus the bring-your-own band and the dowel
 * that many clubs don't have.
 */
export const DEFAULT_EQUIPMENT: readonly EquipmentId[] = EQUIPMENT_IDS.filter(
  (e) => e !== 'band' && e !== 'dowel',
);

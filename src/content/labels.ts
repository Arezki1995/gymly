import type { Area, EquipmentId, ExerciseType, Goal } from './schema';

export const EQUIPMENT_LABELS: Record<EquipmentId, string> = {
  none: 'Bodyweight only',
  mat: 'Exercise mat',
  foam_roller: 'Foam roller',
  dumbbell: 'Dumbbells',
  kettlebell: 'Kettlebell',
  cable: 'Cable station',
  bench: 'Bench',
  box: 'Plyo box / step',
  pullup_bar: 'Pull-up bar',
  wall: 'Wall',
  band: 'Resistance band (bring your own)',
  dowel: 'Light bar / dowel',
};

export const AREA_LABELS: Record<Area, string> = {
  shoulder: 'Shoulder',
  hip: 'Hip',
  thoracic: 'Upper back',
  ankle: 'Ankle',
  'full-body': 'Full body',
};

export const GOAL_LABELS: Record<Goal, string> = {
  'shoulder-er': 'Shoulder external rotation',
  'shoulder-ir': 'Shoulder internal rotation',
  'shoulder-flexion': 'Overhead reach',
  'scapular-control': 'Shoulder-blade control',
  'thoracic-rotation': 'Upper-back rotation',
  'thoracic-extension': 'Upper-back extension',
  'hip-er': 'Hip external rotation',
  'hip-ir': 'Hip internal rotation',
  'hip-flexion': 'Deep squat / hip flexion',
  'hip-extension': 'Hip extension',
  'hip-adduction': 'Adductors',
  'ankle-dorsiflexion': 'Ankle dorsiflexion',
  'joint-health': 'Joint health',
};

export const TYPE_LABELS: Record<ExerciseType, string> = {
  stretch: 'Stretch',
  'active-mobility': 'Active mobility',
  'strength-mobility': 'Strength mobility',
  cars: 'CARs',
  'soft-tissue': 'Soft tissue',
};

export const LEVEL_LABELS: Record<1 | 2 | 3, string> = {
  1: 'Beginner',
  2: 'Intermediate',
  3: 'Advanced',
};

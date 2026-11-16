import { Sex } from './types';

export interface LabTest {
  key: string;
  name: string;
  unit: string;
  panel: string;
  low?: number;
  high?: number;
  /** Sex-specific overrides of low/high. */
  female?: { low?: number; high?: number };
  male?: { low?: number; high?: number };
}

/**
 * Common adult reference ranges (approximate). Labs use different methods and units,
 * so the report's own range always wins — these only drive the high/low flags.
 */
export const LAB_TESTS: LabTest[] = [
  { key: 'fbs', name: 'Fasting blood sugar', unit: 'mg/dL', panel: 'Diabetes', low: 70, high: 99 },
  { key: 'ppbs', name: 'Post-meal blood sugar (2h)', unit: 'mg/dL', panel: 'Diabetes', low: 70, high: 140 },
  { key: 'hba1c', name: 'HbA1c', unit: '%', panel: 'Diabetes', low: 4, high: 5.6 },

  { key: 'chol', name: 'Total cholesterol', unit: 'mg/dL', panel: 'Lipid profile', high: 200 },
  { key: 'ldl', name: 'LDL cholesterol', unit: 'mg/dL', panel: 'Lipid profile', high: 100 },
  { key: 'hdl', name: 'HDL cholesterol', unit: 'mg/dL', panel: 'Lipid profile', male: { low: 40 }, female: { low: 50 } },
  { key: 'tg', name: 'Triglycerides', unit: 'mg/dL', panel: 'Lipid profile', high: 150 },
  { key: 'vldl', name: 'VLDL', unit: 'mg/dL', panel: 'Lipid profile', low: 2, high: 30 },

  { key: 'hb', name: 'Haemoglobin', unit: 'g/dL', panel: 'Blood count (CBC)', male: { low: 13.5, high: 17.5 }, female: { low: 12, high: 15.5 } },
  { key: 'wbc', name: 'WBC count', unit: '×10³/µL', panel: 'Blood count (CBC)', low: 4, high: 11 },
  { key: 'rbc', name: 'RBC count', unit: '×10⁶/µL', panel: 'Blood count (CBC)', male: { low: 4.5, high: 5.9 }, female: { low: 4.1, high: 5.1 } },
  { key: 'plt', name: 'Platelets', unit: '×10³/µL', panel: 'Blood count (CBC)', low: 150, high: 450 },
  { key: 'pcv', name: 'Haematocrit (PCV)', unit: '%', panel: 'Blood count (CBC)', male: { low: 41, high: 53 }, female: { low: 36, high: 46 } },
  { key: 'esr', name: 'ESR', unit: 'mm/hr', panel: 'Blood count (CBC)', male: { high: 15 }, female: { high: 20 } },

  { key: 'tsh', name: 'TSH', unit: 'mIU/L', panel: 'Thyroid', low: 0.4, high: 4.0 },
  { key: 'ft3', name: 'Free T3', unit: 'pg/mL', panel: 'Thyroid', low: 2.3, high: 4.2 },
  { key: 'ft4', name: 'Free T4', unit: 'ng/dL', panel: 'Thyroid', low: 0.8, high: 1.8 },
  { key: 'antitpo', name: 'Anti-TPO antibodies', unit: 'IU/mL', panel: 'Thyroid', high: 35 },

  { key: 'ast', name: 'SGOT / AST', unit: 'U/L', panel: 'Liver (LFT)', low: 10, high: 40 },
  { key: 'alt', name: 'SGPT / ALT', unit: 'U/L', panel: 'Liver (LFT)', low: 7, high: 56 },
  { key: 'alp', name: 'Alkaline phosphatase', unit: 'U/L', panel: 'Liver (LFT)', low: 44, high: 147 },
  { key: 'bili', name: 'Total bilirubin', unit: 'mg/dL', panel: 'Liver (LFT)', low: 0.1, high: 1.2 },
  { key: 'alb', name: 'Albumin', unit: 'g/dL', panel: 'Liver (LFT)', low: 3.5, high: 5.0 },
  { key: 'ggt', name: 'GGT', unit: 'U/L', panel: 'Liver (LFT)', male: { high: 61 }, female: { high: 36 } },

  { key: 'creat', name: 'Creatinine', unit: 'mg/dL', panel: 'Kidney (KFT)', male: { low: 0.7, high: 1.3 }, female: { low: 0.6, high: 1.1 } },
  { key: 'urea', name: 'Blood urea', unit: 'mg/dL', panel: 'Kidney (KFT)', low: 15, high: 40 },
  { key: 'uric', name: 'Uric acid', unit: 'mg/dL', panel: 'Kidney (KFT)', male: { low: 3.4, high: 7.0 }, female: { low: 2.4, high: 6.0 } },
  { key: 'egfr', name: 'eGFR', unit: 'mL/min/1.73m²', panel: 'Kidney (KFT)', low: 90 },
  { key: 'na', name: 'Sodium', unit: 'mmol/L', panel: 'Kidney (KFT)', low: 135, high: 145 },
  { key: 'k', name: 'Potassium', unit: 'mmol/L', panel: 'Kidney (KFT)', low: 3.5, high: 5.1 },

  { key: 'vitd', name: 'Vitamin D (25-OH)', unit: 'ng/mL', panel: 'Vitamins & iron', low: 30, high: 100 },
  { key: 'b12', name: 'Vitamin B12', unit: 'pg/mL', panel: 'Vitamins & iron', low: 200, high: 900 },
  { key: 'ferritin', name: 'Ferritin', unit: 'ng/mL', panel: 'Vitamins & iron', male: { low: 24, high: 336 }, female: { low: 11, high: 307 } },
  { key: 'iron', name: 'Serum iron', unit: 'µg/dL', panel: 'Vitamins & iron', low: 60, high: 170 },
  { key: 'calcium', name: 'Calcium', unit: 'mg/dL', panel: 'Vitamins & iron', low: 8.5, high: 10.5 },

  { key: 'lh', name: 'LH', unit: 'mIU/mL', panel: 'Hormones / PCOS', female: { low: 1.9, high: 12.5 } },
  { key: 'fsh', name: 'FSH', unit: 'mIU/mL', panel: 'Hormones / PCOS', female: { low: 2.5, high: 10.2 } },
  { key: 'testo', name: 'Testosterone (total)', unit: 'ng/dL', panel: 'Hormones / PCOS', female: { low: 15, high: 70 }, male: { low: 300, high: 1000 } },
  { key: 'prl', name: 'Prolactin', unit: 'ng/mL', panel: 'Hormones / PCOS', female: { low: 4.8, high: 23.3 }, male: { low: 4, high: 15.2 } },
  { key: 'amh', name: 'AMH', unit: 'ng/mL', panel: 'Hormones / PCOS', female: { low: 1, high: 4 } },
  { key: 'insulin', name: 'Fasting insulin', unit: 'µIU/mL', panel: 'Hormones / PCOS', low: 2, high: 25 },

  { key: 'crp', name: 'CRP', unit: 'mg/L', panel: 'Other', high: 5 },
  { key: 'psa', name: 'PSA', unit: 'ng/mL', panel: 'Other', male: { high: 4 } },
];

export const PANELS = [...new Set(LAB_TESTS.map((t) => t.panel))];
export const testByKey = Object.fromEntries(LAB_TESTS.map((t) => [t.key, t])) as Record<string, LabTest>;

export const rangeFor = (t: LabTest, sex: Sex) => {
  const o = sex === 'female' ? t.female : sex === 'male' ? t.male : undefined;
  return { low: o?.low ?? t.low ?? t.female?.low, high: o?.high ?? t.high ?? t.female?.high };
};

export type Flag = 'low' | 'normal' | 'high' | 'unknown';
export const flagFor = (key: string, value: number, sex: Sex): Flag => {
  const t = testByKey[key];
  if (!t) return 'unknown';
  const { low, high } = rangeFor(t, sex);
  if (low != null && value < low) return 'low';
  if (high != null && value > high) return 'high';
  return low == null && high == null ? 'unknown' : 'normal';
};

export const rangeText = (t: LabTest, sex: Sex) => {
  const { low, high } = rangeFor(t, sex);
  if (low != null && high != null) return `${low}–${high}`;
  if (high != null) return `< ${high}`;
  if (low != null) return `> ${low}`;
  return '—';
};

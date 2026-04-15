export type DiagnosisCodeConfidence = "high" | "medium" | "low";

export type DiagnosisCode = {
  code: string;
  description: string;
  confidence: DiagnosisCodeConfidence;
};

export type EMCode = {
  code: string;
  description: string;
  rationale: string;
};

export type SoapNote = {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  /**
   * AI-suggested ICD-10-CM codes for diagnoses documented in the Assessment.
   * Optional — Claude omits when no diagnosis is clear from the transcript.
   */
  diagnosis_codes?: DiagnosisCode[];
  /**
   * AI-suggested evaluation/management CPT code (outpatient E/M only).
   * Optional — Claude omits when visit type is unclear.
   */
  billing_code?: EMCode;
};

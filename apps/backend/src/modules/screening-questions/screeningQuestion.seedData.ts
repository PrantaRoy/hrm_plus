export interface ScreeningQuestionSeed {
  code: string;
  text: string;
  type: "YES_NO" | "SINGLE_CHOICE" | "MULTIPLE_CHOICE" | "SHORT_TEXT";
  options?: string[];
  category: "LegalCompliance" | "Custom";
}

// NZ/AU legally-compliant pre-screening questions. Phrasing follows the standard
// disclosure conventions used under the NZ Criminal Records (Clean Slate) Act 2004
// and NZ/AU right-to-work legislation — candidates with a Clean Slate-eligible
// conviction may lawfully answer "No" to the criminal record question.
export const SCREENING_QUESTION_SEEDS: ScreeningQuestionSeed[] = [
  {
    code: "NZ_CRIMINAL_RECORD_CLEAN_SLATE",
    text:
      "Under the Criminal Records (Clean Slate) Act 2004, do you have any convictions that you are required to disclose for this role? " +
      "(If you have a conviction that qualifies for a clean slate under the Act, you are entitled to answer \"No\" to this question.)",
    type: "YES_NO",
    category: "LegalCompliance",
  },
  {
    code: "NZ_RIGHT_TO_WORK",
    text: "Are you a New Zealand citizen or permanent resident, or do you otherwise hold the legal right to work in New Zealand?",
    type: "YES_NO",
    category: "LegalCompliance",
  },
  {
    code: "NZ_WORK_VISA_DETAILS",
    text:
      "If you hold a visa granting you the right to work in New Zealand, please state the visa type and its expiry date. " +
      "(Leave blank if not applicable.)",
    type: "SHORT_TEXT",
    category: "LegalCompliance",
  },
  {
    code: "AU_RIGHT_TO_WORK",
    text: "Are you an Australian citizen or permanent resident, or do you otherwise hold the legal right to work in Australia?",
    type: "YES_NO",
    category: "LegalCompliance",
  },
  {
    code: "AU_CRIMINAL_RECORD_DISCLOSURE",
    text: "Do you have any criminal convictions that are required to be disclosed for this role under applicable Australian law?",
    type: "YES_NO",
    category: "LegalCompliance",
  },
  {
    code: "GENERIC_AGE_CONFIRMATION",
    text: "Are you at least 18 years of age?",
    type: "YES_NO",
    category: "LegalCompliance",
  },
];

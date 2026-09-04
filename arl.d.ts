export interface RiskClassification {
  risk: string;
  ciiu: string;
  /** Original code as published in Decreto 768 de 2022, when it differs from the official CIIU Rev. 4 A.C. clase code */
  decreeCiiu?: string;
  code: string;
  description: string;
}

export declare const riskClassification: RiskClassification[];
export declare function getRiskClassification(ciiu: string): RiskClassification[];

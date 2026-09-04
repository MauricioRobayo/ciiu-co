import data from "./risk-classification.json" with { type: "json" };

export const riskClassification = data;

export function getRiskClassification(ciiu) {
  return data.filter((row) => row.ciiu === ciiu);
}

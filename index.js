import dict from "./ciiu-dict.json" with { type: "json" };
import tree from "./ciiu-tree.json" with { type: "json" };

export { riskClassification, getRiskClassification } from "./arl.js";

export const ciiuDict = dict;
export const ciiuTree = tree;

export function isCiiuCode(code) {
  return Object.hasOwn(dict, code);
}

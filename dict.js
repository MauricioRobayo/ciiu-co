import dict from "./ciiu-dict.json" with { type: "json" };

export const ciiuDict = dict;

export function isCiiuCode(code) {
  return Object.hasOwn(dict, code);
}

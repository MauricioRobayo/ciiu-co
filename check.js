// Integrity check for the committed data files. Run via `npm run check`
// after editing ciiu-dict.json / ciiu-tree.json / risk-classification.json
// by hand, before publishing.
import { readFile } from "node:fs/promises";
import path from "node:path";

async function readText(file) {
  return readFile(path.join(import.meta.dirname, file), "utf8");
}

// JSON.parse reorders integer-like keys numerically, so the source order of
// the dict must be read from the raw text
async function readOrderedDict() {
  const text = await readText("ciiu-dict.json");
  const dict = JSON.parse(text);
  const orderedKeys = [...text.matchAll(/^  "(\d{4})": /gm)].map(([, k]) => k);
  assert(
    orderedKeys.length === Object.keys(dict).length &&
      [...orderedKeys].sort().join() === Object.keys(dict).sort().join(),
    "could not recover dict key order from the file text",
  );
  return { dict, orderedKeys };
}

function collectLeaves(nodes, result = new Map()) {
  for (const node of nodes) {
    if (node.children?.length) {
      collectLeaves(node.children, result);
    } else {
      result.set(node.code, node.description);
    }
  }
  return result;
}

function assert(condition, message) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function validate(dict, orderedKeys, tree) {
  assert(
    orderedKeys.every((c) => /^\d{4}$/.test(c)),
    "dict contains non 4-digit keys",
  );
  assert(orderedKeys.length === 502, `expected 502 dict entries, got ${orderedKeys.length}`);
  assert(
    orderedKeys.join() === [...orderedKeys].sort().join(),
    "source dict keys are not in lexicographic order",
  );

  assert(tree.length === 21, `expected 21 top-level sections, got ${tree.length}`);
  assert(
    tree.map((s) => s.code).join("") === "ABCDEFGHIJKLMNOPQRSTU",
    "section codes are not exactly A through U",
  );

  const leaves = collectLeaves(tree);
  assert(
    leaves.size === orderedKeys.length,
    `tree leaves (${leaves.size}) do not match dict size (${orderedKeys.length})`,
  );
  for (const [code, description] of leaves) {
    assert(dict[code] === description, `description mismatch for ${code}`);
  }
}

// CIIU Rev. 4 A.C. classes that Decreto 768 de 2022 does not classify
// (verified against the full published table). Adding a code here is a data
// decision; removing one means the dataset must cover it.
const UNCOVERED_CLASSES = new Set(["6515", "6523", "9810", "9820"]);

function validateRisk(dict, risk) {
  assert(risk.length === 1123, `expected 1123 risk rows, got ${risk.length}`);

  const covered = new Set();
  for (const [i, row] of risk.entries()) {
    const at = `risk row ${i} (${row.ciiu}/${row.code})`;
    assert(["1", "2", "3", "4", "5"].includes(row.risk), `${at}: invalid risk ${row.risk}`);
    assert(/^\d{4}$/.test(row.ciiu), `${at}: ciiu is not a 4-digit code`);
    assert(row.ciiu in dict, `${at}: ciiu ${row.ciiu} is not an official clase code`);
    assert(typeof row.code === "string" && row.code !== "", `${at}: missing activity code`);
    assert(typeof row.description === "string" && row.description !== "", `${at}: missing description`);
    if (row.decreeCiiu !== undefined) {
      assert(/^\d{4}$/.test(row.decreeCiiu), `${at}: decreeCiiu is not a 4-digit code`);
      assert(row.decreeCiiu !== row.ciiu, `${at}: decreeCiiu equals ciiu`);
      assert(!(row.decreeCiiu in dict), `${at}: decreeCiiu ${row.decreeCiiu} is a valid clase and should not need correcting`);
    }
    covered.add(row.ciiu);
  }

  for (let i = 1; i < risk.length; i++) {
    assert(
      risk[i - 1].ciiu.localeCompare(risk[i].ciiu) <= 0,
      `risk rows are not sorted by ciiu (row ${i})`,
    );
  }

  const uncovered = Object.keys(dict).filter((c) => !covered.has(c));
  assert(
    uncovered.join() === [...UNCOVERED_CLASSES].sort().join(),
    `unexpected uncovered classes: ${uncovered.join(", ")}`,
  );
}

async function main() {
  const [{ dict, orderedKeys }, treeText, riskText] = await Promise.all([
    readOrderedDict(),
    readText("ciiu-tree.json"),
    readText("risk-classification.json"),
  ]);
  const tree = JSON.parse(treeText);
  const risk = JSON.parse(riskText);

  validate(dict, orderedKeys, tree);
  validateRisk(dict, risk);

  console.log(
    `OK: ciiu-dict.json (${orderedKeys.length} codes), ciiu-tree.json (${tree.length} sections), risk-classification.json (${risk.length} rows covering ${coveredCount(risk)} codes) are consistent`,
  );
}

function coveredCount(risk) {
  return new Set(risk.map((r) => r.ciiu)).size;
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

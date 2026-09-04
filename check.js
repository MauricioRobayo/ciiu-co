// Integrity check for the committed data files. Run via `npm run check`
// after editing ciiu-dict.json / ciiu-tree.json by hand, before publishing.
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

async function main() {
  const [{ dict, orderedKeys }, treeText] = await Promise.all([
    readOrderedDict(),
    readText("ciiu-tree.json"),
  ]);
  const tree = JSON.parse(treeText);

  validate(dict, orderedKeys, tree);

  console.log(
    `OK: ciiu-dict.json (${orderedKeys.length} codes) and ciiu-tree.json (${tree.length} sections) are consistent`,
  );
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

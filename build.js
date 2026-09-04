import { writeFile } from "node:fs/promises";
import path from "node:path";

const BASE_URL = process.env.CIIU_BASE_URL || "https://www.ciiu.co/api";
const MAX_ATTEMPTS = 5;

async function fetchText(url) {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return await res.text();
    } catch (err) {
      if (attempt === MAX_ATTEMPTS) {
        throw new Error(
          `Failed to fetch ${url} after ${MAX_ATTEMPTS} attempts: ${err.message}`,
        );
      }
      const delay = 2 ** (attempt - 1) * 1000;
      console.warn(
        `Retry ${attempt}/${MAX_ATTEMPTS - 1} for ${url} in ${delay}ms (${err.message})`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// JSON.parse reorders integer-like keys numerically, so the source order of
// the dict must be read from the raw text and preserved during serialization
function parseOrderedDict(text) {
  const dict = JSON.parse(text);
  const orderedKeys = [...text.matchAll(/^  "(\d{4})": /gm)].map(([, k]) => k);
  assert(
    orderedKeys.length === Object.keys(dict).length &&
      [...orderedKeys].sort().join() === Object.keys(dict).sort().join(),
    "could not recover dict key order from the response text",
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
  const [dictText, treeText] = await Promise.all([
    fetchText(`${BASE_URL}/ciiu-dict.json`),
    fetchText(`${BASE_URL}/ciiu-tree.json`),
  ]);

  const { dict, orderedKeys } = parseOrderedDict(dictText);
  const tree = JSON.parse(treeText);

  validate(dict, orderedKeys, tree);

  const dictBody = orderedKeys
    .map((code) => `  ${JSON.stringify(code)}: ${JSON.stringify(dict[code])}`)
    .join(",\n");

  await Promise.all([
    writeFile(
      path.join(import.meta.dirname, "ciiu-dict.json"),
      `{\n${dictBody}\n}\n`,
    ),
    writeFile(
      path.join(import.meta.dirname, "ciiu-tree.json"),
      `${JSON.stringify(tree, null, 2)}\n`,
    ),
  ]);

  console.log(
    `Wrote ciiu-dict.json (${orderedKeys.length} codes) and ciiu-tree.json (${tree.length} sections) from ${BASE_URL}`,
  );
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});

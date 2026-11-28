import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test, type TestContext } from "node:test";
import {
  editSource,
  gameDay,
  git,
  readSpecial,
  SOURCE,
  update,
  type ItemData,
} from "./updateSocp.mts";

const day = 8690;
const items: ItemData[] = [
  "one",
  "two",
  "three",
  "four",
  "A Crimbo Carol, Ch. 1",
  "new reward",
].map((name, index) => ({
  id: index + 1,
  name,
  tradeable: true,
  ambiguous: false,
}));
const reward = items[5];
const data = {
  One: { min: 2501, max: 3000, items: ["one"] },
  Two: { min: 1501, max: 2500, items: ["two"] },
  Three: { min: 501, max: 1500, items: ["three"] },
  Four: { min: 101, max: 500, items: ["four"] },
  Five: { min: 10, max: 100, items: ["A Crimbo Carol, Ch. 1"] },
};
const source = `export const dailySpecials = ${JSON.stringify(data)};`;

test("calendar uses the 03:30 UTC rollover and rejects missing or malformed data", () => {
  assert.equal(gameDay(new Date("2026-11-26T03:29:59Z")), day - 1);
  assert.equal(gameDay(new Date("2026-11-26T03:30:00Z")), day);
  const entry = {
    key: "socp",
    value: '{"itemId":9285,"price":1974}',
    thresholdReached: true,
  };
  const payload = { dailies: { [day]: [entry] } };
  assert.deepEqual(readSpecial(payload, day), { itemId: 9285, price: 1974 });
  assert.throws(() => readSpecial(payload, day - 1), /No daily data/);
  for (const entries of [
    [],
    [entry, entry],
    [{ ...entry, thresholdReached: false }],
    [{ ...entry, value: "invalid json" }],
    [{ ...entry, value: '{"itemId":true,"price":1974}' }],
    [{ ...entry, value: '{"itemId":9285,"price":0}' }],
  ]) {
    assert.throws(() => readSpecial({ dailies: { [day]: entries } }, day));
  }
});

test("classifies every tier boundary and rejects out-of-range prices", async () => {
  for (const [price, tier] of [
    [10, "Five"],
    [100, "Five"],
    [101, "Four"],
    [500, "Four"],
    [501, "Three"],
    [1500, "Three"],
    [1501, "Two"],
    [2499, "Two"],
    [2500, "Two"],
    [2501, "One"],
    [3000, "One"],
  ] as const) {
    const edit = (await editSource(source, reward, price, day))!;
    assert.equal(edit.tier, tier);
    assert.equal(await editSource(edit.source, reward, price, day), null);
    assert.match(edit.source, /SoCP drop list updated 26 November 2026/);
  }
  for (const price of [9, 3001]) {
    await assert.rejects(
      editSource(source, reward, price, day),
      /exactly one tier/,
    );
  }
});

test("recognizes names containing commas and checks whole names", async () => {
  assert.equal(await editSource(source, items[4], 50, day), null);
  assert.equal(await editSource(source, items[1], 2500, day), null);
  const different = { ...reward, name: "on" };
  assert(await editSource(source, different, 1974, day));
});

test("serializes punctuation and disambiguates duplicate names", async () => {
  const special = { ...reward, name: "&quot;gift&quot;, `${literal}\\" };
  const edit = (await editSource(source, special, 1974, day))!;
  assert.equal(edit.name, '"gift", `${literal}\\');
  assert.equal(await editSource(edit.source, special, 1974, day), null);

  const ambiguous = { ...reward, name: "two", ambiguous: true };
  const ambiguousEdit = (await editSource(source, ambiguous, 1974, day))!;
  assert(ambiguousEdit.source.includes('"[6]two"'));
  assert.equal(
    await editSource(ambiguousEdit.source, ambiguous, 1974, day),
    null,
  );
});

async function repository(t: TestContext) {
  const directory = await mkdtemp(path.join(tmpdir(), "socp-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  const upstream = path.join(directory, "upstream");
  const repo = path.join(directory, "local");
  await mkdir(upstream);
  git(upstream, "init", "-b", "main");
  const configure = (directory: string) => {
    git(directory, "config", "user.name", "SoCP test");
    git(directory, "config", "user.email", "socp@example.invalid");
    git(directory, "config", "commit.gpgsign", "false");
    git(
      directory,
      "config",
      "core.hooksPath",
      path.join(directory, "no-hooks"),
    );
  };
  configure(upstream);
  await mkdir(path.dirname(path.join(upstream, SOURCE)), { recursive: true });
  await writeFile(path.join(upstream, SOURCE), source);
  git(upstream, "add", ".");
  git(upstream, "commit", "-m", "initial");
  git(directory, "clone", upstream, repo);
  configure(repo);
  return { upstream, repo };
}

test("local mode commits from freshly fetched main, preserves work, and never pushes", async (t) => {
  const { upstream, repo } = await repository(t);
  git(repo, "switch", "-c", "work-in-progress");
  await writeFile(path.join(repo, SOURCE), source + "// unfinished work\n");
  await writeFile(path.join(repo, "staged.txt"), "keep me\n");
  git(repo, "add", "staged.txt");
  const originalStatus = git(repo, "status", "--porcelain");
  await writeFile(path.join(upstream, "latest.txt"), "new main commit\n");
  git(upstream, "add", ".");
  git(upstream, "commit", "-m", "new main");
  const base = git(upstream, "rev-parse", "HEAD").trim();
  const special = { itemId: reward.id, price: 1974 };

  await update(repo, "origin", special, day, reward);
  assert.equal(git(repo, "rev-parse", "socp-6^").trim(), base);
  assert.equal(
    git(repo, "log", "-1", "--format=%s", "socp-6").trim(),
    "new socp item: new reward",
  );
  assert.equal(git(repo, "diff", "--name-only", base, "socp-6").trim(), SOURCE);
  assert.equal(
    git(repo, "branch", "--show-current").trim(),
    "work-in-progress",
  );
  assert.equal(git(repo, "status", "--porcelain"), originalStatus);
  assert.equal(git(upstream, "branch", "--list", "socp-6"), "");
  assert.equal(
    git(repo, "worktree", "list", "--porcelain").match(/^worktree /gm)?.length,
    1,
  );
  const commit = git(repo, "rev-parse", "socp-6");
  await update(repo, "origin", special, day, reward);
  assert.equal(git(repo, "rev-parse", "socp-6"), commit);
});

test("dry run, invalid items, untradeable items, and already included items create no branch", async (t) => {
  const { repo } = await repository(t);
  await update(
    repo,
    "origin",
    { itemId: reward.id, price: 1974 },
    day,
    reward,
    "dry-run",
  );
  await update(repo, "origin", { itemId: 2, price: 1974 }, day, items[1]);
  await update(repo, "origin", { itemId: reward.id, price: 1974 }, day, {
    ...reward,
    tradeable: false,
  });
  await assert.rejects(
    update(repo, "origin", { itemId: 999, price: 1974 }, day, null),
    /Unknown item ID/,
  );
  assert.equal(git(repo, "branch", "--list", "socp-*"), "");
  assert.equal(git(repo, "status", "--porcelain"), "");
});

test("workflow mode edits only a clean checkout of latest main and returns PR metadata", async (t) => {
  const { repo } = await repository(t);
  const special = { itemId: reward.id, price: 1974 };
  const output = await update(repo, "origin", special, day, reward, "write");
  assert.deepEqual(output, {
    item_id: 6,
    item_name: "new reward",
    price: 1974,
    tier: "Two",
    gameday: day,
  });
  assert.equal(git(repo, "branch", "--list", "socp-*"), "");
  assert.equal(
    await editSource(
      await readFile(path.join(repo, SOURCE), "utf8"),
      reward,
      1974,
      day,
    ),
    null,
  );
  await assert.rejects(
    update(repo, "origin", special, day, reward, "write"),
    /requires a clean/,
  );
});

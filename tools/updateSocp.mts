import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { appendFile, mkdtemp, rmdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { createClient, Item } from "data-of-loathing";
import { decodeHTML } from "entities";

export const SOURCE = "packages/garbo-lib/src/knuckleboneRewards.ts";

const EPOCH = Date.UTC(2003, 1, 10, 3, 30);
const DAY = 86_400_000;

export type ItemData = Pick<Item, "id" | "name" | "tradeable" | "ambiguous">;
type Special = { itemId: number; price: number };

export function gameDay(now = new Date()): number {
  return Math.floor((now.getTime() - EPOCH) / DAY);
}

export function readSpecial(payload: unknown, day: number): Special {
  const entries = (payload as { dailies?: Record<string, unknown> })?.dailies?.[
    day
  ];
  assert(Array.isArray(entries), `No daily data for KoL game day ${day}.`);

  const specials = entries.filter((entry) => entry?.key === "socp");
  assert.equal(
    specials.length,
    1,
    `Expected one SoCP record for game day ${day}.`,
  );

  const entry = specials[0];
  assert.equal(entry.thresholdReached, true, "SoCP data is unconfirmed.");
  assert.equal(typeof entry.value, "string", "Malformed SoCP value.");

  const special = JSON.parse(entry.value) as Special;
  for (const key of ["itemId", "price"] as const) {
    assert(
      Number.isSafeInteger(special?.[key]) && special[key] > 0,
      `Invalid SoCP ${key}.`,
    );
  }

  return special;
}

export async function editSource(
  source: string,
  item: ItemData,
  price: number,
  day: number,
) {
  // The data module has no imports or TypeScript syntax. Load the fetched main version.
  const module = await import(
    `data:text/javascript,${encodeURIComponent(source)}`
  );
  const rewards: Record<string, { min: number; max: number; items: string[] }> =
    structuredClone(module.dailySpecials);
  const name = decodeHTML(item.name);
  const itemName = item.ambiguous ? `[${item.id}]${name}` : name;

  if (Object.values(rewards).some(({ items }) => items.includes(itemName))) {
    return null;
  }

  const matches = Object.entries(rewards).filter(
    ([, { min, max }]) => price >= min && price <= max,
  );
  assert.equal(
    matches.length,
    1,
    `Price ${price} does not identify exactly one tier.`,
  );
  assert(name.trim() && !/[\x00-\x1f\x7f]/.test(name), "Invalid item name.");

  const [tier, reward] = matches[0];
  reward.items.push(itemName);

  const date = new Date(EPOCH + day * DAY).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return {
    source: `/** Reward data maintained by tools/updateSocp.mts. */
// SoCP drop list updated ${date}
export const dailySpecials = ${JSON.stringify(rewards, null, 2)};
`,
    tier,
    name,
  };
}

export function git(repo: string, ...args: string[]): string {
  return execFileSync("git", args, {
    cwd: repo,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

async function commitInWorktree(
  repo: string,
  base: string,
  branch: string,
  source: string,
  title: string,
) {
  const directory = await mkdtemp(path.join(tmpdir(), "garbo-socp-"));
  const worktree = path.join(directory, "checkout");

  try {
    git(repo, "worktree", "add", "-b", branch, worktree, base);
    await writeFile(path.join(worktree, SOURCE), source);
    git(worktree, "diff", "--check");
    git(worktree, "add", "--", SOURCE);
    git(worktree, "commit", "-m", title);
  } catch (error) {
    console.error(`Worktree retained for inspection: ${worktree}`);
    throw error;
  }

  git(repo, "worktree", "remove", worktree);
  await rmdir(directory);
}

export async function update(
  repo: string,
  remote: string,
  special: Special,
  day: number,
  item: ItemData | null,
  mode: "commit" | "write" | "dry-run" = "commit",
) {
  assert(
    item?.id === special.itemId,
    `Unknown item ID ${special.itemId} in data-of-loathing.`,
  );

  console.log(
    `Game day ${day}: ${decodeHTML(item.name)} (#${item.id}), ${special.price} knucklebones.`,
  );

  if (!item.tradeable) {
    console.log("Untradeable item; nothing to add.");
    return null;
  }

  assert(
    git(repo, "remote").split(/\r?\n/).includes(remote),
    `Unknown remote ${remote}.`,
  );
  git(
    repo,
    "fetch",
    "--no-tags",
    remote,
    `+refs/heads/main:refs/remotes/${remote}/main`,
  );

  const base = git(repo, "rev-parse", `refs/remotes/${remote}/main`).trim();
  const source = git(repo, "show", `${base}:${SOURCE}`);
  const edit = await editSource(source, item, special.price, day);

  if (!edit) {
    console.log("Already in main's SoCP valuations; nothing to add.");
    return null;
  }

  const branch = `socp-${item.id}`;
  const title = `new socp item: ${edit.name}`;

  if (mode === "dry-run") {
    console.log(
      `Would create ${branch} from ${base}, adding ${edit.name} to tier ${edit.tier}.`,
    );
    return null;
  }

  if (mode === "write") {
    assert.equal(
      git(repo, "rev-parse", "HEAD").trim(),
      base,
      "--write requires HEAD at the latest remote main.",
    );
    assert.equal(
      git(repo, "status", "--porcelain", "--", SOURCE).trim(),
      "",
      `--write requires a clean ${SOURCE}.`,
    );

    await writeFile(path.join(repo, SOURCE), edit.source);

    return {
      item_id: item.id,
      item_name: edit.name,
      price: special.price,
      tier: edit.tier,
      gameday: day,
    };
  }

  if (
    git(repo, "branch", "--list", branch).trim() ||
    git(repo, "ls-remote", "--heads", remote, `refs/heads/${branch}`).trim()
  ) {
    console.log(`Branch ${branch} already exists; leaving it unchanged.`);
    return null;
  }

  await commitInWorktree(repo, base, branch, edit.source, title);

  console.log(
    `Created ${branch}: ${title}\nReview: git show ${branch}\nPush when ready: git push ${remote} ${branch}`,
  );

  return null;
}

async function main() {
  const { values } = parseArgs({
    options: {
      remote: { type: "string", default: "origin" },
      date: { type: "string" },
      write: { type: "boolean", default: false },
      "dry-run": { type: "boolean", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
  });

  if (values.help) {
    console.log(
      "Usage: yarn updateSocp [--dry-run | --write] [--remote origin] [--date YYYY-MM-DD]\n" +
        "Default: commit on a new local branch. --write edits main for the PR workflow.\n" +
        "--date selects the UTC date of the KoL day's opening rollover (03:30 UTC).",
    );
    return;
  }

  assert(
    !(values.write && values["dry-run"]),
    "Choose either --write or --dry-run.",
  );

  const now = values.date ? new Date(`${values.date}T03:30:00Z`) : new Date();
  assert(
    Number.isFinite(now.getTime()) &&
      (!values.date || now.toISOString().slice(0, 10) === values.date),
    "Invalid --date.",
  );

  const day = gameDay(now);
  const response = await fetch(
    `https://calendar.loathers.net/api/calendar?from=${day}&to=${day}`,
    {
      signal: AbortSignal.timeout(30_000),
    },
  );
  assert(response.ok, `Calendar request failed: HTTP ${response.status}.`);
  const special = readSpecial(await response.json(), day);

  const client = createClient();
  await client.load();
  const item = await client.query.findOne(Item, { id: special.itemId });

  const repo = git(
    path.dirname(fileURLToPath(import.meta.url)),
    "rev-parse",
    "--show-toplevel",
  ).trim();
  const output = await update(
    repo,
    values.remote ?? "origin",
    special,
    day,
    item,
    values.write ? "write" : values["dry-run"] ? "dry-run" : "commit",
  );

  if (values.write && process.env.GITHUB_OUTPUT) {
    const outputs = { changed: output !== null, ...output };
    await appendFile(
      process.env.GITHUB_OUTPUT,
      Object.entries(outputs)
        .map(([key, value]) => `${key}=${value}\n`)
        .join(""),
    );
  }
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

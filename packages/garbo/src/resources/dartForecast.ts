import { cooldownUses, WandererSourceForecast } from "garbo-lib";
import { haveEffect } from "kolmafia";
import { $effect, $item, $skill, clamp, EverfullDarts, have } from "libram";
import { safeToAttemptBullseye } from "./everfullDarts";

type DartAndRunForecast = { darts: number; runs: number };

function expectedDartAttempts(
  turns: number,
  chance: number,
  cooldown: number,
): number {
  const cache = new Map<number, number>();
  const expected = (remaining: number): number => {
    if (remaining <= 0) return 0;

    const cached = cache.get(remaining);
    if (cached !== undefined) return cached;

    // Attempt once now, then wait for red on a hit or green on a miss.
    const attempts =
      1 +
      chance * expected(remaining - cooldown) +
      (1 - chance) * expected(remaining - 30);
    cache.set(remaining, attempts);
    return attempts;
  };

  return expected(turns);
}

function springRunsBeforeDarts(
  turns: number,
  redRemaining: number,
  greenRemaining: number,
): number {
  // Each spring run must clear its green cooldown before red expires.
  return clamp(
    Math.floor((redRemaining - greenRemaining) / 30),
    0,
    cooldownUses(turns, greenRemaining, 30),
  );
}

function forecastDartFishing(
  turns: number,
  bullseyeChance: number,
): DartAndRunForecast {
  const redRemaining = haveEffect($effect`Everything Looks Red`);
  const greenRemaining = haveEffect($effect`Everything Looks Green`);
  const darts = expectedDartAttempts(
    turns - Math.max(redRemaining, greenRemaining),
    bullseyeChance,
    EverfullDarts.bullseyeCooldown(),
  );

  // A hit leaves green available for one spring run during its red cooldown.
  return {
    darts,
    runs: have($item`spring shoes`)
      ? springRunsBeforeDarts(turns, redRemaining, greenRemaining) +
        darts * bullseyeChance
      : 0,
  };
}

function forecastDartsAndRuns(
  turns: number,
  bullseyeChance: number,
): DartAndRunForecast {
  if (bullseyeChance > 0 && bullseyeChance < 1) {
    return forecastDartFishing(turns, bullseyeChance);
  }

  // Without dart misses, spring runs are independent of the red cooldown.
  return {
    darts:
      bullseyeChance === 1
        ? cooldownUses(
            turns,
            haveEffect($effect`Everything Looks Red`),
            EverfullDarts.bullseyeCooldown(),
          )
        : 0,
    runs: have($item`spring shoes`)
      ? cooldownUses(turns, haveEffect($effect`Everything Looks Green`), 30)
      : 0,
  };
}

/**
 * Forecast Garbo's use of ELR and ELG together: Free-For-All first, then darts
 * with a green escape after misses, and spring runs that do not delay darts.
 * This assumes the current dart perks throughout the farming horizon.
 * @param turns Remaining turns in the farming horizon
 * @returns Bullseye, Free-For-All, and standalone spring-run supplies
 */
export function forecastGarboDartFishing(
  turns: number,
): WandererSourceForecast[] {
  const freeForAll = have($skill`Free-For-All`);
  const bullseyeChance = safeToAttemptBullseye()
    ? EverfullDarts.bullseyeChance()
    : 0;

  // Free-For-All takes precedence over darts.
  const { darts, runs } = forecastDartsAndRuns(
    turns,
    freeForAll ? 0 : bullseyeChance,
  );

  return [
    {
      name: "Free-For-All",
      type: "freefight",
      expectedFights: freeForAll
        ? cooldownUses(turns, haveEffect($effect`Everything Looks Red`), 25)
        : 0,
      winChance: 1,
    },
    {
      name: "Darts: Bullseye",
      type: "conditional freefight",
      expectedFights: darts,
      winChance: bullseyeChance,
    },
    {
      name: "Spring Shoes",
      type: "freerun",
      expectedFights: runs,
      winChance: 0,
    },
  ];
}

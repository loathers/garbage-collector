import { haveEffect, myLightning, totalTurnsPlayed } from "kolmafia";
import {
  $effect,
  $item,
  $items,
  $skill,
  clamp,
  EverfullDarts,
  get,
  getKramcoWandererChance,
  have,
  LegendarySealClubbingClub,
  SourceTerminal,
} from "libram";
import {
  cooldownUses,
  WandererForecasters,
  WandererSourceForecast,
} from "./forecasters";

/**
 * Forecast Digitize copies using libram unless the caller supplies its policy.
 * @param turns Remaining turns in the caller's farming horizon
 * @param estimate Callback estimating copies, including future casts
 * @returns Expected Digitize encounters
 */
export function forecastDigitize(
  turns: number,
  estimate: (
    turns: number,
  ) => number = SourceTerminal.digitizedMonstersRemainingForTurns,
): WandererSourceForecast[] {
  return [
    {
      name: "Digitize",
      type: "wanderer",
      expectedFights: estimate(turns),
      winChance: 1,
    },
  ];
}

function forecastVote(turns: number): WandererSourceForecast[] {
  const delay = (12 - (totalTurnsPlayed() % 11)) % 11;
  const next =
    delay === 0 && get("lastVoteMonsterTurn") >= totalTurnsPlayed()
      ? 11
      : delay;

  return [
    {
      name: "Vote",
      type: "wanderer",
      expectedFights: have($item`"I Voted!" sticker`)
        ? clamp(3 - get("_voteFreeFights"), 0, cooldownUses(turns, next, 11))
        : 0,
      winChance: 1,
    },
  ];
}

function forecastYellowCooldown(turns: number): WandererSourceForecast[] {
  const fondeluge = have($skill`Fondeluge`);

  return [
    {
      name: fondeluge ? "Fondeluge" : "Jurassic Parka",
      type: "yellow ray",
      expectedFights:
        fondeluge || have($item`Jurassic Parka`)
          ? cooldownUses(
              turns,
              haveEffect($effect`Everything Looks Yellow`),
              fondeluge ? 50 : 99,
            )
          : 0,
      winChance: 1,
    },
  ];
}

function forecastRedCooldown(turns: number): WandererSourceForecast[] {
  const freeForAll = have($skill`Free-For-All`);
  const guaranteedBullseye =
    EverfullDarts.have() && EverfullDarts.bullseyeChance() === 1;

  return [
    {
      name: freeForAll ? "Free-For-All" : "Darts: Bullseye",
      type: "freefight",
      expectedFights:
        freeForAll || guaranteedBullseye
          ? cooldownUses(
              turns,
              haveEffect($effect`Everything Looks Red`),
              freeForAll ? 25 : EverfullDarts.bullseyeCooldown(),
            )
          : 0,
      winChance: 1,
    },
  ];
}

function forecastGreenCooldown(turns: number): WandererSourceForecast[] {
  const springShoes = have($item`spring shoes`);

  return [
    {
      name: springShoes ? "Spring Shoes" : "Green Candle",
      type: "freerun",
      expectedFights:
        springShoes || have($item`Roman Candelabra`)
          ? cooldownUses(turns, haveEffect($effect`Everything Looks Green`), 30)
          : 0,
      winChance: 0,
    },
  ];
}

function forecastClubNextWeek(turns: number): WandererSourceForecast[] {
  const pending = LegendarySealClubbingClub.clubIntoNextWeekMonster() !== null;

  // Assume the first cast happens now and each copy is clubbed again on arrival.
  // The eight-adventure delay includes the combat in which the skill is cast.
  const first = pending
    ? LegendarySealClubbingClub.turnsUntilNextWeekFight()
    : 8;

  return [
    {
      name: "Club 'Em Into Next Week",
      type: "wanderer",
      expectedFights: clamp(
        LegendarySealClubbingClub.clubIntoNextWeekAvailable() + Number(pending),
        0,
        cooldownUses(turns, first, 8),
      ),
      winChance: 1,
    },
  ];
}

/**
 * Standalone defaults, evaluated against game state when forecast() is called.
 * Red uses Free-For-All or guaranteed bullseyes; uncertain darts need a caller
 * policy. Green uses spring shoes or the green candle independently of red.
 * Yellow prefers Fondeluge to parka acid. The glass assumes it will be charged.
 * Resource names identify budgets that can be jointly overridden, not output rows.
 */
export const defaultForecasters = WandererForecasters.fromDefaults({
  Digitize: forecastDigitize,
  "Cursed Magnifying Glass": (turns) => [
    {
      name: "Cursed Magnifying Glass",
      type: "wanderer",
      expectedFights: have($item`cursed magnifying glass`)
        ? clamp(
            5 - get("_voidFreeFights"),
            0,
            cooldownUses(turns, 13 - get("cursedMagnifyingGlassCount"), 13),
          )
        : 0,
      winChance: 1,
    },
  ],
  Vote: forecastVote,
  "Backup Camera": (turns) => [
    {
      name: "Backup Camera",
      type: "backup",
      expectedFights: have($item`backup camera`)
        ? clamp(11 - get("_backUpUses"), 0, turns)
        : 0,
      winChance: 1,
    },
  ],
  Kramco: () => [
    {
      // Future goblins may fire in the farming zone before they are guaranteed.
      // Only count the one we can deliberately drag right now.
      name: "Guaranteed Kramco",
      type: "wanderer",
      expectedFights:
        have($item`Kramco Sausage-o-Matic™`) && getKramcoWandererChance() >= 1
          ? 1
          : 0,
      winChance: 1,
    },
  ],
  "Everything Looks Yellow": forecastYellowCooldown,
  "Shocking Lick": () => [
    {
      name: "Shocking Lick",
      type: "yellow ray",
      expectedFights: get("shockingLickCharges"),
      winChance: 1,
    },
  ],
  Lightning: () => [
    {
      name: "Lightning Strike",
      type: "freefight",
      expectedFights: have($skill`Lightning Strike`)
        ? Math.floor(myLightning() / 20)
        : 0,
      winChance: 1,
    },
  ],
  "Assert your Authority": () => [
    {
      name: "Assert your Authority",
      type: "freefight (no items)",
      expectedFights:
        $items`Sheriff pistol, Sheriff badge, Sheriff moustache`.every((item) =>
          have(item),
        )
          ? clamp(3 - get("_assertYourAuthorityCast"), 0, 3)
          : 0,
      winChance: 1,
    },
  ],
  "Club 'Em Into Next Week": forecastClubNextWeek,
  "Everything Looks Red": forecastRedCooldown,
  "Everything Looks Green": forecastGreenCooldown,
});

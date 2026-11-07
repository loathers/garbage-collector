import {
  fullnessLimit,
  inebrietyLimit,
  Item,
  myAdventures,
  myClass,
  myFullness,
  myInebriety,
  myTurncount,
  toSlot,
} from "kolmafia";
import {
  $class,
  $familiar,
  $item,
  $skill,
  $slot,
  clamp,
  get,
  getModifier,
  have,
  SourceTerminal,
} from "libram";
import { globalOptions } from "./config";
import { bonusGear } from "./outfit/dropsgear";
import { BonusEquipMode } from "./outfit/lib";
import { FarmingStrategy } from "./farmingStrategy";
import { copyTargetCount } from "./target/fights";
import {
  basePointerRingMeat,
  ESTIMATED_OVERDRUNK_TURNS,
  howManySausagesCouldIEat,
  targetingMeat,
  withLocation,
} from "./lib";
import { embezzlerFights } from "./tasks/embezzler";
import { nextWeekFights } from "./resources/sealclub";
import { LuckySource } from "./resources/lucky";

let cachedUsingThumbRing: boolean | null = null;
function usingThumbRing(): boolean {
  if (!have($item`mafia thumb ring`)) {
    return false;
  }
  if (cachedUsingThumbRing === null) {
    // Select accessories before valuation: Pantsgiving and other gear ask for
    // this turn estimate themselves. Use stable bonuses for the all-day forecast.
    const gear = bonusGear(BonusEquipMode.BARF, {
      slot: $slot`acc1`,
      simulate: true,
    });
    const accessoryBonuses = [...gear.entries()].filter(([item]) => have(item));

    // Mafia resolves env()/zone()/loc() modifiers against the last location
    // set, so restore it or unrelated gear is priced against this one.
    const meatAccessories = withLocation(FarmingStrategy.location, () =>
      Item.all()
        .filter(
          (item) =>
            have(item) &&
            toSlot(item) === $slot`acc1` &&
            getModifier("Meat Drop", item) > 0,
        )
        .map(
          (item) =>
            [
              item,
              getModifier("Meat Drop", item) * FarmingStrategy.meatDropValue(),
            ] as [Item, number],
        ),
    );

    const accessoryValues = new Map<Item, number>(accessoryBonuses);
    for (const [accessory, value] of meatAccessories) {
      accessoryValues.set(
        accessory,
        value + (accessoryValues.get(accessory) ?? 0),
      );
    }

    if (
      have($item`mafia pointer finger ring`) &&
      ((myClass() === $class`Seal Clubber` && have($skill`Furious Wallop`)) ||
        have($item`haiku katana`) ||
        have($item`Operation Patriot Shield`) ||
        have($item`unwrapped knock-off retro superhero cape`) ||
        have($item`left bear arm`) ||
        have($skill`Head in the Game`))
    ) {
      accessoryValues.set(
        $item`mafia pointer finger ring`,
        basePointerRingMeat(),
      );
    }
    const bestAccessories = [...accessoryValues.entries()]
      .sort(([, aBonus], [, bBonus]) => bBonus - aBonus)
      .map(([item]) => item);
    cachedUsingThumbRing = bestAccessories
      .slice(0, 2)
      .includes($item`mafia thumb ring`);
  }
  return cachedUsingThumbRing;
}

export function estimatedGarboTurns(estimateEmptyOrgans = true): number {
  // Assume roughly 2 fullness from pantsgiving and 8 adventures/fullness.
  const pantsgivingAdventures = have($item`Pantsgiving`)
    ? Math.max(0, 2 - get("_pantsgivingFullness")) * 8
    : 0;
  const sausageAdventures = howManySausagesCouldIEat();
  const thesisAdventures =
    have($familiar`Pocket Professor`) && !get("_thesisDelivered") ? 11 : 0;
  const nightcapAdventures =
    globalOptions.ascend &&
    myInebriety() <= inebrietyLimit() &&
    have($item`Drunkula's wineglass`)
      ? ESTIMATED_OVERDRUNK_TURNS
      : 0;
  const thumbRingMultiplier = usingThumbRing() ? 1 / 0.96 : 1;

  // Estimate potential adventures from empty organs
  const unrealizedOrganAdventures = estimateEmptyOrgans
    ? Math.max(
        potentialFullnessAdventures() +
          potentialInebrietyAdventures() +
          potentialNonOrganAdventures(),
        0,
      )
    : 0;

  let turns;
  if (globalOptions.stopTurncount) {
    turns = globalOptions.stopTurncount - myTurncount();
  } else if (globalOptions.nobarf) {
    turns = targetingMeat() ? highMeatMonsterCount() : 0;
  } else if (globalOptions.saveTurns > 0 || !globalOptions.ascend) {
    turns =
      (myAdventures() +
        sausageAdventures +
        pantsgivingAdventures +
        thesisAdventures +
        unrealizedOrganAdventures -
        globalOptions.saveTurns) *
      thumbRingMultiplier;
  } else {
    turns =
      (myAdventures() +
        sausageAdventures +
        pantsgivingAdventures +
        nightcapAdventures +
        thesisAdventures +
        unrealizedOrganAdventures) *
      thumbRingMultiplier;
  }

  return turns;
}

/**
 * Computes the estimated number of turns left that the user will use outside garbo
 * @returns A guess of how many turns will be used outside garbo
 */
export function remainingUserTurns(): number {
  const dietAdventures = Math.max(
    potentialFullnessAdventures() +
      potentialInebrietyAdventures() +
      potentialNonOrganAdventures(),
    0,
  );
  const turns =
    myAdventures() +
    dietAdventures -
    estimatedGarboTurns() +
    globalOptions.saveTurns;
  return turns;
}

export const estimatedTurnsTomorrow =
  400 + clamp((get("valueOfAdventure") - 4000) / 8, 0, 600);

function potentialFullnessAdventures(): number {
  const distentionPillSpace =
    have($item`distention pill`) && !get("_distentionPillUsed") ? 1 : 0;

  return (fullnessLimit() - myFullness() + distentionPillSpace) * 8;
}

function potentialInebrietyAdventures(): number {
  const syntheticPillSpace =
    have($item`synthetic dog hair pill`) && !get("_syntheticDogHairPillUsed")
      ? 1
      : 0;
  const shotglassSpace =
    have($item`mime army shotglass`) && !get("_mimeArmyShotglassUsed") ? 1 : 0;
  const sweatSpace = have($item`designer sweatpants`)
    ? 3 - get("_sweatOutSomeBoozeUsed")
    : 0;

  return (
    (inebrietyLimit() -
      myInebriety() +
      syntheticPillSpace +
      sweatSpace +
      shotglassSpace) *
    7
  );
}

function potentialNonOrganAdventures(): number {
  const borrowedTimeAdventures =
    globalOptions.ascend && !get("_borrowedTimeUsed") ? 20 : 0;
  const chocolateAdventures =
    ((3 - get("_chocolatesUsed")) * (4 - get("_chocolatesUsed"))) / 2;

  return borrowedTimeAdventures + chocolateAdventures;
}

export function wanderingCopytargetsRemaining() {
  // Todo: account for not having enough turns to do all your nextweek fights
  return (
    SourceTerminal.digitizedMonstersRemainingForTurns(estimatedGarboTurns()) +
    nextWeekFights()
  );
}
export function highMeatMonsterCount(...excludedEmbezzlers: LuckySource[]) {
  const meatTargets = targetingMeat() ? copyTargetCount() : 0;
  const embezzlers = embezzlerFights(...excludedEmbezzlers);
  return meatTargets + embezzlers;
}

import { canAdventure, Item, mallPrice } from "kolmafia";
import {
  $effect,
  $item,
  $location,
  $skill,
  AprilingBandHelmet,
  clamp,
  get,
  have,
  realmAvailable,
} from "libram";
import { EMBEZZLER_MULTIPLIER } from "../lib";
import { GarboTask } from "../tasks/engine";

type AprilingItem = {
  item: Item;
  value: () => number;
  limit: () => number;
};

const SBBLIMIT = 20000; // We can't get more than 20k from a SBB NC Force

const INSTRUMENT_OPTIONS: AprilingItem[] = [
  {
    item: $item`Apriling band saxophone`,
    value: () =>
      canAdventure($location`Cobb's Knob Treasury`)
        ? EMBEZZLER_MULTIPLIER() * get("valueOfAdventure")
        : 0,
    limit: () => clamp(3 - get("_aprilBandSaxophoneUses"), 0, 3),
  },
  {
    item: $item`Apriling band tuba`,
    value: () =>
      realmAvailable("sleaze") ? SBBLIMIT - get("valueOfAdventure") : 0,
    limit: () => clamp(3 - get("_aprilBandTubaUses"), 0, 3),
  },
  {
    item: $item`Apriling band piccolo`,
    value: () =>
      // fam xp value here
      0,
    limit: () => clamp(3 - get("_aprilBandPiccoloUses"), 0, 3),
  },
  {
    item: $item`Apriling band quad tom`,
    value: () =>
      have($effect`Steely-Eyed Squint`) ||
      (!get("_steelyEyedSquintUsed") && have($skill`Steely-Eyed Squint`))
        ? 0.2 * mallPrice($item`spice melange`)
        : 0,
    limit: () => clamp(3 - get("_aprilBandTomUses"), 0, 3),
  },
];

let bestAprilingItems: AprilingItem[] | null = null;
function getBestAprilingItems(): AprilingItem[] {
  return (bestAprilingItems ??= INSTRUMENT_OPTIONS.sort(
    (a, b) => b.value() - a.value(),
  ).splice(0, clamp(2 - get("_aprilBandInstruments"), 0, 2)));
}

function shouldAprilingSummon(item: Item) {
  return (
    AprilingBandHelmet.have() &&
    getBestAprilingItems().some((i) => item === i.item) &&
    get("_aprilBandInstruments") < 2
  );
}

function aprilingSummonTask({ item }: AprilingItem): GarboTask {
  return {
    name: item.name,
    completed: () => !shouldAprilingSummon(item),
    do: () => AprilingBandHelmet.joinSection(item),
    spendsTurn: false,
  };
}

function canAprilingPlay(item: Item): boolean {
  return item.dailyusesleft > 0;
}

export function aprilingPlayTask({ item }: AprilingItem): GarboTask {
  return {
    name: item.name,
    completed: () => !canAprilingPlay(item),
    do: () => AprilingBandHelmet.play(item),
    spendsTurn: false,
  };
}

export function getAllAprilingSummonTasks(): GarboTask[] {
  return getBestAprilingItems().map((item) => aprilingSummonTask(item));
}

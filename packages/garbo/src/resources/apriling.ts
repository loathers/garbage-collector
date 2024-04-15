import { Item } from "kolmafia";
import {
  $effect,
  $item,
  $skill,
  AprilingBandHelmet,
  clamp,
  get,
  have,
} from "libram";
import { luckyAdventures } from "../lib";
import { GarboTask } from "../tasks/engine";
import { garboValue } from "../garboValue";

type AprilingItem = {
  item: Item;
  value: () => number;
  limit: () => number;
};

// const SBBLIMIT = 20000; // We can't get more than 20k from a SBB NC Force

const INSTRUMENT_OPTIONS: AprilingItem[] = [
  {
    item: $item`Apriling band saxophone`,
    value: () => {
      const sortedAdventures = luckyAdventures
        .filter((adventure) => adventure.available)
        .sort((a, b) => b.value() - a.value());
      const topAdventure = sortedAdventures[0];
      return topAdventure ? topAdventure.value() : 0;
    },
    limit: () => clamp($item`Apriling band saxophone`.dailyusesleft, 0, 3),
  },
  {
    item: $item`Apriling band tuba`,
    value: () =>
      // realmAvailable("sleaze") ? SBBLIMIT - get("valueOfAdventure") : 0,
      0,
    limit: () => clamp($item`Apriling band tuba`.dailyusesleft, 0, 3),
  },
  {
    item: $item`Apriling band piccolo`,
    value: () =>
      // fam xp value here
      0,
    limit: () => clamp($item`Apriling band piccolo`.dailyusesleft, 0, 3),
  },
  {
    item: $item`Apriling band quad tom`,
    value: () =>
      have($effect`Steely-Eyed Squint`) ||
      (!get("_steelyEyedSquintUsed") && have($skill`Steely-Eyed Squint`))
        ? 0.02 * garboValue($item`spice melange`)
        : 0,
    limit: () => clamp($item`Apriling band quad tom`.dailyusesleft, 0, 3),
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

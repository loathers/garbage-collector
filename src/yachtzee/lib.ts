import { cliExecute, Effect, Item, useFamiliar } from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  adventureMacroAuto,
  get,
  getActiveSongs,
  getModifier,
  have,
  Mood,
  Requirement,
  set,
  sum,
  tryFindFreeRun,
} from "libram";
import { withStash } from "../clan";
import { Macro } from "../combat";
import { EmbezzlerFight, embezzlerSources } from "../embezzler";
import { freeFightFamiliar } from "../familiar";
import { globalOptions, ltbRun, realmAvailable } from "../lib";
import { freeFightOutfit } from "../outfit";

const ignoredSources = [
  "Orb Prediction",
  "Pillkeeper Semirare",
  "Lucky!",
  "11-leaf clover (untapped potential)",
];
export const expectedEmbezzlers = sum(
  embezzlerSources.filter((source: EmbezzlerFight) => !ignoredSources.includes(source.name)),
  (source: EmbezzlerFight) => source.potential()
);

export function pyecAvailable(): boolean {
  if (get("_PYECAvailable") === "") {
    set(
      "_PYECAvailable",
      get("expressCardUsed")
        ? false
        : have($item`Platinum Yendorian Express Card`)
        ? true
        : withStash($items`Platinum Yendorian Express Card`, () => {
            return have($item`Platinum Yendorian Express Card`);
          })
    );
  }
  return get("_PYECAvailable", false);
}

export function shrugIrrelevantSongs(): void {
  for (const song of getActiveSongs()) {
    const slot = Mood.defaultOptions.songSlots.find((slot) => slot.includes(song));
    if (
      !slot &&
      song !== $effect`Ode to Booze` &&
      song !== $effect`Polka of Plenty` &&
      song !== $effect`Chorale of Companionship` &&
      song !== $effect`The Ballad of Richie Thingfinder`
    ) {
      cliExecute(`shrug ${song}`);
    }
  }
  // Shrug default Mood songs
  cliExecute("shrug ur-kel");
  cliExecute("shrug phat loot");
}

export const freeNCs = (): number =>
  (have($item`Clara's bell`) && !globalOptions.clarasBellClaimed ? 1 : 0) +
  (have($item`Jurassic Parka`) ? 5 - get("_spikolodonSpikeUses") : 0);

export function yachtzeeBuffValue(obj: Item | Effect): number {
  return (2000 * (getModifier("Meat Drop", obj) + getModifier("Familiar Weight", obj) * 2.5)) / 100;
}

export function useSpikolodonSpikes(): void {
  if (get("_spikolodonSpikeUses") >= 5) return;
  const run = tryFindFreeRun() ?? ltbRun();

  const canJelly =
    have($familiar`Space Jellyfish`) && !run.constraints.familiar && realmAvailable("stench");
  const familiar =
    run.constraints.familiar?.() ?? canJelly ? $familiar`Space Jellyfish` : freeFightFamiliar();
  useFamiliar(familiar);
  const mergedRequirements = new Requirement([], { forceEquip: $items`Jurassic Parka` }).merge(
    run.constraints.equipmentRequirements?.() ?? new Requirement([], {})
  );
  freeFightOutfit(mergedRequirements);
  cliExecute("parka spikolodon");

  const targetZone = canJelly
    ? $location`Pirates of the Garbage Barges`
    : $location`The Haunted Kitchen`;
  const macro = Macro.familiarActions().step(run.macro);
  const startingSpikes = get("_spikolodonSpikeUses");
  do {
    adventureMacroAuto(targetZone, macro);
  } while (get("_spikolodonSpikeUses") === startingSpikes);
}

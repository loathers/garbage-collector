import { cliExecute, Effect, Item } from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $skill,
  CinchoDeMayo,
  get,
  getActiveSongs,
  getModifier,
  have,
  Mood,
  realmAvailable,
  set,
  sum,
  tryFindFreeRun,
} from "libram";
import { withStash } from "../clan";
import { garboAdventureAuto, Macro } from "../combat";
import { globalOptions } from "../config";
import { EmbezzlerFight, embezzlerSources } from "../embezzler";
import { freeFightFamiliar } from "../familiar";
import { ltbRun, propertyManager } from "../lib";
import { freeFightOutfit, toSpec } from "../outfit";
import postCombatActions from "../post";
import { wanderer } from "../garboWanderer";

const ignoredSources = [
  "Orb Prediction",
  "Pillkeeper Semirare",
  "Lucky!",
  "11-leaf clover (untapped potential)",
];
export const expectedEmbezzlers = sum(
  embezzlerSources.filter((source: EmbezzlerFight) => !ignoredSources.includes(source.name)),
  (source: EmbezzlerFight) => source.potential(),
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
          }),
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

export function cinchNCs(): number {
  return CinchoDeMayo.have() ? Math.floor(CinchoDeMayo.totalAvailableCinch() / 60) : 0;
}

export const freeNCs = (): number =>
  (have($item`Clara's bell`) && !globalOptions.clarasBellClaimed ? 1 : 0) +
  (have($item`Jurassic Parka`) ? 5 - get("_spikolodonSpikeUses") : 0) +
  cinchNCs();

export function yachtzeeBuffValue(obj: Item | Effect): number {
  return (2000 * (getModifier("Meat Drop", obj) + getModifier("Familiar Weight", obj) * 2.5)) / 100;
}

export function useSpikolodonSpikes(): void {
  if (get("_spikolodonSpikeUses") >= 5) return;
  const run = tryFindFreeRun() ?? ltbRun();

  const canJelly =
    have($familiar`Space Jellyfish`) && !run.constraints.familiar && realmAvailable("stench");
  const familiar =
    run.constraints.familiar?.() ??
    (canJelly ? $familiar`Space Jellyfish` : freeFightFamiliar({ allowAttackFamiliars: false }));
  run.constraints.preparation?.();
  freeFightOutfit({ shirt: $item`Jurassic Parka`, ...toSpec(run), familiar }).dress();
  cliExecute("parka spikolodon");

  const targetZone = canJelly
    ? $location`Pirates of the Garbage Barges`
    : $location`Sloppy Seconds Diner`;
  const macro = Macro.familiarActions()
    .skill($skill`Launch spikolodon spikes`)
    .step(run.macro);
  const startingSpikes = get("_spikolodonSpikeUses");

  const ncSkipper = wanderer().unsupportedChoices.get(targetZone);
  if (ncSkipper) propertyManager.setChoices(ncSkipper);

  do {
    garboAdventureAuto(targetZone, macro);
  } while (get("_spikolodonSpikeUses") === startingSpikes);

  postCombatActions();
}

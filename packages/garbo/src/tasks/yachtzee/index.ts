import { inebrietyLimit, myInebriety, use, useSkill } from "kolmafia";
import {
  $effect,
  $item,
  $items,
  $location,
  $skill,
  AprilingBandHelmet,
  CinchoDeMayo,
  Delayed,
  get,
  have,
} from "libram";
import { bestFamUnderwaterGear, bestYachtzeeFamiliar } from "./familiar";
import { getBestWaterBreathingEquipment } from "./outfit";
import { freeNCs, maximumYachtzees } from "./lib";
import { GarboStrategy, Macro } from "../../combat";
import { GarboTask } from "../engine";
import {
  freeFishyAvailable,
  shouldYachtzee,
  willDrunkAdventure,
} from "../../lib";
import { globalOptions } from "../../config";

function doYachtzeeTask(additionalReady: () => boolean) {
  return {
    completed: () => !get("noncombatForcerActive"),
    ready: () => additionalReady() && have($effect`Fishy`),
    do: $location`The Sunken Party Yacht`,
    outfit: () => {
      const overdrunk = myInebriety() > inebrietyLimit();
      const yachtzeeFamiliar = bestYachtzeeFamiliar();
      const modifiers = ["20 Meat"];
      if (
        !(
          yachtzeeFamiliar.underwater ||
          have($effect`Driving Waterproofly`) ||
          have($effect`Wet Willied`)
        )
      ) {
        modifiers.push("underwater familiar");
      }
      const equips = [
        getBestWaterBreathingEquipment(freeNCs()).item,
        bestFamUnderwaterGear(yachtzeeFamiliar),
      ];
      if (overdrunk) equips.push($item`Drunkula's wineglass`);
      return {
        equip: equips,
        modifier: modifiers,
        avoid: $items`anemoney clip, cursed magnifying glass, Kramco Sausage-o-Matic™, cheap sunglasses`,
        familiar: yachtzeeFamiliar,
      };
    },
    combat: new GarboStrategy(() =>
      Macro.abortWithMsg(
        "Unexpected combat while attempting yachtzee adventure",
      ),
    ),
    turns: () => maximumYachtzees(),
    spendsTurn: true,
  };
}

type AlternateTask = GarboTask & { turns: Delayed<number> };

export function yachtzeeTasks(): AlternateTask[] {
  if (!shouldYachtzee() || !freeFishyAvailable()) return [];
  return [
    {
      name: "Yachtzee (sober)",
      ...doYachtzeeTask(() => !willDrunkAdventure()),
      sobriety: "sober",
    },
    {
      name: "Yachtzee (drunk)",
      ...doYachtzeeTask(() => willDrunkAdventure()),
      sobriety: "drunk",
    },
    {
      name: "Use Fishy Pipe for Yachtzee",
      completed: () => have($effect`Fishy`),
      ready: () => have($item`fishy pipe`) && !get("_fishyPipeUsed"),
      do: () => use($item`fishy pipe`),
      turns: 0,
      sobriety: () => (willDrunkAdventure() ? "drunk" : "sober"),
      spendsTurn: false,
    },
    {
      name: "Apriling Band Tuba Yachtzee NC Force",
      completed: () => get("noncombatForcerActive"),
      ready: () =>
        have($item`Apriling band tuba`) &&
        $item`Apriling band tuba`.dailyusesleft > 0 &&
        have($effect`Fishy`),
      do: () => AprilingBandHelmet.play($item`Apriling band tuba`),
      turns: 0,
      sobriety: () => (willDrunkAdventure() ? "drunk" : "sober"),
      spendsTurn: false,
    },
    {
      name: "Clara Yachtzee NC Force",
      completed: () => get("noncombatForcerActive"),
      ready: () =>
        have($item`Clara's bell`) &&
        !globalOptions.clarasBellClaimed &&
        have($effect`Fishy`),
      do: () => use($item`Clara's bell`),
      turns: 0,
      sobriety: () => (willDrunkAdventure() ? "drunk" : "sober"),
      spendsTurn: false,
    },
    {
      name: "Cincho Yachtzee NC Force",
      completed: () => get("noncombatForcerActive"),
      ready: () => CinchoDeMayo.currentCinch() >= 60 && have($effect`Fishy`),
      do: () => useSkill($skill`Cincho: Fiesta Exit`),
      turns: 0,
      sobriety: () => (willDrunkAdventure() ? "drunk" : "sober"),
      spendsTurn: false,
    },
  ];
}

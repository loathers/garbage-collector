import {
  cliExecute,
  inebrietyLimit,
  myInebriety,
  use,
  useSkill,
} from "kolmafia";
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
import { getBestWaterBreathingEquipment } from "./lib";
import { Macro } from "../../combat";
import { GarboTask } from "../engine";
import { willDrunkAdventure } from "../../lib";
import { Outfit, Quest } from "grimoire-kolmafia";
import { maximumYachtzees, shouldClara, willYachtzee } from "../../resources";
import { GarboStrategy } from "../../combatStrategy";

type AlternateTask = GarboTask & { turns: Delayed<number> };

export const yachtzeeQuest: Quest<AlternateTask>[] = [
  {
    name: "Yachtzee",
    completed: () => !willYachtzee() && !get("noncombatForcerActive"),
    tasks: [
      {
        name: "Yachtzee",
        completed: () => !get("noncombatForcerActive"),
        ready: () => have($effect`Fishy`),
        choices: { 918: 2 },
        do: $location`The Sunken Party Yacht`,
        outfit: () => {
          const outfit = new Outfit();
          const overdrunk = myInebriety() > inebrietyLimit();
          const yachtzeeFamiliar = bestYachtzeeFamiliar();
          outfit.modifier.push("20 Meat Drop", "-tie");
          if (
            !(
              yachtzeeFamiliar.underwater ||
              have($effect`Driving Waterproofly`) ||
              have($effect`Wet Willied`)
            )
          ) {
            outfit.modifier.push("underwater familiar");
          }
          outfit.equip(getBestWaterBreathingEquipment(maximumYachtzees()).item);
          outfit.equip(bestFamUnderwaterGear(yachtzeeFamiliar));
          if (overdrunk) outfit.equip($item`Drunkula's wineglass`);
          outfit.avoid.push(
            ...$items`anemoney clip, cursed magnifying glass, Kramco Sausage-o-Matic™, cheap sunglasses`,
          );
          if (outfit.haveEquipped($item`The Crown of Ed the Undying`)) {
            outfit.setModes({ edpiece: "fish" });
          }
          outfit.familiar = yachtzeeFamiliar;
          return outfit;
        },
        combat: new GarboStrategy(() =>
          Macro.abortWithMsg(
            "Unexpected combat while attempting yachtzee adventure",
          ),
        ),
        turns: maximumYachtzees,
        spendsTurn: true,
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
        name: "Use Skatepark for Yachtzee",
        completed: () => have($effect`Fishy`),
        ready: () => get("skateParkStatus") === "ice" && !get("_skateBuff1"),
        do: () => cliExecute("skate lutz"),
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
        ready: () => shouldClara("yachtzee") && have($effect`Fishy`),
        do: () => {
          use($item`Clara's bell`);
        },
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
    ],
  },
];

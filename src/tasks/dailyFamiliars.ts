import {
  abort,
  cliExecute,
  equip,
  familiarEquippedEquipment,
  hippyStoneBroken,
  itemAmount,
  myPrimestat,
  retrieveItem,
  retrievePrice,
  toItem,
  use,
  useFamiliar,
} from "kolmafia";
import {
  $familiar,
  $familiars,
  $item,
  $items,
  CrimboShrub,
  get,
  have,
  Robortender,
  withProperty,
} from "libram";
import { withStash } from "../clan";
import { globalOptions } from "../config";
import { embezzlerCount } from "../embezzler";
import { meatFamiliar, setBestLeprechaunAsMeatFamiliar } from "../familiar";
import {
  baseMeat,
  felizValue,
  garbageTouristRatio,
  newarkValue,
  tryFeast,
  turnsToNC,
  userConfirmDialog,
} from "../lib";
import { estimatedGarboTurns } from "../turns";
import { GarboTask } from "./engine";
import { Quest } from "grimoire-kolmafia";

function drivebyValue(): number {
  const embezzlers = embezzlerCount();
  const tourists = ((estimatedGarboTurns() - embezzlers) * turnsToNC) / (turnsToNC + 1);
  const marginalRoboWeight = 50;
  const meatPercentDelta =
    Math.sqrt(220 * 2 * marginalRoboWeight) -
    Math.sqrt(220 * 2 * marginalRoboWeight) +
    2 * marginalRoboWeight;
  return (meatPercentDelta / 100) * ((750 + baseMeat) * embezzlers + baseMeat * tourists);
}

function entendreValue(): number {
  const embezzlers = embezzlerCount();
  const tourists = ((estimatedGarboTurns() - embezzlers) * turnsToNC) / (turnsToNC + 1);
  const marginalRoboWeight = 50;
  const itemPercent = Math.sqrt(55 * marginalRoboWeight) + marginalRoboWeight - 3;
  const garbageBagsDropRate = 0.15 * 3; // 3 bags each with a 15% drop chance
  const meatStackDropRate = 0.3 * 4; // 4 stacks each with a 30% drop chance
  return (
    (itemPercent / 100) *
    (meatStackDropRate * embezzlers + garbageBagsDropRate * tourists * garbageTouristRatio)
  );
}

export function prepRobortender(): void {
  if (!have($familiar`Robortender`)) return;
  const roboDrinks = {
    "Drive-by shooting": { priceCap: drivebyValue(), mandatory: true },
    Newark: {
      priceCap: newarkValue() * 0.25 * estimatedGarboTurns(),
      mandatory: false,
    },
    "Feliz Navidad": { priceCap: felizValue() * 0.25 * estimatedGarboTurns(), mandatory: false },
    "Bloody Nora": {
      priceCap: get("_envyfishEggUsed")
        ? (750 + baseMeat) * (0.5 + ((4 + Math.sqrt(110 / 100)) * 30) / 100)
        : 0,
      mandatory: false,
    },
    "Single entendre": { priceCap: entendreValue(), mandatory: false },
  };
  for (const [drinkName, { priceCap, mandatory }] of Object.entries(roboDrinks)) {
    if (get("_roboDrinks").toLowerCase().includes(drinkName.toLowerCase())) continue;
    useFamiliar($familiar`Robortender`);
    const drink = toItem(drinkName);
    if (retrievePrice(drink) > priceCap) {
      if (mandatory) {
        setBestLeprechaunAsMeatFamiliar();
        if (
          !userConfirmDialog(
            `Garbo cannot find a reasonably priced drive-by-shooting (price cap: ${priceCap}), and will not be using your robortender. Is that cool with you?`,
            true,
          )
        ) {
          abort(
            "Alright, then, I guess you should try to find a reasonbly priced drive-by-shooting. Or do different things with your day.",
          );
        }
        break;
      }
      continue;
    }
    withProperty("autoBuyPriceLimit", priceCap, () => retrieveItem(1, drink));
    if (have(drink)) Robortender.feed(drink);
  }
}

const DailyFamiliarTasks: GarboTask[] = [
  {
    name: "Prepare Shorter-Order Cook",
    ready: () => have($familiar`Shorter-Order Cook`) && have($item`blue plate`),
    completed: () => familiarEquippedEquipment($familiar`Shorter-Order Cook`) === $item`blue plate`,
    do: () => equip($familiar`Shorter-Order Cook`, $item`blue plate`),
  },
  {
    name: "Prepare Robortender",
    ready: () => have($familiar`Robortender`),
    completed: () => get("_roboDrinks").toLowerCase().includes("drive-by shooting"),
    do: prepRobortender,
  },
  {
    name: "Acquire amulet coin",
    ready: () => have($familiar`Cornbeefadon`),
    completed: () => have($item`amulet coin`),
    do: () => use($item`box of Familiar Jacks`),
    acquire: [{ item: $item`box of Familiar Jacks` }],
    outfit: { familiar: $familiar`Cornbeefadon` },
  },
  {
    // TODO: Consider other familiars?
    name: "Equip tiny stillsuit",
    ready: () => itemAmount($item`tiny stillsuit`) > 0 && have($familiar`Cornbeefadon`),
    completed: () => familiarEquippedEquipment($familiar`Cornbeefadon`) === $item`tiny stillsuit`,
    do: () => equip($familiar`Cornbeefadon`, $item`tiny stillsuit`),
  },
  {
    name: "Acquire box of old Crimbo decorations",
    ready: () => have($familiar`Crimbo Shrub`),
    completed: () => have($item`box of old Crimbo decorations`),
    do: (): void => {
      useFamiliar($familiar`Crimbo Shrub`);
    },
    outfit: { familiar: $familiar`Crimbo Shrub` },
  },
  {
    name: "Decorate Crimbo Shrub",
    ready: () => have($item`box of old Crimbo decorations`),
    completed: () => get("_shrubDecorated"),
    do: () =>
      CrimboShrub.decorate(
        myPrimestat().toString(),
        "Stench Damage",
        hippyStoneBroken() ? "PvP Fights" : "HP Regen",
        "Red Ray",
      ),
    outfit: { familiar: $familiar`Crimbo Shrub` },
  },
  {
    name: "Mummery Meat",
    ready: () => have($item`mumming trunk`),
    completed: () => get("_mummeryMods").includes("Meat Drop"),
    do: () => cliExecute("mummery meat"),
    outfit: { familiar: meatFamiliar() },
  },
  {
    name: "Mummery Item",
    ready: () => have($item`mumming trunk`) && have($familiar`Trick-or-Treating Tot`),
    completed: () => get("_mummeryMods").includes("Item Drop"),
    do: () => cliExecute("mummery item"),
    outfit: { familiar: $familiar`Trick-or-Treating Tot` },
  },
  {
    name: "Moveable feast",
    ready: () => have($item`moveable feast`) || globalOptions.prefs.stashClan !== "none",
    completed: () => get("_feastUsed") > 0,
    do: (): void => {
      withStash($items`moveable feast`, () => {
        if (have($item`moveable feast`)) {
          [
            ...$familiars`Pocket Professor, Frumious Bandersnatch, Pair of Stomping Boots`,
            meatFamiliar(),
          ].forEach(tryFeast);
        }
      });
    },
  },
];

export const DailyFamiliarsQuest: Quest<GarboTask> = {
  name: "Daily Familiars",
  tasks: DailyFamiliarTasks,
};

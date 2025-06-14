import {
  abort,
  cliExecute,
  equip,
  familiarEquippedEquipment,
  hippyStoneBroken,
  mallPrice,
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
  ToyCupidBow,
  withProperty,
} from "libram";
import { withStash } from "../clan";
import { globalOptions } from "../config";
import { meatFamiliar, setBestLeprechaunAsMeatFamiliar } from "../familiar";
import {
  baseMeat,
  felizValue,
  garbageTouristRatio,
  isFree,
  newarkValue,
  targetMeat,
  tryFeast,
  turnsToNC,
  userConfirmDialog,
} from "../lib";
import { estimatedGarboTurns, highMeatMonsterCount } from "../turns";
import { GarboTask } from "./engine";
import { Quest } from "grimoire-kolmafia";
import { acquire } from "../acquire";
import { amuletCoinValue } from "../familiar/lib";

function drivebyValue(targetCount = 0): number {
  const targets = targetCount;
  const tourists =
    ((estimatedGarboTurns() - targets) * turnsToNC) / (turnsToNC + 1);
  const marginalRoboWeight = 50;
  const meatPercentDelta =
    Math.sqrt(220 * 2 * marginalRoboWeight) -
    Math.sqrt(220 * 2 * marginalRoboWeight) +
    2 * marginalRoboWeight;
  return (
    (meatPercentDelta / 100) * (targetMeat() * targets + baseMeat() * tourists)
  );
}

function entendreValue(targetCount = 0): number {
  const targets = targetCount;
  const tourists =
    ((estimatedGarboTurns() - targets) * turnsToNC) / (turnsToNC + 1);
  const marginalRoboWeight = 50;
  const itemPercent =
    Math.sqrt(55 * marginalRoboWeight) + marginalRoboWeight - 3;
  const garbageBagsDropRate = 0.15 * 3; // 3 bags each with a 15% drop chance
  return (
    (itemPercent / 100) * (garbageBagsDropRate * tourists * garbageTouristRatio)
  );
}

function worthFeedingRobortender(): boolean {
  if (!globalOptions.nobarf) return true;
  if (isFree(globalOptions.target)) return false;
  return (
    (globalOptions.target.maxMeat + globalOptions.target.minMeat) / 2 >= 300
  );
}

export function prepRobortender(): void {
  if (!have($familiar`Robortender`)) return;
  const targetCount = highMeatMonsterCount("Scepter"); // Scepter can cause circular logic
  const roboDrinks = {
    "Drive-by shooting": {
      priceCap: drivebyValue(targetCount),
      mandatory: true,
    },
    Newark: {
      priceCap: newarkValue() * 0.25 * estimatedGarboTurns(),
      mandatory: false,
    },
    "Feliz Navidad": {
      priceCap: felizValue() * 0.25 * estimatedGarboTurns(),
      mandatory: false,
    },
    "Bloody Nora": {
      priceCap: get("_envyfishEggUsed")
        ? targetMeat() * (0.5 + ((4 + Math.sqrt(110 / 100)) * 30) / 100)
        : 0,
      mandatory: false,
    },
    "Single entendre": {
      priceCap: entendreValue(targetCount),
      mandatory: false,
    },
  };
  for (const [drinkName, { priceCap, mandatory }] of Object.entries(
    roboDrinks,
  )) {
    if (get("_roboDrinks").toLowerCase().includes(drinkName.toLowerCase())) {
      continue;
    }
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
    completed: () =>
      familiarEquippedEquipment($familiar`Shorter-Order Cook`) ===
      $item`blue plate`,
    do: () => {
      retrieveItem($item`blue plate`);
      equip($familiar`Shorter-Order Cook`, $item`blue plate`);
    },
    spendsTurn: false,
  },
  {
    name: "Prepare Robortender",
    ready: () => have($familiar`Robortender`) && worthFeedingRobortender(),
    completed: () =>
      get("_roboDrinks").toLowerCase().includes("drive-by shooting"),
    do: prepRobortender,
    spendsTurn: false,
  },
  {
    name: "Acquire box of Familiar Jacks",
    ready: () => have($familiar`Cornbeefadon`),
    completed: () =>
      have($item`box of Familiar Jacks`) || have($item`amulet coin`),
    do: () =>
      // TODO: acquire max price calculation
      acquire(1, $item`box of Familiar Jacks`, get("autoBuyPriceLimit")),
    spendsTurn: false,
  },
  {
    name: "Acquire amulet coin",
    ready: () =>
      have($familiar`Cornbeefadon`) &&
      have($item`box of Familiar Jacks`) &&
      !ToyCupidBow.have() &&
      amuletCoinValue() >= mallPrice($item`box of Familiar Jacks`),
    completed: () => have($item`amulet coin`),
    do: (): void => {
      use($item`box of Familiar Jacks`);
    },
    outfit: { familiar: $familiar`Cornbeefadon` },
    spendsTurn: false,
  },
  {
    name: "Acquire box of old Crimbo decorations",
    ready: () => have($familiar`Crimbo Shrub`),
    completed: () => have($item`box of old Crimbo decorations`),
    do: (): void => {
      useFamiliar($familiar`Crimbo Shrub`);
    },
    outfit: { familiar: $familiar`Crimbo Shrub` },
    spendsTurn: false,
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
    spendsTurn: false,
  },
  {
    name: "Mummery Meat",
    ready: () => have($item`mumming trunk`),
    completed: () => get("_mummeryMods").includes("Meat Drop"),
    do: () => cliExecute("mummery meat"),
    outfit: { familiar: meatFamiliar() },
    spendsTurn: false,
  },
  {
    name: "Mummery Item",
    ready: () =>
      have($item`mumming trunk`) && have($familiar`Trick-or-Treating Tot`),
    completed: () => get("_mummeryMods").includes("Item Drop"),
    do: () => cliExecute("mummery item"),
    outfit: { familiar: $familiar`Trick-or-Treating Tot` },
    spendsTurn: false,
  },
  {
    name: "Moveable feast",
    ready: () =>
      have($item`moveable feast`) || globalOptions.prefs.stashClan !== "none",
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
    spendsTurn: false,
  },
];

export const DailyFamiliarsQuest: Quest<GarboTask> = {
  name: "Daily Familiars",
  tasks: DailyFamiliarTasks,
};

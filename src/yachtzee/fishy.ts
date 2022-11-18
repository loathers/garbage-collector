import {
  availableAmount,
  booleanModifier,
  canAdventure,
  cliExecute,
  equip,
  haveEffect,
  haveEquipped,
  mallPrice,
  print,
  use,
} from "kolmafia";
import { $effect, $item, $location, get, getActiveEffects, have, sum, uneffect } from "libram";
import { acquire } from "../acquire";
import { adventureMacro, Macro } from "../combat";
import { maxBy, safeRestore } from "../lib";
import { pyecAvailable, yachtzeeBuffValue } from "./lib";
import { getBestWaterBreathingEquipment } from "./outfit";

function fishyCloverAdventureOpportunityCost(pipe: boolean) {
  const willBeFishy = pipe || have($effect`Fishy`);
  const fishyCloverAdventureCost = willBeFishy ? 1 : 2;
  const adventureExtensionBonus = pyecAvailable() ? 5 : 0;
  return sum(getActiveEffects(), (currentBuff) => {
    const buffValue = yachtzeeBuffValue(currentBuff);
    if (buffValue <= 0) return 0;

    const currentBuffTurns = haveEffect(currentBuff);
    if (currentBuffTurns <= fishyCloverAdventureCost) {
      return (currentBuffTurns + adventureExtensionBonus) * buffValue;
    }
    return fishyCloverAdventureCost * buffValue;
  });
}

export function optimizeForFishy(yachtzeeTurns: number, setup?: boolean): number {
  // Returns the lowest cost for fishy
  // Assume we already maximized for meat; this returns the cost of swapping out meat% equips for underwater breathing equips
  const bestWaterBreathingEquipment = getBestWaterBreathingEquipment(yachtzeeTurns);

  if (
    setup &&
    !have($effect`Really Deep Breath`) &&
    bestWaterBreathingEquipment.item !== $item.none
  ) {
    equip(bestWaterBreathingEquipment.item);
  }
  if (
    haveEquipped($item`The Crown of Ed the Undying`) &&
    !booleanModifier("Adventure Underwater")
  ) {
    cliExecute("edpiece fish");
  }
  // If we already have fishy, then we longer need to consider the cost of obtaining it
  if (haveEffect($effect`Fishy`) >= yachtzeeTurns) return 0;

  // Restore here if we potentially need to visit an adventure.php zone to grab fishy turns
  if (haveEffect($effect`Beaten Up`)) {
    uneffect($effect`Beaten Up`);
  }
  safeRestore();

  const haveFishyPipe = have($item`fishy pipe`) && !get("_fishyPipeUsed");
  const adventureExtensionBonus = pyecAvailable() ? 5 : 0;
  const fishySources = [
    {
      name: "fish juice box",
      turns: 20 + (haveFishyPipe ? 10 : 0),
      cost: mallPrice($item`fish juice box`),
      action: () => {
        acquire(1, $item`fish juice box`, 1.2 * mallPrice($item`fish juice box`));
        if (!have($item`fish juice box`)) throw new Error("Unable to obtain fish juice box");
        use(1, $item`fish juice box`);
        if (haveFishyPipe && haveEffect($effect`Fishy`) + adventureExtensionBonus < yachtzeeTurns) {
          use(1, $item`fishy pipe`);
        }
      },
    },
    {
      name: "2x fish juice box",
      turns: 40 + (haveFishyPipe ? 10 : 0),
      cost: 2 * mallPrice($item`fish juice box`),
      action: () => {
        acquire(2, $item`fish juice box`, 1.2 * mallPrice($item`fish juice box`));
        if (availableAmount($item`fish juice box`) < 2) {
          throw new Error("Unable to obtain sufficient fish juice boxes");
        }
        use(2, $item`fish juice box`);
        if (haveFishyPipe && haveEffect($effect`Fishy`) + adventureExtensionBonus < yachtzeeTurns) {
          use(1, $item`fishy pipe`);
        }
      },
    },
    {
      name: "cuppa Gill tea",
      turns: 30 + (haveFishyPipe ? 10 : 0),
      cost: mallPrice($item`cuppa Gill tea`) + bestWaterBreathingEquipment.cost,
      action: () => {
        acquire(1, $item`cuppa Gill tea`, 1.2 * mallPrice($item`cuppa Gill tea`));
        if (!have($item`cuppa Gill tea`)) throw new Error("Unable to obtain cuppa Gill tea");
        use(1, $item`cuppa Gill tea`);
        if (haveFishyPipe && haveEffect($effect`Fishy`) + adventureExtensionBonus < yachtzeeTurns) {
          use(1, $item`fishy pipe`);
        }
      },
    },
    {
      name: "powdered candy sushi set",
      turns: 30 + (haveFishyPipe ? 10 : 0),
      cost: mallPrice($item`powdered candy sushi set`) + bestWaterBreathingEquipment.cost,
      action: () => {
        acquire(
          1,
          $item`powdered candy sushi set`,
          1.2 * mallPrice($item`powdered candy sushi set`)
        );
        if (!have($item`powdered candy sushi set`)) {
          throw new Error("Unable to obtain powdered candy sushi set");
        }
        use(1, $item`powdered candy sushi set`);
        if (haveFishyPipe && haveEffect($effect`Fishy`) + adventureExtensionBonus < yachtzeeTurns) {
          use(1, $item`fishy pipe`);
        }
      },
    },
    {
      name: "concentrated fish broth",
      turns: 30 + (haveFishyPipe ? 10 : 0),
      cost: mallPrice($item`concentrated fish broth`) + bestWaterBreathingEquipment.cost,
      action: () => {
        acquire(1, $item`concentrated fish broth`, 1.2 * mallPrice($item`concentrated fish broth`));
        if (!have($item`concentrated fish broth`)) {
          throw new Error("Unable to obtain concentrated fish broth");
        }
        use(1, $item`concentrated fish broth`);
        if (haveFishyPipe && haveEffect($effect`Fishy`) + adventureExtensionBonus < yachtzeeTurns) {
          use(1, $item`fishy pipe`);
        }
      },
    },
    {
      name: "Lutz, the Ice Skate",
      turns: 30 + (haveFishyPipe ? 10 : 0),
      cost:
        get("_skateBuff1", false) || get("skateParkStatus") !== "ice"
          ? Infinity
          : bestWaterBreathingEquipment.cost,
      action: () => {
        cliExecute("skate lutz");
        if (haveFishyPipe && haveEffect($effect`Fishy`) + adventureExtensionBonus < yachtzeeTurns) {
          use(1, $item`fishy pipe`);
        }
      },
    },
    {
      name: "Pocket Wish",
      turns: 20 + (haveFishyPipe ? 10 : 0),
      cost: mallPrice($item`pocket wish`) + bestWaterBreathingEquipment.cost,
      action: () => {
        acquire(1, $item`pocket wish`, 1.2 * mallPrice($item`pocket wish`));
        if (!have($item`pocket wish`)) {
          throw new Error("Unable to obtain Pocket Wish");
        }
        cliExecute(`genie effect Fishy`);
        if (haveFishyPipe && haveEffect($effect`Fishy`) + adventureExtensionBonus < yachtzeeTurns) {
          use(1, $item`fishy pipe`);
        }
      },
    },
    {
      name: "2x Pocket Wish",
      turns: 40 + (haveFishyPipe ? 10 : 0),
      cost: 2 * mallPrice($item`pocket wish`) + bestWaterBreathingEquipment.cost,
      action: () => {
        acquire(2, $item`pocket wish`, 1.2 * mallPrice($item`pocket wish`));
        if (availableAmount($item`pocket wish`) < 2) {
          throw new Error("Unable to obtain Pocket Wish");
        }
        cliExecute(`genie effect Fishy`);
        cliExecute(`genie effect Fishy`);
        if (haveFishyPipe && haveEffect($effect`Fishy`) + adventureExtensionBonus < yachtzeeTurns) {
          use(1, $item`fishy pipe`);
        }
      },
    },
    {
      name: "The Haggling",
      turns: 50 + (haveFishyPipe ? 10 : 0),
      cost: canAdventure($location`The Brinier Deepers`)
        ? (have($effect`Lucky!`) ? 0 : mallPrice($item`11-leaf clover`)) +
          get("valueOfAdventure") +
          bestWaterBreathingEquipment.cost +
          fishyCloverAdventureOpportunityCost(haveFishyPipe)
        : Infinity,
      action: () => {
        if (!have($effect`Lucky!`)) {
          acquire(1, $item`11-leaf clover`, 1.2 * mallPrice($item`11-leaf clover`));
          if (!have($item`11-leaf clover`)) {
            throw new Error("Unable to get 11-leaf clover for fishy!");
          }
          use(1, $item`11-leaf clover`);
        }
        if (haveFishyPipe) use(1, $item`fishy pipe`);
        adventureMacro($location`The Brinier Deepers`, Macro.abort());
        if (get("lastAdventure") !== "The Brinier Deepers") {
          print(
            "We failed to adventure in The Brinier Deepers, even though we thought we could. Try manually adventuring there for a lucky adventure.",
            "red"
          );
        }
        if (haveFishyPipe && haveEffect($effect`Fishy`) + adventureExtensionBonus < yachtzeeTurns) {
          use(1, $item`fishy pipe`);
        }
        if (haveEffect($effect`Fishy`) < yachtzeeTurns) {
          throw new Error("Failed to get fishy from clover adv");
        }
      },
    },
    {
      name: "Just Fishy Pipe",
      turns: 10,
      cost: haveFishyPipe ? bestWaterBreathingEquipment.cost : Infinity,
      action: () => {
        if (haveFishyPipe && haveEffect($effect`Fishy`) < yachtzeeTurns) use(1, $item`fishy pipe`);
      },
    },
  ];

  const bestFishySource = maxBy(
    fishySources.filter((source) => source.turns + haveEffect($effect`Fishy`) >= yachtzeeTurns),
    "cost",
    true
  );

  print("Cost of viable Fishy sources:", "blue");
  fishySources
    .filter((source) => source.turns + haveEffect($effect`Fishy`) >= yachtzeeTurns)
    .forEach((source) => {
      print(`${source.name} (${source.cost})`, "blue");
    });
  if (setup) {
    print(`Taking best fishy source: ${bestFishySource.name}`, "blue");
    bestFishySource.action();
  }
  return bestFishySource.cost;
}

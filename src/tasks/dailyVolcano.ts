import { AcquireItem, Quest } from "grimoire-kolmafia";
import {
  cliExecute,
  Item,
  myHp,
  myMaxhp,
  print,
  restoreHp,
  retrieveItem,
  retrievePrice,
  runChoice,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $item,
  $items,
  $skill,
  get,
  have,
  maxBy,
  property,
  realmAvailable,
  uneffect,
  withProperty,
} from "libram";
import { globalOptions } from "../config";
import { HIGHLIGHT, logMessage } from "../lib";
import { garboValue } from "../garboValue";
import { GarboTask } from "./engine";

type VolcanoItem = { quantity: number; item: Item; choice: number };

function volcanoItemValue({ quantity, item }: VolcanoItem): number {
  if (item === $item`fused fuse`) {
    // Check if clara's bell is available and unused
    if (!have($item`Clara's bell`) || globalOptions.clarasBellClaimed) return Infinity;
    // Check if we can use Clara's bell for Yachtzee
    // If so, we call the opportunity cost of this about 40k
    if (realmAvailable("sleaze") && have($item`fishy pipe`) && !get("_fishyPipeUsed")) {
      return quantity * 40000;
    } else {
      return quantity * get("valueOfAdventure");
    }
  }

  if (!item.tradeable) return Infinity;
  return quantity * retrievePrice(item);
}

function checkVolcanoQuest() {
  print("Checking volcano quest", HIGHLIGHT);
  visitUrl("place.php?whichplace=airport_hot&action=airport4_questhub");
  const volcoinoValue = garboValue($item`Volcoino`);
  const bestItem = maxBy(
    [
      {
        item: property.getItem("_volcanoItem1") ?? $item.none,
        quantity: get("_volcanoItemCount1"),
        choice: 1,
      },
      {
        item: property.getItem("_volcanoItem2") ?? $item.none,
        quantity: get("_volcanoItemCount2"),
        choice: 2,
      },
      {
        item: property.getItem("_volcanoItem3") ?? $item.none,
        quantity: get("_volcanoItemCount3"),
        choice: 3,
      },
    ],
    volcanoItemValue,
    true,
  );
  if (bestItem.item === $item`fused fuse`) {
    globalOptions.clarasBellClaimed = true;
    logMessage("Grab a fused fused with your clara's bell charge while overdrunk!");
  } else if (volcanoItemValue(bestItem) < volcoinoValue) {
    withProperty("autoBuyPriceLimit", volcoinoValue, () =>
      retrieveItem(bestItem.item, bestItem.quantity),
    );
    visitUrl("place.php?whichplace=airport_hot&action=airport4_questhub");
    runChoice(bestItem.choice);
  }
}

const DailyVolcanoTasks: GarboTask[] = [
  {
    name: "Quest",
    ready: () => realmAvailable("hot"),
    completed: () => get("_volcanoItemRedeemed"),
    do: checkVolcanoQuest,
  },
  {
    name: "Free Volcoino",
    ready: () => realmAvailable("hot"),
    completed: () => get("_infernoDiscoVisited"),
    do: (): void => {
      visitUrl("place.php?whichplace=airport_hot&action=airport4_zone1");
      runChoice(7);
    },
    acquire: () =>
      $items`smooth velvet pocket square, smooth velvet socks, smooth velvet hat, smooth velvet shirt, smooth velvet hanky, smooth velvet pants`.map(
        (x) => <AcquireItem>{ item: x },
      ),
    outfit: { modifier: "disco style" },
  },
  {
    name: "Free Mining",
    ready: () => realmAvailable("hot") && have($skill`Unaccompanied Miner`),
    completed: () => get("_unaccompaniedMinerUsed") >= 5,
    do: () => cliExecute(`minevolcano.ash ${5 - get("_unaccompaniedMinerUsed")}`),
    prepare: () => restoreHp(myMaxhp() * 0.9),
    post: (): void => {
      if (have($effect`Beaten Up`)) {
        uneffect($effect`Beaten Up`);
      }
      if (myHp() < myMaxhp() * 0.5) {
        restoreHp(myMaxhp() * 0.9);
      }
    },
  },
];

export const VolcanoQuest: Quest<GarboTask> = {
  name: "Volcano",
  tasks: DailyVolcanoTasks,
};

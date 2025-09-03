import {
  Item,
  print,
  retrieveItem,
  retrievePrice,
  runChoice,
  visitUrl,
} from "kolmafia";
import { $item, get, have, maxBy, property, set, withProperty } from "libram";
import { globalOptions } from "../config";
import { garboValue } from "../garboValue";
import { HIGHLIGHT } from "../lib";
import { acquire } from "../acquire";
import { claimClaraVolcoino, willYachtzee } from "./yachtzee";

type VolcanoItem = { quantity: number; item: Item; choice: number };

function volcanoQuestItemCost({ quantity, item }: VolcanoItem): number {
  if (item === $item`fused fuse`) {
    // Check if clara's bell is available and unused
    if (!have($item`Clara's bell`) || get("_claraBellUsed")) return Infinity;
    if (willYachtzee()) {
      return garboValue($item`Volcoino`) - (20000 - get("valueOfAdventure"));
    }
    return quantity * get("valueOfAdventure");
  }

  if (!item.tradeable) return Infinity;
  return quantity * retrievePrice(item);
}

export function checkVolcanoQuest() {
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
    volcanoQuestItemCost,
    true,
  );
  if (bestItem.item === $item`fused fuse`) {
    claimClaraVolcoino();
  } else if (volcanoQuestItemCost(bestItem) < volcoinoValue) {
    withProperty("autoBuyPriceLimit", volcoinoValue, () =>
      retrieveItem(bestItem.item, bestItem.quantity),
    );
    visitUrl("place.php?whichplace=airport_hot&action=airport4_questhub");
    runChoice(bestItem.choice);
  }
}

let _attemptCompletingBarfQuest = true;
export function attemptCompletingBarfQuest(): boolean {
  return _attemptCompletingBarfQuest;
}

export function completeBarfQuest(): void {
  if (!_attemptCompletingBarfQuest) return;

  if (get("questEStGiveMeFuel") === "started") {
    const globuleCosts = retrievePrice($item`toxic globule`, 20);
    if (globuleCosts < 3 * garboValue($item`FunFunds™`)) {
      print(
        `The cost of 20 toxic globules (${globuleCosts}) is less than the profits expected from 3 FunFunds™ (${
          3 * garboValue($item`FunFunds™`)
        }). Proceeding to acquire toxic globules.`,
        "green",
      );
      _attemptCompletingBarfQuest =
        acquire(20, $item`toxic globule`, (1.5 * globuleCosts) / 20, false) >=
        20;
    } else {
      _attemptCompletingBarfQuest = false;
      print(
        `The cost of 20 toxic globules (${globuleCosts}) exceeds the profits expected from 3 FunFunds™ (${
          3 * garboValue($item`FunFunds™`)
        }). Consider farming some globules yourself.`,
        "red",
      );
    }
  }
  if (
    get("questEStSuperLuber") === "step2" ||
    get("questEStGiveMeFuel") === "step1"
  ) {
    print("Completing Barf Quest", "blue");
    visitUrl("place.php?whichplace=airport_stench&action=airport3_kiosk");
    visitUrl("choice.php?whichchoice=1066&pwd&option=3");
  }
  return;
}

export function checkBarfQuest(): void {
  const page = visitUrl(
    "place.php?whichplace=airport_stench&action=airport3_kiosk",
  );

  // If we are on an assignment, try completing and then return after
  if (page.includes("Current Assignment")) {
    return completeBarfQuest();
  }

  // If there are no available nor current assignments, then we are done for the day
  if (!page.includes("Available Assignments")) {
    // Reset prefs to unstarted just in case (since they do not automatically reset on rollover)
    set("questEStSuperLuber", "unstarted");
    set("questEStGiveMeFuel", "unstarted");
    return;
  }

  const targets = globalOptions.nobarf
    ? ["Electrical Maintenance"]
    : ["Track Maintenance", "Electrical Maintenance"]; // In decreasing order of priority

  // Page includes Track/Electrical Maintenance and we aren't on an assignment -> choose assignment
  const quests = [
    page
      .match("(width=250>)(.*?)(value=1>)")?.[2]
      ?.match("(<b>)(.*?)(</b>)")?.[2] ?? "",
    page
      .match("(value=1>)(.*?)(value=2>)")?.[2]
      ?.match("(<b>)(.*?)(</b>)")?.[2] ?? "",
  ];
  print("Barf Quests Available:", "blue");
  quests.forEach((quest) => print(quest, "blue"));

  // If page does not include Track/Electrical Maintenance quest, return
  if (!targets.some((target) => page.includes(target))) {
    print("No suitable Barf Quests available.", "red");
    return;
  }

  for (const target of targets) {
    for (const [idx, qst] of quests.entries()) {
      if (target === qst) {
        print(`Accepting Barf Quest: ${qst}`, "blue");
        visitUrl(`choice.php?whichchoice=1066&pwd&option=${idx + 1}`);
        return completeBarfQuest();
      }
    }
  }
  return;
}

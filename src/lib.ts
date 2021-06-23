import { canAdv } from "canadv.ash";
import {
  buy,
  cliExecute,
  haveSkill,
  mallPrice,
  myPrimestat,
  print,
  runChoice,
  toItem,
  toUrl,
  use,
  useSkill,
  visitUrl,
} from "kolmafia";
import { $effect, $item, $items, $location, $skill, get, have, property, set } from "libram";

export function setChoice(adventure: number, value: number) {
  set(`choiceAdventure${adventure}`, `${value}`);
}

export function ensureEffect(effect: Effect) {
  if (!have(effect)) cliExecute(effect.default);
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

export function mapMonster(location: Location, monster: Monster) {
  if (
    haveSkill($skill`Map the Monsters`) &&
    !get("mappingMonsters") &&
    get("_monstersMapped") < 3
  ) {
    useSkill($skill`Map the Monsters`);
  }

  if (!get("mappingMonsters")) throw "Failed to setup Map the Monsters.";

  const mapPage = visitUrl(toUrl(location), false, true);
  if (!mapPage.includes("Leading Yourself Right to Them")) throw "Something went wrong mapping.";

  const fightPage = visitUrl(
    `choice.php?pwd&whichchoice=1435&option=1&heyscriptswhatsupwinkwink=${monster.id}`
  );
  if (!fightPage.includes(monster.name)) throw "Something went wrong starting the fight.";
}

export function averagePrice(items: Item[]) {
  return items.reduce((s, it) => s + mallPrice(it), 0) / items.length;
}

export function argmax<T>(values: [T, number][]) {
  return values.reduce(([minValue, minScore], [value, score]) =>
    score > minScore ? [value, score] : [minValue, minScore]
  )[0];
}

export function questStep(questName: string) {
  const stringStep = property.getString(questName);
  if (stringStep === "unstarted" || stringStep === "") return -1;
  else if (stringStep === "started") return 0;
  else if (stringStep === "finished") return 999;
  else {
    if (stringStep.substring(0, 4) !== "step") {
      throw "Quest state parsing error.";
    }
    return parseInt(stringStep.substring(4), 10);
  }
}

export function voterSetup() {
  if (have($item`"I Voted!" sticker`) || !(get("voteAlways") || get("_voteToday"))) return;
  visitUrl("place.php?whichplace=town_right&action=townright_vote");

  const votingMonsterPriority = [
    "terrible mutant",
    "angry ghost",
    "government bureaucrat",
    "annoyed snake",
    "slime blob",
  ];

  const initPriority = new Map<string, number>([
    ["Meat Drop: +30", 10],
    ["Item Drop: +15", 9],
    ["Familiar Experience: +2", 8],
    ["Adventures: +1", 7],
    ["Monster Level: +10", 5],
    [`${myPrimestat()} Percent: +25`, 3],
    [`Experience (${myPrimestat()}): +4`, 2],
    ["Meat Drop: -30", -2],
    ["Item Drop: -15", -2],
    ["Familiar Experience: -2", -2],
  ]);

  const monsterVote =
    votingMonsterPriority.indexOf(get("_voteMonster1")) <
    votingMonsterPriority.indexOf(get("_voteMonster2"))
      ? 1
      : 2;

  const voteLocalPriorityArr = [
    initPriority.get(get("_voteLocal1")) || get("_voteLocal1").indexOf("-") === -1 ? 1 : -1,
    initPriority.get(get("_voteLocal2")) || get("_voteLocal2").indexOf("-") === -1 ? 1 : -1,
    initPriority.get(get("_voteLocal3")) || get("_voteLocal3").indexOf("-") === -1 ? 1 : -1,
    initPriority.get(get("_voteLocal4")) || get("_voteLocal4").indexOf("-") === -1 ? 1 : -1,
  ];

  const bestVotes = voteLocalPriorityArr.sort((a, b) => a - b);
  const firstPriority = bestVotes[0];
  const secondPriority = bestVotes[1];

  const firstInit = voteLocalPriorityArr.indexOf(firstPriority);
  const secondInit = voteLocalPriorityArr.indexOf(secondPriority);

  visitUrl(
    `choice.php?option=1&whichchoice=1331&g=${monsterVote}&local[]=${firstInit}&local[]=${secondInit}`
  );
}
interface zonePotion {
  zone: String;
  effect: Effect;
  potion: Item;
}

const zonePotions = [
  {
    zone: "Spaaace",
    effect: $effect`Transpondent`,
    potion: $item`transporter transponder`,
  },
  {
    zone: "Wormwood",
    effect: $effect`absinthe-minded`,
    potion: $item`tiny bottle of absinthe`,
  },
];

export function prepWandererZone() {
  const defaultLocation =
    get("_spookyAirportToday") || get("spookyAirportAlways")
      ? $location`the deep dark jungle`
      : $location`noob cave`;
  if (!have($item`guzzlr tablet`)) return defaultLocation;
  if (get("questGuzzlr") === "unstarted") {
    if (
      get("_guzzlrPlatinumDeliveries") === 0 &&
      get("guzzlrGoldDeliveries") >= 5 &&
      (get("guzzlrPlatinumDeliveries") < 30 ||
        (get("guzzlrGoldDeliveries") >= 150 && get("guzzlrBronzeDeliveries") >= 196))
    ) {
      set("choiceAdventure1412", 4);
      use(1, $item`guzzlr tablet`);
    } else if (
      get("_guzzlrGoldDeliveries") < 3 &&
      get("guzzlrBronzeDeliveries") >= 5 &&
      (get("guzzlrGoldDeliveries") < 150 || get("guzzlrBronzeDeliveries") >= 196)
    ) {
      set("choiceAdventure1412", 3);
      use(1, $item`guzzlr tablet`);
    } else {
      set("choiceAdventure1412", 2);
      use(1, $item`guzzlr tablet`);
    }
  }

  if (get("questGuzzlr") !== "unstarted") {
    if (!guzzlrCheck() && !get("_guzzlrQuestAbandoned")) {
      dropGuzzlrQuest();
    }
  }

  if (get("questGuzzlr") === "unstarted") {
    if (
      get("_guzzlrPlatinumDeliveries") === 0 &&
      get("guzzlrGoldDeliveries") >= 5 &&
      (get("guzzlrPlatinumDeliveries") < 30 ||
        (get("guzzlrGoldDeliveries") >= 150 && get("guzzlrBronzeDeliveries") >= 196))
    ) {
      set("choiceAdventure1412", 4);
      use(1, $item`guzzlr tablet`);
    } else if (
      get("_guzzlrGoldDeliveries") < 3 &&
      get("guzzlrBronzeDeliveries") >= 5 &&
      (get("guzzlrGoldDeliveries") < 150 || get("guzzlrBronzeDeliveries") >= 196)
    ) {
      set("choiceAdventure1412", 3);
      use(1, $item`guzzlr tablet`);
    } else {
      set("choiceAdventure1412", 2);
      use(1, $item`guzzlr tablet`);
    }
  }

  const guzzlZone = get("guzzlrQuestLocation");
  if (!guzzlrCheck()) return defaultLocation;
  else if (!guzzlZone) return defaultLocation;
  else {
    if (get("guzzlrQuestTier") === "platinum") {
      zonePotions.forEach((place) => {
        if (guzzlZone.zone === place.zone && !have(place.effect)) {
          if (!have(place.potion)) {
            buy(1, place.potion, 10000);
          }
          use(1, place.potion);
        }
      });
    }
    if (property.getString("guzzlrQuestBooze") === "Guzzlr cocktail set") {
      if (
        !$items`buttery boy, steamboat, ghiaccio colada, nog-on-the-cob, sourfinger`.some((drink) =>
          have(drink)
        )
      ) {
        cliExecute("make buttery boy");
      }
    } else {
      const guzzlrBooze = toItem(get("guzzlrQuestBooze"));
      if (guzzlrBooze === $item`none`) {
        return defaultLocation;
      } else if (!have(guzzlrBooze)) {
        print(`just picking up some booze before we roll`, "blue");
        cliExecute("acquire " + get("guzzlrQuestBooze"));
      }
    }
    return guzzlZone;
  }
}

function guzzlrCheck() {
  const guzzlZone = get("guzzlrQuestLocation");
  if (!guzzlZone) return false;
  const forbiddenZones: String[] = ["The Rabbit Hole"]; //can't stockpile these potions,
  if (!get("_spookyAirportToday") && !get("spookyAirportAlways")) {
    forbiddenZones.push("Conspiracy Island");
  }
  if (!get("_stenchAirportToday") && !get("stenchAirportAlways")) {
    forbiddenZones.push("Dinseylandfill");
  }
  if (!get("_hotAirportToday") && !get("hotAirportAlways")) {
    forbiddenZones.push("That 70s Volcano");
  }
  if (!get("_coldAirportToday") && !get("coldAirportAlways")) {
    forbiddenZones.push("The Glaciest");
  }
  if (!get("_sleazeAirportToday") && !get("sleazeAirportAlways")) {
    forbiddenZones.push("Spring Break Beach");
  }

  zonePotions.forEach((place) => {
    if (guzzlZone.zone === place.zone && !have(place.effect)) {
      if (!have(place.potion)) {
        buy(1, place.potion, 10000);
      }
      use(1, place.potion);
    }
  });
  if (
    forbiddenZones.includes(guzzlZone.zone) ||
    !guzzlZone.wanderers ||
    guzzlZone === $location`The Oasis` ||
    guzzlZone === $location`The Bubblin' Caldera` ||
    guzzlZone.environment === "underwater" ||
    guzzlZone === $location`Barrrney's Barrr` ||
    guzzlZone === $location`The F'c'le` ||
    guzzlZone === $location`the poop deck` ||
    guzzlZone === $location`belowdecks` ||
    guzzlZone === $location`8-Bit Realm` ||
    (guzzlZone.zone === "BatHole" && guzzlZone !== $location`The Bat Hole Entrance`) ||
    guzzlZone === $location`The Secret Government Laboratory` ||
    !canAdv(guzzlZone, false)
  ) {
    return false;
  } else {
    return true;
  }
}

function dropGuzzlrQuest() {
  print("We hate this guzzlr quest!", "blue");
  set("choiceAdventure1412", "");
  visitUrl("inventory.php?tap=guzzlr", false);
  runChoice(1);
  runChoice(5);
}

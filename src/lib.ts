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
  useFamiliar,
  useSkill,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $item,
  $items,
  $location,
  $locations,
  $skill,
  get,
  have,
  Macro,
  property,
  set,
} from "libram";

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
  {
    zone: "RabbitHole",
    effect: $effect`Down the Rabbit Hole`,
    potion: $item`"DRINK ME" potion`,
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
  const forbiddenZones: String[] = [""]; //can't stockpile these potions,
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
  const blacklist = $locations`The Oasis, The Bubblin' Caldera, Barrrney's Barrr, The F'c'le, The Poop Deck, Belowdecks, 8-Bit Realm, The Batrat and Ratbat Burrow, Guano Junction, The Beanbat Chamber, Madness Bakery, The Secret Government Laboratory`;
  if (
    forbiddenZones.includes(guzzlZone.zone) ||
    blacklist.includes(guzzlZone) ||
    !guzzlZone.wanderers ||
    guzzlZone.environment === "underwater" ||
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

export const physicalImmuneMacro = Macro.trySkill("curse of weaksauce")
  .trySkill("sing along")
  .trySkill("extract")
  .externalIf(have($skill`saucestorm`), Macro.skill("Saucestorm").repeat())
  .externalIf(have($skill`saucegeyser`), Macro.skill("Saucegeyser").repeat())
  .externalIf(have($skill`Cannelloni Cannon`), Macro.skill("Cannelloni Cannon").repeat())
  .externalIf(have($skill`Wave of Sauce`), Macro.skill("Wave of Sauce").repeat())
  .externalIf(have($skill`Saucecicle`), Macro.skill("Saucecicle").repeat()); //The Freezewoman is spooky-aligned, don't worry

export function tryFeast(familiar: Familiar) {
  if (have(familiar)) {
    useFamiliar(familiar);
    use($item`moveable feast`);
  }
}

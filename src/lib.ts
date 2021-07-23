import { canAdv } from "canadv.ash";
import {
  autosellPrice,
  buy,
  cliExecute,
  haveSkill,
  mallPrice,
  myFamiliar,
  numericModifier,
  print,
  restoreMp,
  totalTurnsPlayed,
  toUrl,
  use,
  useFamiliar,
  useSkill,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $locations,
  $skill,
  Bandersnatch,
  get,
  getFoldGroup,
  getSongCount,
  getSongLimit,
  Guzzlr,
  have,
  Macro,
  property,
  set,
} from "libram";
import { meatFamiliar } from "./familiar";
import { baseMeat } from "./mood";
import { Requirement } from "./outfit";

export function setChoice(adventure: number, value: number): void {
  set(`choiceAdventure${adventure}`, `${value}`);
}

export function ensureEffect(effect: Effect): void {
  if (!have(effect)) cliExecute(effect.default);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

/**
 * Sum an array of numbers.
 * @param addends Addends to sum.
 */
export function sum(addends: number[]): number {
  return addends.reduce((s, n) => s + n, 0);
}

export function mapMonster(location: Location, monster: Monster): void {
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

export function argmax<T>(values: [T, number][]): T {
  return values.reduce(([minValue, minScore], [value, score]) =>
    score > minScore ? [value, score] : [minValue, minScore]
  )[0];
}

export function questStep(questName: string): number {
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

interface ZonePotion {
  zone: string;
  effect: Effect;
  potion: Item;
}

const zonePotions: ZonePotion[] = [
  {
    zone: "Spaaace",
    effect: $effect`Transpondent`,
    potion: $item`transporter transponder`,
  },
  {
    zone: "Wormwood",
    effect: $effect`Absinthe-Minded`,
    potion: $item`tiny bottle of absinthe`,
  },
  {
    zone: "RabbitHole",
    effect: $effect`Down the Rabbit Hole`,
    potion: $item`"DRINK ME" potion`,
  },
];

function acceptBestGuzzlrQuest() {
  if (!Guzzlr.isQuestActive()) {
    if (
      Guzzlr.canPlatinum() &&
      (!Guzzlr.haveFullPlatinumBonus() ||
        (Guzzlr.haveFullBronzeBonus() && Guzzlr.haveFullGoldBonus()))
    ) {
      Guzzlr.acceptPlatinum();
    } else if (Guzzlr.canGold() && (!Guzzlr.haveFullGoldBonus() || Guzzlr.haveFullBronzeBonus())) {
      Guzzlr.acceptGold();
    } else {
      Guzzlr.acceptBronze();
    }
  }
}

export function prepWandererZone(): Location {
  const defaultLocation =
    get("_spookyAirportToday") || get("spookyAirportAlways")
      ? $location`The Deep Dark Jungle`
      : $location`Noob Cave`;
  if (!Guzzlr.have()) return defaultLocation;

  acceptBestGuzzlrQuest();
  if (!guzzlrCheck()) Guzzlr.abandon();
  acceptBestGuzzlrQuest();

  const guzzlZone = Guzzlr.getLocation();
  if (!guzzlrCheck()) return defaultLocation;
  else if (!guzzlZone) return defaultLocation;
  else {
    if (Guzzlr.getTier() === "platinum") {
      zonePotions.forEach((place) => {
        if (guzzlZone.zone === place.zone && !have(place.effect)) {
          if (!have(place.potion)) {
            buy(1, place.potion, 10000);
          }
          use(1, place.potion);
        }
      });
      if (!Guzzlr.havePlatinumBooze()) {
        cliExecute("make buttery boy");
      }
    } else {
      const guzzlrBooze = Guzzlr.getBooze();
      if (!guzzlrBooze) {
        return defaultLocation;
      } else if (!have(guzzlrBooze)) {
        print(`just picking up some booze before we roll`, "blue");
        cliExecute(`acquire ${guzzlrBooze}`);
      }
    }
    return guzzlZone;
  }
}

function guzzlrCheck() {
  const guzzlZone = Guzzlr.getLocation();
  if (!guzzlZone) return false;
  const forbiddenZones: string[] = [""]; //can't stockpile these potions,
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
  const blacklist = $locations`The Oasis, The Bubblin' Caldera, Barrrney's Barrr, The F'c'le, The Poop Deck, Belowdecks, 8-Bit Realm, The Batrat and Ratbat Burrow, Guano Junction, The Beanbat Chamber, Madness Bakery, The Secret Government Laboratory, The Overgrown Lot, The Skeleton Store`;
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

export const physicalImmuneMacro = Macro.trySkill("curse of weaksauce")
  .trySkill("sing along")
  .trySkill("extract")
  .externalIf(have($skill`Saucestorm`), Macro.skill("Saucestorm").repeat())
  .externalIf(have($skill`Saucegeyser`), Macro.skill("Saucegeyser").repeat())
  .externalIf(have($skill`Cannelloni Cannon`), Macro.skill("Cannelloni Cannon").repeat())
  .externalIf(have($skill`Wave of Sauce`), Macro.skill("Wave of Sauce").repeat())
  .externalIf(have($skill`Saucecicle`), Macro.skill("Saucecicle").repeat()); //The Freezewoman is spooky-aligned, don't worry

export function tryFeast(familiar: Familiar): void {
  if (have(familiar)) {
    useFamiliar(familiar);
    use($item`moveable feast`);
  }
}

export class FreeRun {
  name: string;
  available: () => boolean;
  macro: Macro;
  requirement?: Requirement;
  prepare?: () => void;

  constructor(
    name: string,
    available: () => boolean,
    macro: Macro,
    requirement?: Requirement,
    prepare?: () => void
  ) {
    this.name = name;
    this.available = available;
    this.macro = macro;
    this.requirement = requirement;
    this.prepare = prepare;
  }
}

const banishesToUse = questStep("questL11Worship") > 0 && get("_drunkPygmyBanishes") === 0 ? 2 : 3;

const freeRuns: FreeRun[] = [
  /*
  new freeRun(
     () => {
      if (getWorkshed() !== $item`Asdon Martin keyfob`) return false;
      const banishes = get("banishedMonsters").split(":");
      const bumperIndex = banishes
        .map((string) => string.toLowerCase())
        .indexOf("spring-loaded front bumper");
      if (bumperIndex === -1) return true;
      return myTurncount() - parseInt(banishes[bumperIndex + 1]) > 30;
    },
    () => {
      fillAsdonMartinTo(50);
      retrieveItem(1, $item`louder than bomb`);
    },
    Macro.trySkill("Asdon Martin: Spring-Loaded Front Bumper").item("louder than bomb")
  ),
  code removed because of boss monsters
  */

  new FreeRun(
    "Bander",
    () =>
      have($familiar`Frumious Bandersnatch`) &&
      (have($effect`Ode to Booze`) || getSongCount() < getSongLimit()) &&
      Bandersnatch.getRemainingRunaways() > 0,
    Macro.trySkill("Asdon Martin: Spring-Loaded Front Bumper").step("runaway"),
    new Requirement(["Familiar Weight"], {}),
    () => {
      useFamiliar($familiar`Frumious Bandersnatch`);
      ensureEffect($effect`Ode to Booze`);
    }
  ),

  new FreeRun(
    "Boots",
    () => have($familiar`Pair of Stomping Boots`) && Bandersnatch.getRemainingRunaways() > 0,
    Macro.trySkill("Asdon Martin: Spring-Loaded Front Bumper").step("runaway"),
    new Requirement(["Familiar Weight"], {}),
    () => useFamiliar($familiar`Pair of Stomping Boots`)
  ),

  new FreeRun(
    "Snokebomb",
    () => get("_snokebombUsed") < banishesToUse && have($skill`Snokebomb`),
    Macro.trySkill("Asdon Martin: Spring-Loaded Front Bumper").skill("snokebomb"),
    undefined,
    () => restoreMp(50)
  ),

  new FreeRun(
    "Hatred",
    () => get("_feelHatredUsed") < banishesToUse && have($skill`Emotionally Chipped`),
    Macro.trySkill("Asdon Martin: Spring-Loaded Front Bumper").skill("feel hatred")
  ),

  new FreeRun(
    "KGB",
    () => have($item`Kremlin's Greatest Briefcase`) && get("_kgbTranquilizerDartUses") < 3,
    Macro.trySkill("Asdon Martin: Spring-Loaded Front Bumper").skill("KGB tranquilizer dart"),
    new Requirement([], { forceEquip: $items`Kremlin's Greatest Briefcase` })
  ),

  new FreeRun(
    "Latte",
    () => have($item`latte lovers member's mug`) && !get("_latteBanishUsed"),
    Macro.trySkill("Asdon Martin: Spring-Loaded Front Bumper").skill("Throw Latte on Opponent"),
    new Requirement([], { forceEquip: $items`latte lovers member's mug` })
  ),

  new FreeRun(
    "Docbag",
    () => have($item`Lil' Doctor™ bag`) && get("_reflexHammerUsed") < 3,
    Macro.trySkill("Asdon Martin: Spring-Loaded Front Bumper").skill("reflex hammer"),
    new Requirement([], { forceEquip: $items`Lil' Doctor™ bag` })
  ),

  new FreeRun(
    "Middle Finger",
    () => have($item`mafia middle finger ring`) && !get("_mafiaMiddleFingerRingUsed"),
    Macro.trySkill("Asdon Martin: Spring-Loaded Front Bumper").skill("Show them your ring"),
    new Requirement([], { forceEquip: $items`mafia middle finger ring` })
  ),

  new FreeRun(
    "VMask",
    () => have($item`V for Vivala mask`) && !get("_vmaskBanisherUsed"),
    Macro.trySkill("Asdon Martin: Spring-Loaded Front Bumper").skill("Creepy Grin"),
    new Requirement([], { forceEquip: $items`V for Vivala mask` }),
    () => restoreMp(30)
  ),

  new FreeRun(
    "Stinkeye",
    () =>
      getFoldGroup($item`stinky cheese diaper`).some((item) => have(item)) &&
      !get("_stinkyCheeseBanisherUsed"),

    Macro.trySkill("Asdon Martin: Spring-Loaded Front Bumper").skill(
      "Give Your Opponent the Stinkeye"
    ),
    new Requirement([], { forceEquip: $items`stinky cheese eye` }),
    () => {
      if (!have($item`stinky cheese eye`)) cliExecute(`fold stinky cheese eye`);
    }
  ),

  new FreeRun(
    "Scrapbook",
    () => have($item`familiar scrapbook`) && get("scrapbookCharges") >= 100,
    Macro.trySkill("Asdon Martin: Spring-Loaded Front Bumper").skill(
      "Show Your Boring Familiar Pictures"
    ),
    new Requirement([], { forceEquip: $items`familiar scrapbook` })
  ),

  new FreeRun(
    "Navel Ring",
    () => have($item`navel ring of navel gazing`) && get("_navelRunaways") < 3,
    Macro.trySkill("Asdon Martin: Spring-Loaded Front Bumper").step("runaway"),
    new Requirement([], { forceEquip: $items`navel ring of navel gazing` })
  ),

  new FreeRun(
    "GAP",
    () => have($item`Greatest American Pants`) && get("_navelRunaways") < 3,
    Macro.trySkill("Asdon Martin: Spring-Loaded Front Bumper").step("runaway"),
    new Requirement([], { forceEquip: $items`Greatest American Pants` })
  ),
];

export function findRun(useFamiliar = true): FreeRun | undefined {
  return freeRuns.find(
    (run) => run.available() && (useFamiliar || !["Bander", "Boots"].includes(run.name))
  );
}

const valueMap: Map<Item, number> = new Map();

const MALL_VALUE_MODIFIER = 0.9;

export function trueValue(...items: Item[]): number {
  return (
    items
      .map((item) => {
        if (valueMap.has(item)) return valueMap.get(item) || 0;
        if (item.discardable) {
          valueMap.set(
            item,
            mallPrice(item) > Math.max(2 * autosellPrice(item), 100)
              ? MALL_VALUE_MODIFIER * mallPrice(item)
              : autosellPrice(item)
          );
        } else {
          valueMap.set(item, mallPrice(item) > 100 ? MALL_VALUE_MODIFIER * mallPrice(item) : 0);
        }
        return valueMap.get(item) || 0;
      })
      .reduce((s, price) => s + price, 0) / items.length
  );
}

enum BjornModifierType {
  MEAT,
  ITEM,
  FMWT,
}

type BjornModifier = {
  type: BjornModifierType;
  modifier: number;
};

type BjornedFamiliar = {
  familiar: Familiar;
  meatVal: () => number;
  probability: number;
  modifier?: BjornModifier;
  dropPredicate?: () => boolean;
};

const bjornFams: BjornedFamiliar[] = [
  {
    familiar: $familiar`Puck Man`,
    meatVal: () => trueValue($item`yellow pixel`),
    probability: 0.25,
    dropPredicate: () => get("_yellowPixelDropsCrown") < 25,
  },
  {
    familiar: $familiar`Ms. Puck Man`,
    meatVal: () => trueValue($item`yellow pixel`),
    probability: 0.25,
    dropPredicate: () => get("_yellowPixelDropsCrown") < 25,
  },
  {
    familiar: $familiar`Grimstone Golem`,
    meatVal: () => trueValue($item`grimstone mask`),
    probability: 0.5,
    dropPredicate: () => get("_grimstoneMaskDropsCrown") < 1,
  },
  {
    familiar: $familiar`Knob Goblin Organ Grinder`,
    meatVal: () => 30,
    probability: 1,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 25,
    },
  },
  {
    familiar: $familiar`Happy Medium`,
    meatVal: () => 30,
    probability: 1,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 25,
    },
  },
  {
    familiar: $familiar`Garbage Fire`,
    meatVal: () => trueValue($item`burning newspaper`),
    probability: 0.5,
    dropPredicate: () => get("_garbageFireDropsCrown") < 3,
  },
  {
    familiar: $familiar`Machine Elf`,
    meatVal: () =>
      trueValue(
        ...$items`abstraction: sensation, abstraction: thought, abstraction: action, abstraction: category, abstraction: perception, abstraction: purpose`
      ),
    probability: 0.2,
    dropPredicate: () => get("_abstractionDropsCrown") < 25,
  },
  {
    familiar: $familiar`Trick-or-Treating Tot`,
    meatVal: () => trueValue($item`hoarded candy wad`),
    probability: 0.5,
    dropPredicate: () => get("_hoardedCandyDropsCrown") < 3,
  },
  {
    familiar: $familiar`Warbear Drone`,
    meatVal: () => trueValue($item`warbear whosit`),
    probability: 1 / 4.5,
  },
  {
    familiar: $familiar`Li'l Xenomorph`,
    meatVal: () => trueValue($item`lunar isotope`),
    probability: 0.05,
    modifier: {
      type: BjornModifierType.ITEM,
      modifier: 15,
    },
  },
  {
    familiar: $familiar`Pottery Barn Owl`,
    meatVal: () => trueValue($item`volcanic ash`),
    probability: 0.1,
  },
  {
    familiar: $familiar`Grim Brother`,
    meatVal: () => trueValue($item`grim fairy tale`),
    probability: 1,
    dropPredicate: () => get("_grimFairyTaleDropsCrown") < 2,
  },
  {
    familiar: $familiar`Optimistic Candle`,
    meatVal: () => trueValue($item`glob of melted wax`),
    probability: 1,
    dropPredicate: () => get("_optimisticCandleDropsCrown") < 3,
    modifier: {
      type: BjornModifierType.ITEM,
      modifier: 15,
    },
  },
  {
    familiar: $familiar`Adventurous Spelunker`,
    meatVal: () =>
      trueValue(
        ...$items`teflon ore, velcro ore, vinyl ore, cardboard ore, styrofoam ore, bubblewrap ore`
      ),
    probability: 1,
    dropPredicate: () => get("_oreDropsCrown") < 6,
    modifier: {
      type: BjornModifierType.ITEM,
      modifier: 15,
    },
  },
  {
    familiar: $familiar`Twitching Space Critter`,
    meatVal: () => trueValue($item`space beast fur`),
    probability: 1,
    dropPredicate: () => get("_spaceFurDropsCrown") < 1,
  },
  {
    familiar: $familiar`Party Mouse`,
    meatVal: () => 50,
    /*
    The below code is more accurate. However, party mouse is virtually never going to be worthwhile and this causes so many useless mall hits it isn't funny.

      trueValue(
        ...Item.all().filter(
          (booze) =>
            ["decent", "good"].includes(booze.quality) &&
            booze.inebriety > 0 &&
            booze.tradeable &&
            booze.discardable &&
            !$items`glass of "milk", cup of "tea", thermos of "whiskey", Lucky Lindy, Bee's Knees, Sockdollager, Ish Kabibble, Hot Socks, Phonus Balonus, Flivver, Sloppy Jalopy`.includes(
              booze
            )
        )
      ),
      */
    probability: 0.05,
  },
  {
    familiar: $familiar`Yule Hound`,
    meatVal: () => trueValue($item`candy cane`),
    probability: 1,
  },
  {
    familiar: $familiar`Gluttonous Green Ghost`,
    meatVal: () => trueValue(...$items`bean burrito, enchanted bean burrito, jumping bean burrito`),
    probability: 1,
  },
  {
    familiar: $familiar`Reassembled Blackbird`,
    meatVal: () => trueValue($item`blackberry`),
    probability: 1,
    modifier: {
      type: BjornModifierType.ITEM,
      modifier: 10,
    },
  },
  {
    familiar: $familiar`Reconstituted Crow`,
    meatVal: () => trueValue($item`blackberry`),
    probability: 1,
    modifier: {
      type: BjornModifierType.ITEM,
      modifier: 10,
    },
  },
  {
    familiar: $familiar`Hunchbacked Minion`,
    meatVal: () =>
      trueValue(
        ...$items`disembodied brain, skeleton bone, skeleton bone, skeleton bone, skeleton bone`
      ),
    probability: 1,
  },
  {
    familiar: $familiar`Reanimated Reanimator`,
    meatVal: () => trueValue(...$items`hot wing, broken skull`),
    probability: 1,
  },
  {
    familiar: $familiar`Attention-Deficit Demon`,
    meatVal: () =>
      trueValue(...$items`chorizo brownies, white chocolate and tomato pizza, carob chunk noodles`),
    probability: 1,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 20,
    },
  },
  {
    familiar: $familiar`Piano Cat`,
    meatVal: () => trueValue(...$items`beertini, papaya slung, salty slug, tomato daiquiri`),
    probability: 1,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 20,
    },
  },
  {
    familiar: $familiar`Golden Monkey`,
    meatVal: () => 100,
    probability: 0.5,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 25,
    },
  },
  {
    familiar: $familiar`Robot Reindeer`,
    meatVal: () => trueValue(...$items`candy cane, eggnog, fruitcake, gingerbread bugbear`),
    probability: 0.3,
  },
  {
    familiar: $familiar`Stocking Mimic`,
    meatVal: () =>
      trueValue(
        ...$items`Angry Farmer candy, Cold Hots candy, Rock Pops, Tasty Fun Good rice candy, Wint-O-Fresh mint`
      ),
    probability: 0.3,
  },
  {
    familiar: $familiar`BRICKO chick`,
    meatVal: () => trueValue($item`BRICKO brick`),
    probability: 1,
  },
  {
    familiar: $familiar`Cotton Candy Carnie`,
    meatVal: () => trueValue($item`cotton candy pinch`),
    probability: 1,
  },
  {
    familiar: $familiar`Untamed Turtle`,
    meatVal: () => trueValue(...$items`snailmail bits, turtlemail bits, turtle wax`),
    probability: 0.35,
  },
  {
    familiar: $familiar`Astral Badger`,
    meatVal: () => 2 * trueValue(...$items`spooky mushroom, Knob mushroom, Knoll mushroom`),
    probability: 1,
  },
  {
    familiar: $familiar`Green Pixie`,
    meatVal: () => trueValue($item`bottle of tequila`),
    probability: 0.2,
  },
  {
    familiar: $familiar`Angry Goat`,
    meatVal: () => trueValue($item`goat cheese pizza`),
    probability: 1,
  },
  {
    familiar: $familiar`Adorable Seal Larva`,
    meatVal: () =>
      trueValue(
        ...$items`stench nuggets, spooky nuggets, hot nuggets, cold nuggets, sleaze nuggets`
      ),
    probability: 0.35,
  },
  {
    familiar: $familiar`Ancient Yuletide Troll`,
    meatVal: () => trueValue(...$items`candy cane, eggnog, fruitcake, gingerbread bugbear`),
    probability: 0.3,
  },
  {
    familiar: $familiar`Sweet Nutcracker`,
    meatVal: () => trueValue(...$items`candy cane, eggnog, fruitcake, gingerbread bugbear`),
    probability: 0.3,
  },
  {
    familiar: $familiar`Casagnova Gnome`,
    meatVal: () => 0,
    probability: 0,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 20,
    },
  },
  {
    familiar: $familiar`Coffee Pixie`,
    meatVal: () => 0,
    probability: 0,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 20,
    },
  },
  {
    familiar: $familiar`Dancing Frog`,
    meatVal: () => 0,
    probability: 0,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 20,
    },
  },
  {
    familiar: $familiar`Grouper Groupie`,
    meatVal: () => 0,
    probability: 0,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 20,
    },
  },
  {
    familiar: $familiar`Hand Turkey`,
    meatVal: () => 30,
    probability: 1,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 20,
    },
  },
  {
    familiar: $familiar`Hippo Ballerina`,
    meatVal: () => 0,
    probability: 0,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 20,
    },
  },
  {
    familiar: $familiar`Jitterbug`,
    meatVal: () => 0,
    probability: 0,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 20,
    },
  },
  {
    familiar: $familiar`Leprechaun`,
    meatVal: () => 30,
    probability: 1,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 20,
    },
  },
  {
    familiar: $familiar`Obtuse Angel`,
    meatVal: () => 0,
    probability: 0,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 20,
    },
  },
  {
    familiar: $familiar`Psychedelic Bear`,
    meatVal: () => 0,
    probability: 0,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 20,
    },
  },
  {
    familiar: $familiar`Robortender`,
    meatVal: () => 0,
    probability: 0,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 20,
    },
  },
  {
    familiar: $familiar`Ghost of Crimbo Commerce`,
    meatVal: () => 30,
    probability: 1,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 25,
    },
  },
  {
    familiar: $familiar`Hobo Monkey`,
    meatVal: () => 0,
    probability: 0,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 25,
    },
  },
  {
    familiar: $familiar`Rockin' Robin`,
    meatVal: () => 60,
    probability: 1,
    modifier: {
      type: BjornModifierType.ITEM,
      modifier: 15,
    },
  },
  {
    familiar: $familiar`Feral Kobold`,
    meatVal: () => 30,
    probability: 1,
    modifier: {
      type: BjornModifierType.ITEM,
      modifier: 15,
    },
  },
  {
    familiar: $familiar`Oily Woim`,
    meatVal: () => 30,
    probability: 1,
    modifier: {
      type: BjornModifierType.ITEM,
      modifier: 10,
    },
  },
  {
    familiar: $familiar`Cat Burglar`,
    meatVal: () => 0,
    probability: 0,
    modifier: {
      type: BjornModifierType.ITEM,
      modifier: 10,
    },
  },
  {
    familiar: $familiar`Misshapen Animal Skeleton`,
    meatVal: () => 30,
    probability: 1,
    modifier: {
      type: BjornModifierType.FMWT,
      modifier: 5,
    },
  },
  {
    familiar: $familiar`Gelatinous Cubeling`,
    meatVal: () => 0,
    probability: 0,
    modifier: {
      type: BjornModifierType.FMWT,
      modifier: 5,
    },
  },
  {
    familiar: $familiar`Frozen Gravy Fairy`,
    // drops a cold nugget every combat, 5 of which can be used to make a cold wad
    meatVal: () => Math.max(0.2 * trueValue($item`cold wad`), trueValue($item`cold nuggets`)),
    probability: 1,
  },
  {
    familiar: $familiar`Stinky Gravy Fairy`,
    // drops a stench nugget every combat, 5 of which can be used to make a stench wad
    meatVal: () => Math.max(0.2 * trueValue($item`stench wad`), trueValue($item`stench nuggets`)),
    probability: 1,
  },
  {
    familiar: $familiar`Sleazy Gravy Fairy`,
    // drops a sleaze nugget every combat, 5 of which can be used to make a sleaze wad
    meatVal: () => Math.max(0.2 * trueValue($item`sleaze wad`), trueValue($item`sleaze nuggets`)),
    probability: 1,
  },
  {
    familiar: $familiar`Spooky Gravy Fairy`,
    // drops a spooky nugget every combat, 5 of which can be used to make a spooky wad
    meatVal: () => Math.max(0.2 * trueValue($item`spooky wad`), trueValue($item`spooky nuggets`)),
    probability: 1,
  },
  {
    familiar: $familiar`Flaming Gravy Fairy`,
    // drops a hot nugget every combat, 5 of which can be used to make a hot wad
    meatVal: () => Math.max(0.2 * trueValue($item`hot wad`), trueValue($item`hot nuggets`)),
    probability: 1,
  },
].filter((bjornFam) => have(bjornFam.familiar));

export enum PickBjornMode {
  FREE,
  EMBEZZLER,
  BARF,
}

const bjornLists: Map<PickBjornMode, BjornedFamiliar[]> = new Map();

function generateBjornList(mode: PickBjornMode): BjornedFamiliar[] {
  const additionalValue = (familiar: BjornedFamiliar) => {
    if (!familiar.modifier) return 0;
    const meatVal =
      mode === PickBjornMode.FREE ? 0 : baseMeat + (mode === PickBjornMode.EMBEZZLER ? 750 : 0);
    const itemVal = mode === PickBjornMode.BARF ? 72 : 0;
    if (familiar.modifier.type === BjornModifierType.MEAT)
      return (familiar.modifier.modifier * meatVal) / 100;
    if (familiar.modifier.type === BjornModifierType.ITEM)
      return (familiar.modifier.modifier * itemVal) / 100;
    if (familiar.modifier.type === BjornModifierType.FMWT) {
      const lepMultiplier = numericModifier(meatFamiliar(), "Leprechaun", 1, Item.get("none"));
      const fairyMultiplier = numericModifier(meatFamiliar(), "Fairy", 1, Item.get("none"));
      return (
        (meatVal * (10 * lepMultiplier + 5 * Math.sqrt(lepMultiplier)) +
          itemVal * (5 * fairyMultiplier + 2.5 * Math.sqrt(fairyMultiplier))) /
        100
      );
    }
    return 0;
  };
  return [...bjornFams].sort(
    (a, b) =>
      (!b.dropPredicate || (b.dropPredicate() && mode !== PickBjornMode.EMBEZZLER)
        ? b.meatVal() * b.probability
        : 0) +
      additionalValue(b) -
      ((!a.dropPredicate || (a.dropPredicate() && mode !== PickBjornMode.EMBEZZLER)
        ? a.meatVal() * a.probability
        : 0) +
        additionalValue(a))
  );
}

export function pickBjorn(mode: PickBjornMode = PickBjornMode.FREE): BjornedFamiliar {
  if (!bjornLists.has(mode)) {
    bjornLists.set(mode, generateBjornList(mode));
  }
  const bjornList = bjornLists.get(mode);
  if (bjornList) {
    while (bjornList[0].dropPredicate && !bjornList[0].dropPredicate()) bjornList.shift();
    if (myFamiliar() !== bjornList[0].familiar) return bjornList[0];
    while (bjornList[1].dropPredicate && !bjornList[1].dropPredicate()) bjornList.splice(1, 1);
    return bjornList[1];
  }
  throw new Error("Something went wrong while selecting a familiar to bjornify or crownulate");
}

export function kramcoGuaranteed(): boolean {
  return (
    have($item`Kramco Sausage-o-Matic™`) &&
    totalTurnsPlayed() - get("_lastSausageMonsterTurn") + 1 >=
      5 + 3 * get("_sausageFights") + Math.pow(Math.max(0, get("_sausageFights") - 5), 3)
  );
}

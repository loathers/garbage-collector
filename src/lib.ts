import { canAdv } from "canadv.ash";
import {
  autosellPrice,
  buy,
  cliExecute,
  equip,
  getWorkshed,
  haveSkill,
  mallPrice,
  maximize,
  myFamiliar,
  myTurncount,
  numericModifier,
  print,
  restoreMp,
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
  $familiar,
  $item,
  $items,
  $location,
  $locations,
  $skill,
  $slot,
  Bandersnatch,
  get,
  getSongCount,
  getSongLimit,
  have,
  Macro,
  property,
  set,
} from "libram";
import { fillAsdonMartinTo } from "./asdon";
import { meatFamiliar } from "./familiar";
import { baseMeat } from "./mood";

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

export class freeRun {
  available: () => boolean;
  prepare: () => void;
  macro: Macro;

  constructor(available: () => boolean, prepare: () => void, macro: Macro) {
    this.available = available;
    this.prepare = prepare;
    this.macro = macro;
  }
}

const banishesToUse = questStep("questL11Worship") > 0 && get("_drunkPygmyBanishes") === 0 ? 2 : 3;

const freeRuns: freeRun[] = [
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
    () => fillAsdonMartinTo(50),
    Macro.skill("Asdon Martin: Spring-Loaded Front Bumper")
  ),

  new freeRun(
    () =>
      ((have($familiar`frumious bandersnatch`) &&
        (have($effect`ode to booze`) || getSongCount() < getSongLimit())) ||
        have($familiar`pair of stomping boots`)) &&
      Bandersnatch.getRemainingRunaways() > 0,
    () => {
      maximize("familiar weight", false);
      if (have($familiar`frumious bandersnatch`)) useFamiliar($familiar`frumious bandersnatch`);
      else useFamiliar($familiar`pair of stomping boots`);
      if (myFamiliar() === $familiar`frumious bandersnatch`) ensureEffect($effect`ode to booze`);
    },
    Macro.step("runaway")
  ),

  new freeRun(
    () => get("_snokebombUsed") < banishesToUse && have($skill`snokebomb`),
    () => restoreMp(50),
    Macro.skill("snokebomb")
  ),

  new freeRun(
    () => get("_feelHatredUsed") < banishesToUse && have($skill`emotionally chipped`),
    () => {},
    Macro.skill("feel hatred")
  ),

  new freeRun(
    () => have($item`kremlin's greatest briefcase`) && get("_kgbTranquilizerDartUses") < 3,
    () => equip($slot`acc3`, $item`kremlin's greatest briefcase`),
    Macro.skill("KGB tranquilizer dart")
  ),

  new freeRun(
    () => have($item`latte lovers member's mug`) && !get("_latteBanishUsed"),
    () => equip($slot`off-hand`, $item`latte lovers member's mug`),
    Macro.skill("Throw Latte on Opponent")
  ),

  new freeRun(
    () => have($item`Lil' Doctor™ bag`) && get("_reflexHammerUsed") < 3,
    () => equip($slot`acc3`, $item`Lil' Doctor™ bag`),
    Macro.skill("reflex hammer")
  ),

  new freeRun(
    () => have($item`mafia middle finger ring`) && !get("_mafiaMiddleFingerRingUsed"),
    () => equip($slot`acc3`, $item`mafia middle finger ring`),
    Macro.skill("Show them your ring")
  ),
];

export function findRun() {
  return freeRuns.find((run) => run.available());
}

export function trueValue(...items: Item[]) {
  return (
    items
      .map((item) => {
        if (item.discardable) {
          return mallPrice(item) > 2 * autosellPrice(item) ? mallPrice(item) : autosellPrice(item);
        }
        return mallPrice(item) > 100 ? mallPrice(item) : 0;
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
  meatVal: number;
  probability: () => number;
  modifier?: BjornModifier;
};

const bjornFams: BjornedFamiliar[] = [
  {
    familiar: $familiar`puck man`,
    meatVal: trueValue($item`yellow pixel`),
    probability: () => (get("_yellowPixelDropsCrown") < 25 ? 0.25 : 0),
  },
  {
    familiar: $familiar`grimstone golem`,
    meatVal: trueValue($item`grimstone mask`),
    probability: () => (get("_grimstoneMaskDropsCrown") === 0 ? 0.5 : 0),
  },
  {
    familiar: $familiar`Knob Goblin Organ Grinder`,
    meatVal: 30,
    probability: () => 1,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 25,
    },
  },
  {
    familiar: $familiar`Happy Medium`,
    meatVal: 30,
    probability: () => 1,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 25,
    },
  },
  {
    familiar: $familiar`garbage fire`,
    meatVal: trueValue($item`burning newspaper`),
    probability: () => (get("_garbageFireDropsCrown") < 3 ? 0.5 : 0),
  },
  {
    familiar: $familiar`machine elf`,
    meatVal: trueValue(
      ...$items`abstraction: thought, abstraction: action, abstraction: category, abstraction: perception, abstraction: purpose`
    ),
    probability: () => (get("_abstractionDropsCrown") < 25 ? 0.2 : 0),
  },
  {
    familiar: $familiar`trick-or-treating tot`,
    meatVal: trueValue($item`hoarded candy wad`),
    probability: () => (get("_hoardedCandyDropsCrown") < 3 ? 0.5 : 0),
  },
  {
    familiar: $familiar`warbear drone`,
    meatVal: trueValue($item`warbear whosit`),
    probability: () => 1 / 4.5,
  },
  {
    familiar: $familiar`li'l xenomorph`,
    meatVal: trueValue($item`lunar isotope`),
    probability: () => 0.05,
    modifier: {
      type: BjornModifierType.ITEM,
      modifier: 15,
    },
  },
  {
    familiar: $familiar`pottery barn owl`,
    meatVal: trueValue($item`volcanic ash`),
    probability: () => 0.1,
  },
  {
    familiar: $familiar`grim brother`,
    meatVal: trueValue($item`grim fairy tale`),
    probability: () => (get("_grimFairyTaleDropsCrown") < 2 ? 1 : 0),
  },
  {
    familiar: $familiar`optimistic candle`,
    meatVal: trueValue($item`glob of melted wax`),
    probability: () => (get("_optimisticCandleDropsCrown") < 3 ? 1 : 0),
    modifier: {
      type: BjornModifierType.ITEM,
      modifier: 15,
    },
  },
  {
    familiar: $familiar`Adventurous Spelunker`,
    meatVal: trueValue(
      ...$items`teflon ore, Velcro ore, Vinyl ore, cardboard ore, styrofoam ore, bubblewrap ore`
    ),
    probability: () => (get("_oreDropsCrown") < 6 ? 1 : 0),
    modifier: {
      type: BjornModifierType.ITEM,
      modifier: 15,
    },
  },
  {
    familiar: $familiar`Twitching Space Critter`,
    meatVal: trueValue($item`space beast fur`),
    probability: () => (get("_spaceFurDropsCrown") < 1 ? 1 : 0),
  },
  {
    familiar: $familiar`party mouse`,
    meatVal: trueValue(
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
    probability: () => 0.05,
  },
  {
    familiar: $familiar`yule hound`,
    meatVal: trueValue($item`candy cane`),
    probability: () => 1,
  },
  {
    familiar: $familiar`gluttonous green ghost`,
    meatVal: trueValue(...$items`bean burrito, enchanted bean burrito, jumping bean burrito`),
    probability: () => 1,
  },
  {
    familiar: $familiar`Reassembled Blackbird`,
    meatVal: mallPrice($item`blackberry`),
    probability: () => 1,
    modifier: {
      type: BjornModifierType.ITEM,
      modifier: 10,
    },
  },
  {
    familiar: $familiar`Reconstituted Crow`,
    meatVal: mallPrice($item`blackberry`),
    probability: () => 1,
    modifier: {
      type: BjornModifierType.ITEM,
      modifier: 10,
    },
  },
  {
    familiar: $familiar`Hunchbacked Minion`,
    meatVal: trueValue(...$items`176,163,163,163,163`),
    probability: () => 1,
  },
  {
    familiar: $familiar`reanimated reanimator`,
    meatVal: trueValue(...$items`hot wing,broken skull`),
    probability: () => 1,
  },
  {
    familiar: $familiar`attention-deficit demon`,
    meatVal: trueValue(
      ...$items`chorizo brownies,white chocolate and tomato pizza,carob chunk noodles`
    ),
    probability: () => 1,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 20,
    },
  },
  {
    familiar: $familiar`piano cat`,
    meatVal: trueValue(...$items`beertini,papaya slung,salty slug,tomato daiquiri`),
    probability: () => 1,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 20,
    },
  },
  {
    familiar: $familiar`golden monkey`,
    meatVal: 100,
    probability: () => 0.5,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 25,
    },
  },
  {
    familiar: $familiar`robot reindeer`,
    meatVal: trueValue(...$items`candy cane,eggnog,fruitcake,gingerbread bugbear`),
    probability: () => 0.3,
  },
  {
    familiar: $familiar`stocking mimic`,
    meatVal: trueValue(...$items`540,617,906,908,909`),
    probability: () => 0.3,
  },
  {
    familiar: $familiar`BRICKO chick`,
    meatVal: trueValue($item`BRICKO brick`),
    probability: () => 1,
  },
  {
    familiar: $familiar`Cotton Candy Carnie`,
    meatVal: trueValue($item`cotton candy pinch`),
    probability: () => 1,
  },
  {
    familiar: $familiar`untamed turtle`,
    meatVal: trueValue(...$items`snailmail bits,turtlemail bits,turtle wax`),
    probability: () => 0.35,
  },
  {
    familiar: $familiar`astral badger`,
    meatVal: 2 * trueValue(...$items`spooky mushroom, knob mushroom, knoll mushroom`),
    probability: () => 1,
  },
  {
    familiar: $familiar`green pixie`,
    meatVal: trueValue($item`bottle of tequila`),
    probability: () => 0.2,
  },
  {
    familiar: $familiar`angry goat`,
    meatVal: trueValue($item`goat cheese pizza`),
    probability: () => 1,
  },
  {
    familiar: $familiar`adorable seal larva`,
    meatVal: trueValue(...$items`1445,1446,1447,1448,1449`),
    probability: () => 0.35,
  },
  {
    familiar: $familiar`ancient yuletide troll`,
    meatVal: trueValue(...$items`candy cane,eggnog,fruitcake,gingerbread bugbear`),
    probability: () => 0.3,
  },
  {
    familiar: $familiar`sweet nutcracker`,
    meatVal: trueValue(...$items`candy cane,eggnog,fruitcake,gingerbread bugbear`),
    probability: () => 0.3,
  },
  {
    familiar: $familiar`casagnova gnome`,
    meatVal: 0,
    probability: () => 0,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 20,
    },
  },
  {
    familiar: $familiar`coffee pixie`,
    meatVal: 0,
    probability: () => 0,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 20,
    },
  },
  {
    familiar: $familiar`dancing frog`,
    meatVal: 0,
    probability: () => 0,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 20,
    },
  },
  {
    familiar: $familiar`grouper groupie`,
    meatVal: 0,
    probability: () => 0,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 20,
    },
  },
  {
    familiar: $familiar`hand turkey`,
    meatVal: 30,
    probability: () => 1,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 20,
    },
  },
  {
    familiar: $familiar`hippo ballerina`,
    meatVal: 0,
    probability: () => 0,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 20,
    },
  },
  {
    familiar: $familiar`jitterbug`,
    meatVal: 0,
    probability: () => 0,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 20,
    },
  },
  {
    familiar: $familiar`leprechaun`,
    meatVal: 30,
    probability: () => 1,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 20,
    },
  },
  {
    familiar: $familiar`obtuse angel`,
    meatVal: 0,
    probability: () => 0,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 20,
    },
  },
  {
    familiar: $familiar`psychedelic bear`,
    meatVal: 0,
    probability: () => 0,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 20,
    },
  },
  {
    familiar: $familiar`robortender`,
    meatVal: 0,
    probability: () => 0,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 20,
    },
  },
  {
    familiar: $familiar`ghost of crimbo commerce`,
    meatVal: 30,
    probability: () => 1,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 25,
    },
  },
  {
    familiar: $familiar`hobo monkey`,
    meatVal: 0,
    probability: () => 0,
    modifier: {
      type: BjornModifierType.MEAT,
      modifier: 25,
    },
  },
  {
    familiar: $familiar`rockin' robin`,
    meatVal: 60,
    probability: () => 1,
    modifier: {
      type: BjornModifierType.ITEM,
      modifier: 15,
    },
  },
  {
    familiar: $familiar`feral kobold`,
    meatVal: 30,
    probability: () => 1,
    modifier: {
      type: BjornModifierType.ITEM,
      modifier: 15,
    },
  },
  {
    familiar: $familiar`oily woim`,
    meatVal: 30,
    probability: () => 1,
    modifier: {
      type: BjornModifierType.ITEM,
      modifier: 10,
    },
  },
  {
    familiar: $familiar`cat burglar`,
    meatVal: 0,
    probability: () => 0,
    modifier: {
      type: BjornModifierType.ITEM,
      modifier: 10,
    },
  },
  {
    familiar: $familiar`misshapen animal skeleton`,
    meatVal: 30,
    probability: () => 1,
    modifier: {
      type: BjornModifierType.FMWT,
      modifier: 5,
    },
  },
  {
    familiar: $familiar`Gelatinous Cubeling`,
    meatVal: 0,
    probability: () => 0,
    modifier: {
      type: BjornModifierType.FMWT,
      modifier: 5,
    },
  },
];

export enum PickBjornMode {
  FREE,
  EMBEZZLER,
  BARF,
}

export function pickBjorn(mode: PickBjornMode = PickBjornMode.FREE) {
  const additionalValue = (familiar: BjornedFamiliar) => {
    if (!familiar.modifier) return 0;
    const meatVal =
      mode === PickBjornMode.FREE ? 0 : baseMeat + mode === PickBjornMode.EMBEZZLER ? 750 : 0;
    const itemVal = PickBjornMode.BARF ? 72 : 0;
    if (familiar.modifier.type === BjornModifierType.MEAT)
      return (familiar.modifier.modifier * meatVal) / 100;
    if (familiar.modifier.type === BjornModifierType.ITEM)
      return (familiar.modifier.modifier * itemVal) / 100;
    if (familiar.modifier.type === BjornModifierType.FMWT) {
      const lepMultiplier = numericModifier(meatFamiliar(), "Leprechaun", 1, Item.get("none"));
      const fairyMultiplier = numericModifier(meatFamiliar(), "Fairy", 1, Item.get("none"));
      return (
        (meatVal * (10 * lepMultiplier + (75 * Math.sqrt(lepMultiplier)) / Math.sqrt(245)) +
          itemVal *
            (5 * fairyMultiplier + (5 * Math.sqrt(55 * fairyMultiplier)) / (2 * Math.sqrt(60)))) /
        100
      );
    }
    return 0;
  };
  return bjornFams
    .filter((bjornFam) => have(bjornFam.familiar) && myFamiliar() !== bjornFam.familiar)
    .sort(
      (b, a) =>
        a.meatVal * a.probability() +
        additionalValue(a) -
        (b.meatVal * b.probability() + additionalValue(b))
    )[0];
}

import { canAdv } from "canadv.ash";
import {
  autosellPrice,
  buy,
  cliExecute,
  haveSkill,
  mallPrice,
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
  MaximizeOptions,
  property,
  set,
  SongBoom,
} from "libram";

export const baseMeat =
  SongBoom.have() &&
  (SongBoom.songChangesLeft() > 0 || SongBoom.song() === "Total Eclipse of Your Meat")
    ? 275
    : 250;

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

export class Requirement {
  maximizeParameters_: string[];
  maximizeOptions_: MaximizeOptions;

  constructor(maximizeParameters_: string[], maximizeOptions_: MaximizeOptions) {
    this.maximizeParameters_ = maximizeParameters_;
    this.maximizeOptions_ = maximizeOptions_;
  }

  maximizeParameters(): string[] {
    return this.maximizeParameters_;
  }

  maximizeOptions(): MaximizeOptions {
    return this.maximizeOptions_;
  }

  merge(other: Requirement): Requirement {
    const optionsA = this.maximizeOptions();
    const optionsB = other.maximizeOptions();
    return new Requirement([...this.maximizeParameters(), ...other.maximizeParameters()], {
      ...optionsA,
      ...optionsB,
      bonusEquip: new Map([
        ...(optionsA.bonusEquip?.entries() ?? []),
        ...(optionsB.bonusEquip?.entries() ?? []),
      ]),
      forceEquip: [...(optionsA.forceEquip ?? []), ...(optionsB.forceEquip ?? [])],
      preventEquip: [...(optionsA.preventEquip ?? []), ...(optionsB.preventEquip ?? [])],
    });
  }

  static merge(allRequirements: Requirement[]): Requirement {
    return allRequirements.reduce((x, y) => x.merge(y));
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

export function saleValue(...items: Item[]): number {
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

export function kramcoGuaranteed(): boolean {
  return (
    have($item`Kramco Sausage-o-Matic™`) &&
    totalTurnsPlayed() - get("_lastSausageMonsterTurn") + 1 >=
      5 + 3 * get("_sausageFights") + Math.pow(Math.max(0, get("_sausageFights") - 5), 3)
  );
}

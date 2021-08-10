import { canAdv } from "canadv.ash";
import {
  autosellPrice,
  buy,
  cliExecute,
  haveSkill,
  mallPrice,
  print,
  toUrl,
  use,
  useFamiliar,
  useSkill,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $item,
  $location,
  $locations,
  $skill,
  get,
  getKramcoWandererChance,
  Guzzlr,
  have,
  Macro,
  MaximizeOptions,
  PropertiesManager,
  property,
  SongBoom,
} from "libram";

export enum BonusEquipMode {
  FREE,
  EMBEZZLER,
  BARF,
  DMT,
}

export const propertyManager = new PropertiesManager();

export const baseMeat =
  SongBoom.have() &&
  (SongBoom.songChangesLeft() > 0 || SongBoom.song() === "Total Eclipse of Your Meat")
    ? 275
    : 250;

export function setChoice(adventure: number, value: number): void {
  propertyManager.setChoices({ [adventure]: value });
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
      onlySlot: [...(optionsA.onlySlot ?? []), ...(optionsB.onlySlot ?? [])],
      preventSlot: [...(optionsA.preventSlot ?? []), ...(optionsB.preventSlot ?? [])],
    });
  }

  static merge(allRequirements: Requirement[]): Requirement {
    return allRequirements.reduce((x, y) => x.merge(y));
  }

  static none(): Requirement {
    return new Requirement([], {});
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
  return have($item`Kramco Sausage-o-Matic™`) && getKramcoWandererChance() >= 1;
}

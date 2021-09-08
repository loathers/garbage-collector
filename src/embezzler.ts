import { canAdv } from "canadv.ash";
import {
  abort,
  adv1,
  buy,
  chatPrivate,
  cliExecute,
  getCounters,
  inebrietyLimit,
  itemAmount,
  myAdventures,
  myInebriety,
  myTurncount,
  print,
  retrieveItem,
  use,
  wait,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $locations,
  $monster,
  $skill,
  adventureMacro,
  ChateauMantegna,
  get,
  Guzzlr,
  have,
  property,
  Requirement,
  SourceTerminal,
} from "libram";
import { Macro } from "./combat";
import { clamp, globalOptions } from "./globalvars";

type EmbezzlerFightOptions = {
  location?: Location;
  macro?: Macro;
};

export class EmbezzlerFight {
  available: () => boolean;
  potential: () => number;
  run: (options: EmbezzlerFightOptions) => void;
  requirements: Requirement[];
  draggable: boolean;
  name: string;

  constructor(
    name: string,
    available: () => boolean,
    potential: () => number,
    run: (options: EmbezzlerFightOptions) => void,
    requirements: Requirement[] = [],
    draggable = false
  ) {
    this.name = name;
    this.available = available;
    this.potential = potential;
    this.run = run;
    this.requirements = requirements;
    this.draggable = draggable;
  }
}

function checkFax(): boolean {
  if (!have($item`photocopied monster`)) cliExecute("fax receive");
  if (property.getString("photocopyMonster") === "Knob Goblin Embezzler") return true;
  cliExecute("fax send");
  return false;
}

function faxEmbezzler(): void {
  if (!get("_photocopyUsed")) {
    if (checkFax()) return;
    chatPrivate("cheesefax", "Knob Goblin Embezzler");
    for (let i = 0; i < 3; i++) {
      wait(10);
      if (checkFax()) return;
    }
    abort("Failed to acquire photocopied Knob Goblin Embezzler.");
  }
}

export const embezzlerMacro = (): Macro =>
  Macro.if_(
    "monstername Knob Goblin Embezzler",
    Macro.if_("snarfblat 186", Macro.tryCopier($item`pulled green taffy`))
      .trySkill($skill`Wink at`)
      .trySkill($skill`Fire a badly romantic arrow`)
      .externalIf(
        get("_sourceTerminalDigitizeMonster") !== $monster`Knob Goblin Embezzler`,
        Macro.tryCopier($skill`Digitize`)
      )
      .tryCopier($item`Spooky Putty sheet`)
      .tryCopier($item`Rain-Doh black box`)
      .tryCopier($item`4-d camera`)
      .tryCopier($item`unfinished ice sculpture`)
      .externalIf(get("_enamorangs") === 0, Macro.tryCopier($item`LOV Enamorang`))
      .meatKill()
  ).abort();

export const embezzlerSources = [
  new EmbezzlerFight(
    "Digitize",
    () =>
      get("_sourceTerminalDigitizeMonster") === $monster`Knob Goblin Embezzler` &&
      getCounters("Digitize Monster", 0, 0).trim() !== "",
    () => (SourceTerminal.have() && get("_sourceTerminalDigitizeUses") === 0 ? 1 : 0),
    (options: EmbezzlerFightOptions) => {
      adventureMacro(
        options.location ?? determineDraggableZoneAndEnsureAccess(draggableFight.WANDERER),
        embezzlerMacro()
      );
    },
    [],
    true
  ),
  new EmbezzlerFight(
    "Enamorang",
    () =>
      getCounters("LOV Enamorang", 0, 0).trim() !== "" &&
      get("enamorangMonster") === $monster`Knob Goblin Embezzler`,
    () =>
      get("enamorangMonster") === $monster`Knob Goblin Embezzler` ||
      (have($item`LOV Enamorang`) && !get("_enamorangs"))
        ? 1
        : 0,
    (options: EmbezzlerFightOptions) => {
      adventureMacro(
        options.location ?? determineDraggableZoneAndEnsureAccess(draggableFight.WANDERER),
        embezzlerMacro()
      );
    },
    [],
    true
  ),
  new EmbezzlerFight(
    "Backup",
    () =>
      get("lastCopyableMonster") === $monster`Knob Goblin Embezzler` &&
      have($item`backup camera`) &&
      get<number>("_backUpUses") < 11,
    () => (have($item`backup camera`) ? 11 - get<number>("_backUpUses") : 0),
    (options: EmbezzlerFightOptions) => {
      const realLocation =
        options.location && options.location.combatPercent >= 100
          ? options.location
          : determineDraggableZoneAndEnsureAccess(draggableFight.BACKUP);
      adventureMacro(
        realLocation,
        Macro.if_(
          "!monstername Knob Goblin Embezzler",
          Macro.skill($skill`Back-Up to your Last Enemy`)
        ).step(options.macro || embezzlerMacro())
      );
    },
    [
      new Requirement([], {
        forceEquip: $items`backup camera`,
        bonusEquip: new Map([[$item`backup camera`, 5000]]),
      }),
    ],
    true
  ),
  new EmbezzlerFight(
    "Fax",
    () => have($item`Clan VIP Lounge key`) && !get("_photocopyUsed"),
    () => (have($item`Clan VIP Lounge key`) && !get("_photocopyUsed") ? 1 : 0),
    () => {
      faxEmbezzler();
      use($item`photocopied monster`);
    }
  ),
  new EmbezzlerFight(
    "Pillkeeper Semirare",
    () =>
      have($item`Eight Days a Week Pill Keeper`) &&
      canAdv($location`Cobb's Knob Treasury`, true) &&
      !get("_freePillKeeperUsed"),
    () =>
      have($item`Eight Days a Week Pill Keeper`) &&
      canAdv($location`Cobb's Knob Treasury`, true) &&
      !get("_freePillKeeperUsed")
        ? 1
        : 0,
    () => {
      cliExecute("pillkeeper semirare");
      adv1($location`Cobb's Knob Treasury`);
    }
  ),
  new EmbezzlerFight(
    "Chateau Painting",
    () =>
      ChateauMantegna.have() &&
      !ChateauMantegna.paintingFought() &&
      ChateauMantegna.paintingMonster() === $monster`Knob Goblin Embezzler`,
    () =>
      ChateauMantegna.have() &&
      !ChateauMantegna.paintingFought() &&
      ChateauMantegna.paintingMonster() === $monster`Knob Goblin Embezzler`
        ? 1
        : 0,
    () => ChateauMantegna.fightPainting()
  ),
  new EmbezzlerFight(
    "Spooky Putty & Rain-Doh",
    () =>
      (have($item`Spooky Putty monster`) &&
        get("spookyPuttyMonster") === $monster`Knob Goblin Embezzler`) ||
      (have($item`Rain-Doh box full of monster`) &&
        get("rainDohMonster") === $monster`Knob Goblin Embezzler`),
    () => {
      if (
        (have($item`Spooky Putty sheet`) || have($item`Spooky Putty monster`)) &&
        (have($item`Rain-Doh black box`) || have($item`Rain-Doh box full of monster`))
      ) {
        return (
          6 -
          get("spookyPuttyCopiesMade") -
          get("_raindohCopiesMade") +
          itemAmount($item`Spooky Putty monster`) +
          itemAmount($item`Rain-Doh box full of monster`)
        );
      } else if (have($item`Spooky Putty sheet`) || have($item`Spooky Putty monster`)) {
        return 5 - get("spookyPuttyCopiesMade") + itemAmount($item`Spooky Putty monster`);
      } else if (have($item`Rain-Doh black box`) || have($item`Rain-Doh box full of monster`)) {
        return 5 - get("_raindohCopiesMade") + itemAmount($item`Rain-Doh box full of monster`);
      }
      return 0;
    },
    () => {
      if (have($item`Spooky Putty monster`)) return use($item`Spooky Putty monster`);
      return use($item`Rain-Doh box full of monster`);
    }
  ),
  new EmbezzlerFight(
    "4-d Camera",
    () =>
      have($item`shaking 4-d camera`) &&
      get("cameraMonster") === $monster`Knob Goblin Embezzler` &&
      !get("_cameraUsed"),
    () =>
      have($item`shaking 4-d camera`) &&
      get("cameraMonster") === $monster`Knob Goblin Embezzler` &&
      !get("_cameraUsed")
        ? 1
        : 0,
    () => use($item`shaking 4-d camera`)
  ),
  new EmbezzlerFight(
    "Ice Sculpture",
    () =>
      have($item`ice sculpture`) &&
      get("iceSculptureMonster") === $monster`Knob Goblin Embezzler` &&
      !get("_iceSculptureUsed"),
    () =>
      have($item`ice sculpture`) &&
      get("iceSculptureMonster") === $monster`Knob Goblin Embezzler` &&
      !get("_iceSculptureUsed")
        ? 1
        : 0,
    () => use($item`ice sculpture`)
  ),
  new EmbezzlerFight(
    "Green Taffy",
    () =>
      have($item`envyfish egg`) &&
      get("envyfishMonster") === $monster`Knob Goblin Embezzler` &&
      !get("_envyfishEggUsed"),
    () =>
      have($item`envyfish egg`) &&
      get("envyfishMonster") === $monster`Knob Goblin Embezzler` &&
      !get("_envyfishEggUsed")
        ? 1
        : 0,
    () => use($item`envyfish egg`)
  ),
  new EmbezzlerFight(
    "Professor MeatChain",
    () => false,
    () => (have($familiar`Pocket Professor`) && !get<boolean>("_garbo_meatChain", false) ? 10 : 0),
    () => {
      return;
    }
  ),
  new EmbezzlerFight(
    "Professor WeightChain",
    () => false,
    () => (have($familiar`Pocket Professor`) && !get<boolean>("_garbo_weightChain", false) ? 5 : 0),
    () => {
      return;
    }
  ),
];

/**
 * Sum an array of numbers.
 * @param addends Addends to sum.
 */
export function sum(addends: number[]): number {
  return addends.reduce((s, n) => s + n, 0);
}

export function embezzlerCount(): number {
  return sum(embezzlerSources.map((source) => source.potential()));
}

export function estimatedTurns(): number {
  let turns;
  if (globalOptions.stopTurncount) turns = globalOptions.stopTurncount - myTurncount();
  else if (globalOptions.noBarf) turns = embezzlerCount();
  else
    turns =
      (myAdventures() + (globalOptions.ascending && myInebriety() <= inebrietyLimit() ? 60 : 0)) *
      (have($item`mafia thumb ring`) ? 1.04 : 1);

  return turns;
}

export enum draggableFight {
  BACKUP,
  WANDERER,
}

function untangleDigitizes(turnCount: number, chunks: number): number {
  const turnsPerChunk = turnCount / chunks;
  const monstersPerChunk = Math.sqrt((turnsPerChunk + 3) / 5 + 1 / 4) - 1 / 2;
  return Math.floor(chunks * monstersPerChunk);
}

function digitizedMonstersRemaining(): number {
  if (!SourceTerminal.have()) return 0;

  const digitizesLeft = clamp(3 - get("_sourceTerminalDigitizeUses"), 0, 3);
  if (digitizesLeft === 3) return untangleDigitizes(estimatedTurns(), 3);

  const monsterCount = get("_sourceTerminalDigitizeMonsterCount") + 1;

  const relayArray = get("relayCounters").match(/(d+):Digitize Monster/);
  const nextDigitizeEncounter = relayArray ? parseInt(relayArray[1]) : myTurncount();

  const turnsLeftAtNextMonster = estimatedTurns() - (nextDigitizeEncounter - myTurncount());
  const turnsAtLastDigitize = turnsLeftAtNextMonster + ((monsterCount + 1) * monsterCount * 5 - 3);
  return untangleDigitizes(turnsAtLastDigitize, digitizesLeft + 1);
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

function testZoneAndUsePotionToAccess() {
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
  const blacklist = $locations`The Oasis, The Bubblin' Caldera, Barrrney's Barrr, The F'c'le, The Poop Deck, Belowdecks, 8-Bit Realm, Madness Bakery, The Secret Government Laboratory`;
  if (
    forbiddenZones.includes(guzzlZone.zone) ||
    blacklist.includes(guzzlZone) ||
    guzzlZone.environment === "underwater" ||
    !canAdv(guzzlZone, false)
  ) {
    return false;
  } else {
    return true;
  }
}

function testZoneForBackups(location: Location): boolean {
  const backupBlacklist = $locations`The Overgrown Lot, The Skeleton Store, The Mansion of Dr. Weirdeaux`;
  return !backupBlacklist.includes(location) && location.combatPercent >= 100;
}

function testZoneForWanderers(location: Location): boolean {
  const wandererBlacklist = $locations`The Batrat and Ratbat Burrow, Guano Junction, The Beanbat Chamber`;
  return !wandererBlacklist.includes(location) && location.wanderers;
}

export function determineDraggableZoneAndEnsureAccess(
  type: draggableFight = draggableFight.WANDERER
): Location {
  const defaultLocation =
    get("_spookyAirportToday") || get("spookyAirportAlways")
      ? $location`The Deep Dark Jungle`
      : $location`Noob Cave`;
  if (!Guzzlr.have()) return defaultLocation;

  const predictedWanderers =
    digitizedMonstersRemaining() +
    (have($item`"I Voted!" sticker`) ? clamp(3 - get("_voteFreeFights"), 0, 3) : 0);
  const predictedBackups = have($item`backup camera`) ? clamp(11 - get("_backUpUses"), 0, 11) : 0;
  const turnsLeftOnThisQuest = Math.ceil(
    (100 - get("guzzlrDeliveryProgress")) / (10 - get("_guzzlrDeliveries"))
  );

  acceptBestGuzzlrQuest();

  const currentGuzzlrZone = Guzzlr.getLocation() || $location`none`;
  if (
    !testZoneAndUsePotionToAccess() ||
    (!testZoneForWanderers(currentGuzzlrZone) &&
      predictedWanderers > predictedBackups &&
      predictedBackups < turnsLeftOnThisQuest) ||
    (!testZoneForBackups(currentGuzzlrZone) && predictedBackups >= predictedWanderers)
  ) {
    Guzzlr.abandon();
  }
  acceptBestGuzzlrQuest();

  const guzzlZone = Guzzlr.getLocation();
  if (!testZoneAndUsePotionToAccess()) return defaultLocation;
  if (
    !guzzlZone ||
    (type === draggableFight.WANDERER && !testZoneForWanderers(guzzlZone)) ||
    (type === draggableFight.BACKUP && !testZoneForBackups(guzzlZone))
  ) {
    return defaultLocation;
  }

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
      print("It's time to get buttery", "purple");
      cliExecute("make buttery boy");
    }
  } else {
    const guzzlrBooze = Guzzlr.getBooze();
    if (!guzzlrBooze) {
      return defaultLocation;
    } else if (!have(guzzlrBooze)) {
      print("just picking up some booze before we roll", "blue");
      retrieveItem(guzzlrBooze);
    }
  }
  return guzzlZone;
}

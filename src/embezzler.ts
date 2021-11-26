import { canAdv } from "canadv.ash";
import {
  abort,
  chatPrivate,
  cliExecute,
  getCounters,
  haveEquipped,
  inebrietyLimit,
  itemAmount,
  meatDropModifier,
  myAdventures,
  myHash,
  myInebriety,
  myTurncount,
  print,
  retrieveItem,
  runCombat,
  use,
  userConfirm,
  visitUrl,
  wait,
} from "kolmafia";
import {
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  $skill,
  adventureMacro,
  ChateauMantegna,
  get,
  have,
  property,
  Requirement,
  SourceTerminal,
  sum,
} from "libram";
import { acquire } from "./acquire";
import { Macro } from "./combat";
import { baseMeat, globalOptions, WISH_VALUE } from "./lib";
import { determineDraggableZoneAndEnsureAccess, draggableFight } from "./wanderer";

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
    $monster`Knob Goblin Embezzler`,
    Macro.if_($location`The Briny Deeps`, Macro.tryCopier($item`pulled green taffy`))
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
        Macro.externalIf(
          haveEquipped($item`backup camera`) &&
            get("_backUpUses") < 11 &&
            get("lastCopyableMonster") === $monster`Knob Goblin Embezzler`,
          Macro.if_(
            `!monsterid ${$monster`Knob Goblin Embezzler`.id}`,
            Macro.skill($skill`Back-Up to your Last Enemy`)
          )
        ).step(embezzlerMacro())
      );
    },
    [],
    true
  ),
  new EmbezzlerFight(
    "Enamorang",
    () =>
      getCounters("Enamorang", 0, 0).trim() !== "" &&
      get("enamorangMonster") === $monster`Knob Goblin Embezzler`,
    () =>
      get("enamorangMonster") === $monster`Knob Goblin Embezzler` ||
      (have($item`LOV Enamorang`) && !get("_enamorangs"))
        ? 1
        : 0,
    (options: EmbezzlerFightOptions) => {
      adventureMacro(
        options.location ?? determineDraggableZoneAndEnsureAccess(draggableFight.WANDERER),
        Macro.externalIf(
          haveEquipped($item`backup camera`) &&
            get("_backUpUses") < 11 &&
            get("lastCopyableMonster") === $monster`Knob Goblin Embezzler`,
          Macro.if_(
            `!monsterid ${$monster`Knob Goblin Embezzler`.id}`,
            Macro.skill($skill`Back-Up to your Last Enemy`)
          )
        ).step(embezzlerMacro())
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
          `!monsterid ${$monster`Knob Goblin Embezzler`.id}`,
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
      retrieveItem($item`Eight Days a Week Pill Keeper`);
      cliExecute("pillkeeper semirare");
      adventureMacro($location`Cobb's Knob Treasury`, embezzlerMacro());
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
    () =>
      have($familiar`Pocket Professor`) && !get<boolean>("_garbo_meatChain", false)
        ? Math.max(10 - get("_pocketProfessorLectures"), 0)
        : 0,
    () => {
      return;
    }
  ),
  new EmbezzlerFight(
    "Professor WeightChain",
    () => false,
    () =>
      have($familiar`Pocket Professor`) && !get<boolean>("_garbo_weightChain", false)
        ? Math.min(15 - get("_pocketProfessorLectures"), 5)
        : 0,
    () => {
      return;
    }
  ),
  //This is very deliberately the last embezzler fight.
  new EmbezzlerFight(
    "Pocket Wish",
    () => {
      const potential = embezzlerCount();
      if (potential < 1) return false;
      if (get("_genieFightsUsed") >= 3) return false;
      if (globalOptions.askedAboutWish) return globalOptions.wishAnswer;
      const averageEmbezzlerNet = ((baseMeat + 750) * meatDropModifier()) / 100;
      print(`You have the following embezzler-sources untapped right now:`, "blue");
      embezzlerSources
        .filter((source) => source.potential() > 0)
        .map((source) => `${source.potential()} from ${source.name}`)
        .forEach((text) => print(text, "blue"));
      globalOptions.askedAboutWish = true;
      globalOptions.wishAnswer = userConfirm(
        `Garbo has detected you have ${potential} potential ways to copy an Embezzler, but no way to start a fight with one. Current embezzler net (before potions) is ${averageEmbezzlerNet}, so we expect to earn ${
          (potential + 1) * averageEmbezzlerNet - WISH_VALUE
        } meat, after the cost of a wish. Should we wish for an Embezzler?`
      );
      return globalOptions.wishAnswer;
    },
    () => 0,
    () => {
      acquire(1, $item`pocket wish`, WISH_VALUE);
      visitUrl(`inv_use.php?pwd=${myHash()}&which=3&whichitem=9537`, false, true);
      visitUrl(
        "choice.php?pwd&whichchoice=1267&option=1&wish=to fight a Knob Goblin Embezzler ",
        true,
        true
      );
      visitUrl("main.php", false);
      runCombat();
      globalOptions.askedAboutWish = false;
    }
  ),
];

export function embezzlerCount(): number {
  return sum(embezzlerSources, (source: EmbezzlerFight) => source.potential());
}

export function estimatedTurns(): number {
  // Assume roughly 2 fullness from pantsgiving and 8 adventures/fullness.
  const pantsgivingAdventures = have($item`Pantsgiving`)
    ? Math.max(0, 2 - get("_pantsgivingFullness")) * 8
    : 0;
  const potentialSausages =
    itemAmount($item`magical sausage`) + itemAmount($item`magical sausage casing`);
  const sausageAdventures = have($item`Kramco Sausage-o-Matic™`)
    ? Math.min(potentialSausages, 23 - get("_sausagesEaten"))
    : 0;
  const nightcapAdventures = globalOptions.ascending && myInebriety() <= inebrietyLimit() ? 60 : 0;
  const thumbRingMultiplier = have($item`mafia thumb ring`) ? 1 / 0.96 : 1;

  let turns;
  if (globalOptions.stopTurncount) turns = globalOptions.stopTurncount - myTurncount();
  else if (globalOptions.noBarf) turns = embezzlerCount();
  else {
    turns =
      (myAdventures() + sausageAdventures + pantsgivingAdventures + nightcapAdventures) *
      thumbRingMultiplier;
  }

  return turns;
}

/**
 * Gets next available embezzler fight. If there is no way to generate a fight, but copies are available,
 * the user is prompted to purchase a pocket wish to start the embezzler chain.
 * @returns the next available embezzler fight
 */
export function getNextEmbezzlerFight(): EmbezzlerFight | null {
  for (const fight of embezzlerSources) {
    if (fight.available()) return fight;
  }
  return null;
}

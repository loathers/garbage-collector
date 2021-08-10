import { cliExecute, restoreMp, retrieveItem, useFamiliar } from "kolmafia";
import { $effect, $familiar, $item, $items, $skill, adventureMacro, Bandersnatch, get, getFoldGroup, getSongCount, getSongLimit, have, Macro } from "libram";
import { freeFightFamiliar } from "./familiar";
import { globalOptions } from "./globalvars";
import { ensureEffect, questStep, Requirement } from "./lib";
import { freeFightOutfit } from "./outfit";

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

  new FreeRun(
    "Parasol",
    () =>
      have($item`peppermint parasol`) &&
      globalOptions.ascending &&
      get("parasolUsed") < 9 &&
      get("_navelRunaways") < 3,
    Macro.trySkill("Asdon Martin: Spring-Loaded Front Bumper").item("peppermint parasol")
  ),
];

export function findRun(useFamiliar = true): FreeRun | undefined {
  return freeRuns.find(
    (run) => run.available() && (useFamiliar || !["Bander", "Boots"].includes(run.name))
  );
}

export function withRun(
  location: Location,
  goal: () => boolean,
  requirement = Requirement.none(),
  macro = new Macro(),
  useLTB = false,
  familiar?: Familiar
): boolean {
  const canBander = familiar !== undefined;
  while (findRun(canBander) && !goal()) {
    const runSource =
      findRun(canBander) || useLTB
        ? new FreeRun(
            "LTB",
            () => retrieveItem($item`Louder Than Bomb`),
            Macro.item("Louder Than Bomb"),
            new Requirement([], {}),
            () => retrieveItem($item`Louder Than Bomb`)
          )
        : undefined;
    if (!runSource) return goal();
    freeFightOutfit([
      requirement,
      runSource.requirement ? runSource.requirement : Requirement.none(),
    ]);
    useFamiliar(familiar ?? freeFightFamiliar());
    if (runSource.prepare) runSource.prepare();
    const combinedMacro = macro.step(runSource.macro);
    adventureMacro(location, combinedMacro);
  }
  return goal();
}

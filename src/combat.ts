import {
  equippedAmount,
  equippedItem,
  haveSkill,
  inMultiFight,
  itemType,
  myAdventures,
  myClass,
  myFamiliar,
  print,
  runCombat,
  setAutoAttack,
} from "kolmafia";
import {
  $class,
  $effect,
  $familiar,
  $item,
  $monster,
  $skill,
  $slot,
  get,
  have,
  Macro as LibramMacro,
  SourceTerminal,
} from "libram";

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function shouldRedigitize() {
  const digitizesLeft = clamp(3 - get("_sourceTerminalDigitizeUses"), 0, 3);
  const monsterCount = get("_sourceTerminalDigitizeMonsterCount") + 1;
  // triangular number * 10 - 3
  const digitizeAdventuresUsed = monsterCount * (monsterCount + 1) * 5 - 3;
  // Redigitize if fewer adventures than this digitize usage.
  return SourceTerminal.have() && myAdventures() * 1.04 < digitizesLeft * digitizeAdventuresUsed;
}

export class Macro extends LibramMacro {
  submit(): string {
    print(this.components.join("\n"));
    return super.submit();
  }

  tryHaveSkill(skillOrName: Skill | string): Macro {
    const skill = typeof skillOrName === "string" ? Skill.get(skillOrName) : skillOrName;
    return this.externalIf(haveSkill(skill), Macro.skill(skill));
  }

  static tryHaveSkill(skillOrName: Skill | string): Macro {
    return new Macro().tryHaveSkill(skillOrName);
  }

  meatKill(): Macro {
    const sealClubberSetup =
      equippedAmount($item`mafia pointer finger ring`) > 0 &&
      myClass() === $class`Seal Clubber` &&
      have($skill`Furious Wallop`);
    const opsSetup =
      equippedAmount($item`mafia pointer finger ring`) > 0 &&
      equippedAmount($item`Operation Patriot Shield`) > 0;
    const katanaSetup =
      equippedAmount($item`mafia pointer finger ring`) > 0 &&
      equippedAmount($item`haiku katana`) > 0;
    const capeSetup =
      equippedAmount($item`mafia pointer finger ring`) > 0 &&
      get("retroCapeSuperhero") === "robot" &&
      get("retroCapeWashingInstructions") === "kill" &&
      itemType(equippedItem($slot`weapon`)) === "pistol";

    // TODO: Hobo monkey stasis. VYKEA couch issue. Probably other stuff.
    return this.tryHaveSkill("Sing Along")
      .externalIf(
        shouldRedigitize(),
        Macro.if_(
          `monstername ${get("_sourceTerminalDigitizeMonster")}`,
          Macro.trySkill("Digitize")
        )
      )
      .externalIf(
        !have($effect`On the Trail`),
        Macro.if_("monstername garbage tourist", Macro.trySkill("Transcendent Olfaction"))
      )
      .externalIf(
        get("_gallapagosMonster") !== $monster`garbage tourist`,
        Macro.if_("monstername garbage tourist", Macro.trySkill("Gallapagosian Mating Call"))
      )
      .externalIf(
        get("lastCopyableMonster") === $monster`garbage tourist`,
        Macro.if_("!monstername garbage tourist", Macro.trySkill("Feel Nostalgic"))
      )
      .externalIf(
        myFamiliar() === $familiar`Stocking Mimic`,
        Macro.skill("Curse of Weaksauce").while_("!pastround 10", Macro.item("seal tooth"))
      )
      .externalIf(sealClubberSetup, Macro.trySkill("Furious Wallop").attack())
      .externalIf(opsSetup, Macro.skill("Throw Shield").attack())
      .externalIf(katanaSetup, Macro.skill("Summer Siesta").attack())
      .externalIf(capeSetup, Macro.skill("Precision Shot"))
      .trySkill("Pocket Crumbs")
      .if_(
        "discobandit",
        Macro.trySkill("Disco Dance of Doom")
          .trySkill("Disco Dance II: Electric Boogaloo")
          .trySkill("Disco Dance 3: Back in the Habit")
      )
      .trySkill("Curse of Weaksauce")
      .attack()
      .repeat();
  }

  static meatKill(): Macro {
    return new Macro().meatKill();
  }
}

export function withMacro<T>(macro: Macro, action: () => T): T {
  setAutoAttack(0);
  macro.save();
  try {
    return action();
  } finally {
    Macro.clearSaved();
  }
}

export function main(): void {
  Macro.load().submit();
  while (inMultiFight()) runCombat();
}

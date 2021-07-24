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
  ChateauMantegna,
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

  tryCopier(itemOrSkill: Item | Skill, monster: Monster = $monster`none`): Macro {
    switch (itemOrSkill) {
      case $item`Spooky Putty sheet`:
        return this.externalIf(
          get("spookyPuttyCopiesMade") + Math.max(1, get("_raindohCopiesMade")) < 6,
          Macro.tryItem(itemOrSkill)
        );
      case $item`Rain-Doh black box`:
        return this.externalIf(
          get("_raindohCopiesMade") + Math.max(1, get("spookyPuttyCopiesMade")) < 6,
          Macro.tryItem(itemOrSkill)
        );
      case $item`4-d camera`:
        return this.externalIf(
          !get("_cameraUsed") && !have($item`shaking 4-d camera`),
          Macro.tryItem(itemOrSkill)
        );
      case $item`crappy camera`:
        return this.externalIf(
          !get("_crappyCameraUsed") && !have($item`shaking crappy camera`),
          Macro.tryItem(itemOrSkill)
        );
      case $item`unfinished ice sculpture`:
        return this.externalIf(
          !get("_iceSculptureUsed") && !have($item`ice sculpture`),
          Macro.tryItem(itemOrSkill)
        );
      case $item`pulled green taffy`:
        return this.externalIf(
          !get("_envyfishEggUsed") && !have($item`envyfish egg`),
          Macro.tryItem(itemOrSkill)
        );
      case $item`print screen button`:
        return this.tryItem(itemOrSkill);
      case $item`alpine watercolor set`:
        return this.externalIf(
          monster !== $monster`none` && ChateauMantegna.paintingMonster() !== monster,
          Macro.if_(`monstername ${monster}`, Macro.tryItem(itemOrSkill))
        );
      case $item`LOV Enamorang`:
        return this.externalIf(
          get("_enamorangs") < 5 && get("enamorangMonster") === $monster`none`,
          Macro.tryItem(itemOrSkill)
        );
      case $skill`Digitize`:
        return this.externalIf(
          monster !== $monster`none` && get("_sourceTerminalDigitizeMonster") !== monster,
          Macro.trySkill(itemOrSkill)
        );
    }

    // Unsupported item or skill
    return this;
  }

  static tryCopier(itemOrSkill: Item | Skill, monster: Monster = $monster`none`): Macro {
    return new Macro().tryCopier(itemOrSkill, monster);
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

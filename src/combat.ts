import {
  choiceFollowsFight,
  equippedAmount,
  equippedItem,
  Familiar,
  familiarWeight,
  getAutoAttack,
  getCounters,
  haveEquipped,
  haveSkill,
  hippyStoneBroken,
  inMultiFight,
  Item,
  itemAmount,
  itemType,
  mpCost,
  myAdventures,
  myBjornedFamiliar,
  myClass,
  myEnthronedFamiliar,
  myFamiliar,
  myFury,
  myLocation,
  myMp,
  mySoulsauce,
  myThrall,
  numericModifier,
  print,
  retrieveItem,
  runCombat,
  setAutoAttack,
  Skill,
  visitUrl,
} from "kolmafia";
import {
  $class,
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $monster,
  $monsters,
  $skill,
  $slot,
  $thralls,
  get,
  getTodaysHolidayWanderers,
  have,
  property,
  SourceTerminal,
  StrictMacro,
} from "libram";
import { meatFamiliar, timeToMeatify } from "./familiar";
import { digitizedMonstersRemaining } from "./wanderer";

let monsterManuelCached: boolean | undefined = undefined;
export function monsterManuelAvailable(): boolean {
  if (monsterManuelCached !== undefined) return Boolean(monsterManuelCached);
  monsterManuelCached = visitUrl("questlog.php?which=3").includes("Monster Manuel");
  return Boolean(monsterManuelCached);
}

function maxCarriedFamiliarDamage(familiar: Familiar): number {
  // Only considering familiars we reasonably may carry
  switch (familiar) {
    // +5 to Familiar Weight
    case $familiar`Animated Macaroni Duck`:
      return 50;
    case $familiar`Barrrnacle`:
    case $familiar`Gelatinous Cubeling`:
    case $familiar`Penguin Goodfella`:
      return 30;
    case $familiar`Misshapen Animal Skeleton`:
      return 40 + numericModifier("Spooky Damage");

    // +25% Meat from Monsters
    case $familiar`Hobo Monkey`:
      return 25;

    // +20% Meat from Monsters
    case $familiar`Grouper Groupie`:
      // Double sleaze damage at Barf Mountain
      return (
        25 + numericModifier("Sleaze Damage") * (myLocation() === $location`Barf Mountain` ? 2 : 1)
      );
    case $familiar`Jitterbug`:
      return 20;
    case $familiar`Mutant Cactus Bud`:
      // 25 poison damage (25+12+6+3+1)
      return 47;
    case $familiar`Robortender`:
      return 20;
  }

  return 0;
}

function maxFamiliarDamage(familiar: Familiar): number {
  switch (familiar) {
    case $familiar`Cocoabo`:
      return familiarWeight(familiar) + 3;
    case $familiar`Feather Boa Constrictor`:
      // Double sleaze damage at Barf Mountain
      return (
        familiarWeight(familiar) +
        3 +
        numericModifier("Sleaze Damage") * (myLocation() === $location`Barf Mountain` ? 2 : 1)
      );
    case $familiar`Ninja Pirate Zombie Robot`:
      return Math.floor((familiarWeight(familiar) + 3) * 1.5);
  }
  return 0;
}

export function maxPassiveDamage(): number {
  // Only considering passive damage sources we reasonably may have
  const vykeaMaxDamage =
    get("_VYKEACompanionLevel") > 0 ? 10 * get("_VYKEACompanionLevel") + 10 : 0;

  // Lasagmbie does max 2*level damage while Vermincelli does max level + (1/2 * level) + (1/2 * 1/2 * level) + ...
  const thrallMaxDamage =
    myThrall().level >= 5 && $thralls`Lasagmbie,Vermincelli`.includes(myThrall())
      ? myThrall().level * 2
      : 0;

  const crownMaxDamage = haveEquipped($item`Crown of Thrones`)
    ? maxCarriedFamiliarDamage(myEnthronedFamiliar())
    : 0;

  const bjornMaxDamage = haveEquipped($item`Buddy Bjorn`)
    ? maxCarriedFamiliarDamage(myBjornedFamiliar())
    : 0;

  const familiarMaxDamage = maxFamiliarDamage(myFamiliar());

  return vykeaMaxDamage + thrallMaxDamage + crownMaxDamage + bjornMaxDamage + familiarMaxDamage;
}

export function shouldRedigitize(): boolean {
  const digitizesLeft = SourceTerminal.getDigitizeUsesRemaining();
  const monsterCount = SourceTerminal.getDigitizeMonsterCount() + 1;
  // triangular number * 10 - 3
  const digitizeAdventuresUsed = monsterCount * (monsterCount + 1) * 5 - 3;
  // Redigitize if fewer adventures than this digitize usage.
  return (
    SourceTerminal.have() &&
    SourceTerminal.canDigitize() &&
    myAdventures() * 1.04 < digitizesLeft * digitizeAdventuresUsed
  );
}

export class Macro extends StrictMacro {
  submit(): string {
    print(this.components.join(";"));
    return super.submit();
  }

  tryHaveSkill(skill: Skill | null): Macro {
    if (!skill) return this;
    return this.externalIf(haveSkill(skill), Macro.trySkill(skill));
  }

  static tryHaveSkill(skill: Skill | null): Macro {
    return new Macro().tryHaveSkill(skill);
  }

  tryHaveItem(item: Item | null): Macro {
    if (!item) return this;
    return this.externalIf(have(item), Macro.tryItem(item));
  }

  static tryHaveItem(item: Item | null): Macro {
    return new Macro().tryHaveItem(item);
  }

  tryCopier(itemOrSkill: Item | Skill): Macro {
    switch (itemOrSkill) {
      case $item`Spooky Putty sheet`:
        return this.externalIf(
          get("spookyPuttyCopiesMade") + Math.max(1, get("_raindohCopiesMade")) < 6 &&
            $items`Spooky Putty sheet, Spooky Putty monster`.some((item) => have(item)),
          Macro.tryItem(itemOrSkill)
        );
      case $item`Rain-Doh black box`:
        return this.externalIf(
          get("_raindohCopiesMade") + Math.max(1, get("spookyPuttyCopiesMade")) < 6 &&
            $items`Rain-Doh black box, Rain-Doh box full of monster`.some((item) => have(item)),
          Macro.tryItem(itemOrSkill)
        );
      case $item`4-d camera`:
        return this.externalIf(
          !get("_cameraUsed") && !have($item`shaking 4-d camera`),
          Macro.tryHaveItem(itemOrSkill)
        );
      case $item`crappy camera`:
        return this.externalIf(
          !get("_crappyCameraUsed") && !have($item`shaking crappy camera`),
          Macro.tryHaveItem(itemOrSkill)
        );
      case $item`unfinished ice sculpture`:
        return this.externalIf(
          !get("_iceSculptureUsed") && !have($item`ice sculpture`),
          Macro.tryHaveItem(itemOrSkill)
        );
      case $item`pulled green taffy`:
        return this.externalIf(
          !get("_envyfishEggUsed") && !have($item`envyfish egg`),
          Macro.tryHaveItem(itemOrSkill)
        );
      case $item`print screen button`:
        return this.tryHaveItem(itemOrSkill);
      case $item`alpine watercolor set`:
        return this.tryHaveItem(itemOrSkill);
      case $item`LOV Enamorang`:
        return this.externalIf(
          get("_enamorangs") < 5 && !get("enamorangMonster"),
          Macro.tryHaveItem(itemOrSkill)
        );
      case $skill`Digitize`:
        return this.externalIf(SourceTerminal.canDigitize(), Macro.trySkill(itemOrSkill));
    }

    // Unsupported item or skill
    return this;
  }

  static tryCopier(itemOrSkill: Item | Skill): Macro {
    return new Macro().tryCopier(itemOrSkill);
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

    const willCrit = sealClubberSetup || opsSetup || katanaSetup || capeSetup;

    return this.externalIf(
      shouldRedigitize(),
      Macro.if_($monster`Knob Goblin Embezzler`, Macro.trySkill($skill`Digitize`))
    )
      .tryHaveSkill($skill`Sing Along`)
      .externalIf(
        digitizedMonstersRemaining() <= 5 - get("_meteorShowerUses") &&
          have($skill`Meteor Lore`) &&
          get("_meteorShowerUses") < 5,
        Macro.if_($monster`Knob Goblin Embezzler`, Macro.trySkill($skill`Meteor Shower`))
      )
      .trySkill($skill`Bowl Straight Up`)
      .externalIf(
        have($skill`Transcendent Olfaction`) &&
          property.getString("olfactedMonster") !== "garbage tourist" &&
          get("_olfactionsUsed") < 3,
        Macro.if_($monster`garbage tourist`, Macro.trySkill($skill`Transcendent Olfaction`))
      )
      .externalIf(
        get("_gallapagosMonster") !== $monster`garbage tourist` &&
          have($skill`Gallapagosian Mating Call`),
        Macro.if_($monster`garbage tourist`, Macro.trySkill($skill`Gallapagosian Mating Call`))
      )
      .externalIf(
        !get("_latteCopyUsed") &&
          (get("_latteMonster") !== $monster`garbage tourist` ||
            getCounters("Latte Monster", 0, 30).trim() === "") &&
          have($item`latte lovers member's mug`),
        Macro.if_($monster`garbage tourist`, Macro.trySkill($skill`Offer Latte to Opponent`))
      )
      .externalIf(
        get("_feelNostalgicUsed") < 3 &&
          get("lastCopyableMonster") === $monster`garbage tourist` &&
          have($skill`Feel Nostalgic`),
        Macro.if_(
          `!monsterid ${$monster`garbage tourist`.id}`,
          Macro.trySkill($skill`Feel Nostalgic`)
        )
      )
      .externalIf(
        myFamiliar() === $familiar`Space Jellyfish`,
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> 6b0d297 (All barf tourists are stench-aligned)
        Macro.if_(
          $monsters`angry tourist, garbage tourist, horrible tourist family`,
          Macro.trySkill($skill`Extract Jelly`)
        )
<<<<<<< HEAD
=======
        Macro.if_($monster`garbage tourist`, Macro.trySkill($skill`Extract Jelly`))
>>>>>>> 3226157 (EoD support of Space Jellyfish)
=======
>>>>>>> 6b0d297 (All barf tourists are stench-aligned)
      )
      .externalIf(opsSetup, Macro.trySkill($skill`Throw Shield`))
      .meatStasis(willCrit)
      .externalIf(
        hippyStoneBroken() && monsterManuelAvailable(),
        Macro.if_(
          `(monsterid 1758 || monsterid 1759 || monsterid 1760) && monsterhpbelow ${Math.floor(
            (100 + numericModifier("Monster Level")) / 5
          )}`,
          Macro.trySkill($skill`Feel Superior`)
        )
      )
      .externalIf(sealClubberSetup, Macro.trySkill($skill`Furious Wallop`))
      .externalIf(opsSetup, Macro.attack())
      .externalIf(katanaSetup, Macro.trySkill($skill`Summer Siesta`))
      .externalIf(capeSetup, Macro.trySkill($skill`Precision Shot`))
      .externalIf(
        myClass() === $class`Disco Bandit`,
        Macro.trySkill($skill`Disco Dance of Doom`)
          .trySkill($skill`Disco Dance II: Electric Boogaloo`)
          .trySkill($skill`Disco Dance 3: Back in the Habit`)
      )
      .kill();
  }

  static meatKill(): Macro {
    return new Macro().meatKill();
  }

  meatStasis(checkPassive: boolean): Macro {
    // We can't stasis without manuel's monsterhpabove if we want to crit
    if (checkPassive && !monsterManuelAvailable()) {
      return this;
    }

    const checkGet = (i: Item) => have(i) && (itemAmount(i) > 0 || retrieveItem(i));
    const stasisItem = $items`facsimile dictionary, dictionary, seal tooth`.find(checkGet);

    // We retrieve a seal tooth at the start of the day, so this is just to make sure nothing has gone awry.
    if (!stasisItem) throw new Error("Acquire a seal tooth and run garbo again.");

    // Construct the monster HP component of the stasis condition
    // Evaluate the passive damage
    const passiveDamage = maxPassiveDamage() + 5;
    // Are we aiming to crit? If so, we need to respect the passive damage
    // Also we need to respect our health total
    const hpCheck = checkPassive
      ? `!hppercentbelow 25 && monsterhpabove ${passiveDamage}`
      : "!hppercentbelow 25";
    // Same story but for the sixgun shot, which wants 40 more HP if possible
    const hpCheckSixgun = checkPassive
      ? `!hppercentbelow 25 && monsterhpabove ${passiveDamage + 40}`
      : "!hppercentbelow 25";

    // Determine how long we'll be stasising for
    // By default there's no reason to stasis
    let stasisRounds = 0;
    if (
      [
        $familiar`Cocoabo`,
        $familiar`Feather Boa Constrictor`,
        $familiar`Ninja Pirate Zombie Robot`,
        $familiar`Stocking Mimic`,
      ].includes(myFamiliar())
    ) {
      // Cocoabo-likes drop meat for the first ten rounds of combat
      stasisRounds = 10;
    }
    if (
      myFamiliar() === $familiar`Hobo Monkey` ||
      haveEquipped($item`Buddy Bjorn`) ||
      haveEquipped($item`Crown of Thrones`) ||
      get("_bittycar")
    ) {
      // These things can take a little longer to proc sometimes
      stasisRounds = 20;
    }

    // Ignore unexpected monsters, holiday scaling monsters seem to abort with monsterhpabove
    // Delevel the sausage goblins as otherwise they can kind of hurt
    return this.if_(
      "monstername angry tourist || monstername garbage tourist || monstername horrible tourist family || monstername Knob Goblin Embezzler || monstername sausage goblin",
      Macro.externalIf(
        have($item`Time-Spinner`),
        Macro.if_(
          `${hpCheck} && monstername sausage goblin`,
          Macro.tryHaveItem($item`Time-Spinner`)
        )
      )
        .externalIf(
          have($skill`Meteor Lore`),
          Macro.if_(
            `${hpCheck} && monstername sausage goblin`,
            Macro.tryHaveSkill($skill`Micrometeorite`)
          )
        )
        .externalIf(
          haveEquipped($item`Pantsgiving`),
          Macro.if_(`${hpCheck}`, Macro.trySkill($skill`Pocket Crumbs`))
        )
        .externalIf(
          SourceTerminal.getSkills().includes($skill`Extract`),
          Macro.if_(`${hpCheck}`, Macro.trySkill($skill`Extract`))
        )
        .externalIf(
          haveEquipped($item`vampyric cloake`) && get("_vampyreCloakeFormUses") < 10,
          Macro.if_(`${hpCheck}`, Macro.tryHaveSkill($skill`Become a Wolf`))
        )
        .externalIf(
          have($item`porquoise-handled sixgun`),
          Macro.if_(`${hpCheckSixgun}`, Macro.tryItem($item`porquoise-handled sixgun`))
        )
        .while_(`${hpCheck} && !pastround ${stasisRounds}`, Macro.item(stasisItem))
    );
  }

  static meatStasis(checkPassive: boolean): Macro {
    return new Macro().meatStasis(checkPassive);
  }

  startCombat(): Macro {
    return this.tryHaveSkill($skill`Sing Along`)
      .tryHaveSkill($skill`Curse of Weaksauce`)
      .externalIf(
        myFamiliar() === $familiar`Grey Goose` && timeToMeatify(),
        Macro.trySkill($skill`Meatify Matter`)
      )
      .externalIf(
        get("cosmicBowlingBallReturnCombats") < 1,
        Macro.trySkill($skill`Bowl Straight Up`)
      )
      .externalIf(
        haveEquipped($item`vampyric cloake`) && get("_vampyreCloakeFormUses") < 10,
        Macro.tryHaveSkill($skill`Become a Wolf`)
      )
      .externalIf(haveEquipped($item`Pantsgiving`), Macro.trySkill($skill`Pocket Crumbs`))
      .externalIf(
        SourceTerminal.getSkills().includes($skill`Extract`),
        Macro.trySkill($skill`Extract`)
      )
      .tryHaveItem($item`porquoise-handled sixgun`)
      .externalIf(have($skill`Meteor Lore`), Macro.trySkill($skill`Micrometeorite`))
      .tryHaveItem($item`Time-Spinner`)
      .tryHaveItem($item`Rain-Doh indigo cup`)
      .tryHaveItem($item`Rain-Doh blue balls`)
      .externalIf(
        haveEquipped($item`Buddy Bjorn`) || haveEquipped($item`Crown of Thrones`),
        Macro.while_("!pastround 3 && !hppercentbelow 25", Macro.item($item`seal tooth`))
      )
      .externalIf(
        [
          $familiar`Cocoabo`,
          $familiar`Feather Boa Constrictor`,
          $familiar`Ninja Pirate Zombie Robot`,
          $familiar`Stocking Mimic`,
        ].some((familiar) => myFamiliar() === familiar),
        Macro.while_("!pastround 10 && !hppercentbelow 25", Macro.item($item`seal tooth`))
      )
      .externalIf(
        myFamiliar() === $familiar`Hobo Monkey`,
        Macro.while_(
          `!match "shoulder, and hands you some Meat." && !pastround 5 && !hppercentbelow 25`,
          Macro.item($item`seal tooth`)
        )
      );
  }

  static startCombat(): Macro {
    return new Macro().startCombat();
  }

  kill(): Macro {
    return (
      this.externalIf(
        myClass() === $class`Sauceror` && have($skill`Curse of Weaksauce`),
        Macro.trySkill($skill`Curse of Weaksauce`)
      )
        .tryHaveSkill($skill`Become a Wolf`)
        .externalIf(
          !(myClass() === $class`Sauceror` && have($skill`Curse of Weaksauce`)),
          Macro.while_("!pastround 24 && !hppercentbelow 25 && !missed 1", Macro.attack())
        )
        // Using while_ here in case you run out of mp
        .while_("hasskill Saucegeyser", Macro.skill($skill`Saucegeyser`))
        .while_("hasskill Weapon of the Pastalord", Macro.skill($skill`Weapon of the Pastalord`))
        .while_("hasskill Cannelloni Cannon", Macro.skill($skill`Cannelloni Cannon`))
        .while_("hasskill Wave of Sauce", Macro.skill($skill`Wave of Sauce`))
        .while_("hasskill Saucestorm", Macro.skill($skill`Saucestorm`))
        .while_("hasskill Lunging Thrust-Smack", Macro.skill($skill`Lunging Thrust-Smack`))
        .attack()
        .repeat()
    );
  }

  static kill(): Macro {
    return new Macro().kill();
  }

  basicCombat(): Macro {
    return this.startCombat().kill();
  }

  static basicCombat(): Macro {
    return new Macro().basicCombat();
  }

  ghostBustin(): Macro {
    // Only bust ghosts if you have enough stunners to prevent getting hit
    let stunRounds = 0;
    let classStun: Skill | null = null;
    let extraStun: Skill | null = null;
    if (have($item`Rain-Doh blue balls`)) stunRounds++;
    if (get("lovebugsUnlocked")) stunRounds++;
    if (
      myClass() === $class`Seal Clubber` &&
      have($skill`Club Foot`) &&
      myMp() >= mpCost($skill`Club Foot`)
    ) {
      const clubRounds =
        Math.min(myFury(), 3) + (itemType(equippedItem($slot`weapon`)) === "club" ? 1 : 0) - 1;
      if (stunRounds > 0) {
        classStun = $skill`Club Foot`;
        stunRounds += clubRounds;
      }
    } else if (
      myClass() === $class`Turtle Tamer` &&
      have($skill`Shell Up`) &&
      myMp() >= mpCost($skill`Shell Up`)
    ) {
      const shellRounds =
        (have($effect`Blessing of the Storm Tortoise`) ? 2 : 0) +
        (have($effect`Grand Blessing of the Storm Tortoise`) ? 3 : 0) +
        (have($effect`Glorious Blessing of the Storm Tortoise`) ? 4 : 0);
      if (shellRounds > 0) {
        classStun = $skill`Shell Up`;
        stunRounds += shellRounds;
      }
    } else if (
      myClass() === $class`Pastamancer` &&
      have($skill`Entangling Noodles`) &&
      myMp() >= mpCost($skill`Entangling Noodles`)
    ) {
      classStun = $skill`Entangling Noodles`;
      stunRounds += 2;
    } else if (myClass() === $class`Sauceror` && have($skill`Soul Bubble`) && mySoulsauce() >= 5) {
      classStun = $skill`Soul Bubble`;
      stunRounds += 2;
    } else if (
      myClass() === $class`Accordion Thief` &&
      have($skill`Accordion Bash`) &&
      itemType(equippedItem($slot`weapon`)) === "accordion" &&
      myMp() >= mpCost($skill`Accordion Bash`)
    ) {
      classStun = $skill`Accordion Bash`;
      stunRounds += 2;
    } else if (myClass() === $class`Disco Bandit`) {
      // Rave Knockout seems like a pain
    }

    // Don't use shadow noodles unless we really need it.
    if (
      stunRounds < 3 &&
      classStun !== $skill`Entangling Noodles` &&
      have($skill`Shadow Noodles`) &&
      myMp() >= mpCost(classStun ?? $skill`none`) + mpCost($skill`Shadow Noodles`)
    ) {
      extraStun = $skill`Shadow Noodles`;
      stunRounds += 2;
    }

    // Lacking multi-round stuns
    if (stunRounds < 3) {
      return this.basicCombat();
    }

    return this.tryHaveSkill($skill`Sing Along`)
      .externalIf(
        myFamiliar() === $familiar`Grey Goose` && timeToMeatify(),
        Macro.trySkill($skill`Meatify Matter`)
      )
      .tryHaveItem($item`Rain-Doh blue balls`)
      .externalIf(get("lovebugsUnlocked"), Macro.trySkill($skill`Summon Love Gnats`))
      .tryHaveSkill(classStun)
      .tryHaveSkill(extraStun)
      .trySkill($skill`Shoot Ghost`)
      .trySkill($skill`Shoot Ghost`)
      .trySkill($skill`Shoot Ghost`)
      .trySkill($skill`Trap Ghost`)
      .kill();
  }

  static ghostBustin(): Macro {
    return new Macro().ghostBustin();
  }
}

/**
 * Attempt to perform a nonstandard combat-starting Action with a Macro
 * @param macro The Macro to attempt to use
 * @param action The combat-starting action to attempt
 * @param tryAuto Whether or not we should try to resolve the combat with an autoattack; autoattack macros can fail against special monsters, and thus we have to submit a macro with Macro.save() regardless
 * @returns The output of your specified action function (typically void)
 */
export function withMacro<T>(macro: Macro, action: () => T, tryAuto = false): T {
  if (getAutoAttack() !== 0) setAutoAttack(0);
  if (tryAuto) macro.setAutoAttack();
  macro.save();
  try {
    return action();
  } finally {
    Macro.clearSaved();
    if (tryAuto) setAutoAttack(0);
  }
}

export function main(): void {
  if (have($effect`Eldritch Attunement`)) {
    Macro.if_($monster`Eldritch Tentacle`, Macro.basicCombat())
      .step(Macro.load())
      .submit();
  } else if (getTodaysHolidayWanderers().length !== 0) {
    Macro.ifHolidayWanderer(
      Macro.externalIf(
        haveEquipped($item`backup camera`) &&
          get("_backUpUses") < 11 &&
          get("lastCopyableMonster") === $monster`Knob Goblin Embezzler` &&
          myFamiliar() === meatFamiliar(),
        Macro.skill($skill`Back-Up to your Last Enemy`).step(Macro.load()),
        Macro.basicCombat()
      )
    )
      .step(Macro.load())
      .submit();
  } else {
    Macro.load().submit();
  }
  while (inMultiFight()) runCombat();
  if (choiceFollowsFight()) visitUrl("choice.php");
}

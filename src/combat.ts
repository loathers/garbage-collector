import { equippedAmount, equippedItem, itemType, myClass } from "kolmafia";
import { $class, $item, $skill, $slot, get, have, Macro as LibramMacro } from "libram";

export class Macro extends LibramMacro {
  meatKill() {
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
    return Macro.skill("Sing Along")
      .externalIf(sealClubberSetup, Macro.skill("Furious Wallop"))
      .externalIf(opsSetup, Macro.skill("Throw Shield").attack())
      .externalIf(katanaSetup, Macro.skill("Summer Siesta"))
      .externalIf(capeSetup, Macro.skill("Precision Shot"));
  }

  static meatKill() {
    return new Macro().meatKill();
  }
}

export function main(): void {
  Macro.load().submit();
}

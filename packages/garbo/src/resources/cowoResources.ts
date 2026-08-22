import {
  Familiar,
  isBanished,
  Item,
  mallPrice,
  Monster,
  myClass,
  myFury,
  toSlot,
  weaponHands,
  weaponType,
} from "kolmafia";
import {
  $class,
  $item,
  $monsters,
  $skill,
  $slot,
  get,
  getBanishedMonsters,
  have,
  Macro,
} from "libram";
import { garboValue } from "../garboValue";
import { Outfit } from "grimoire-kolmafia";

const monsters = $monsters`Mer-kin rustler, sea cowboy`;

export function getCowoMonstersToBanish(): Monster[] {
  return monsters.filter((monster) => !isBanished(monster));
}

interface BanishMethod {
  available: () => boolean;
  macro: Macro;
  name: string;
  equip?: Item | Familiar;
}

const banishMethods: BanishMethod[] = [
  {
    name: "Monkey Slap",
    available: () =>
      get("_monkeyPawWishesUsed") === 0 && have($item`cursed monkey's paw`),
    macro: Macro.trySkill($skill`Monkey Slap`),
    equip: $item`cursed monkey's paw`,
  },
  {
    name: "Spring Kick",
    available: () => have($item`spring shoes`),
    macro: Macro.trySkill($skill`Spring Kick`).trySkill($skill`Spring Away`),
    equip: $item`spring shoes`,
  },
  {
    name: "Batter Up!",
    available: () =>
      myClass() === $class`Seal Clubber` &&
      have($skill`Batter Up!`) &&
      myFury() >= 5,
    macro: Macro.trySkill($skill`Batter Up!`),
    equip: $item`seal-clubbing club`,
  },
  {
    name: "human musk",
    available: () => true,
    macro: Macro.tryItem($item`human musk`),
  },
  {
    name: "Sea *dent: Throw a Lightning Bolt",
    available: () =>
      have($item`Monodent of the Sea`) && get("_seadentLightningUsed", 0) < 11,
    equip: $item`Monodent of the Sea`,
    macro: Macro.trySkill($skill`Sea *dent: Throw a Lightning Bolt`),
  },
  /* {
    name: "Unleash Nanites",
    available: () => have($effect`Nanobrawny`),
    macro: () => Macro.trySkill($skill`Unleash Nanites`),
    equip: have($familiar`Nanorhino`) ? $familiar`Nanorhino` : $familiar`Comma Chameleon`
  }, */
];

function banishMethodInUse(method: BanishMethod): boolean {
  const banished = getBanishedMonsters();

  for (const [sourceItemOrSkill, banishedMonster] of banished.entries()) {
    if (
      monsters.includes(banishedMonster) && // our critical list
      (method.name === sourceItemOrSkill.name || // Match by name (item or skill)
        false) // you can extend this if necessary
    ) {
      return true;
    }
  }
  return false;
}

export function cowoChooseBanish(): BanishMethod | null {
  if (getCowoMonstersToBanish().length === 0) {
    return null;
  }
  for (const method of banishMethods) {
    if (method.available() && !banishMethodInUse(method)) {
      return method;
    }
  }
  return null;
}

const RED_TAFFY_DROP_WEIGHTS = new Map<Item, number>([
  [$item`Alewife™ Ale`, 0.03],
  [$item`bazookafish bubble gum`, 0.03],
  [$item`beefy fish meat`, 0.03],
  [$item`dull fish scale`, 0.0925],
  [$item`eel battery`, 0.03],
  [$item`eel sauce`, 0.03],
  [$item`glistening fish meat`, 0.03],
  [$item`high-pressure seltzer bottle`, 0.03],
  [$item`imitation crab crate`, 0.03],
  [$item`ink bladder`, 0.03],
  [$item`live nautical mine`, 0.03],
  [$item`Mer-kin healscroll`, 0.03],
  [$item`Mer-kin lunchbox`, 0.0925],
  [$item`Mer-kin thingpouch`, 0.03],
  [$item`pufferfish spine`, 0.03],
  [$item`rough fish scale`, 0.03],
  [$item`salinated mint julep`, 0.03],
  [$item`sand dollar`, 0.125],
  [$item`sea lace`, 0.03],
  [$item`seaweed`, 0.03],
  [$item`shark cartilage`, 0.03],
  [$item`slick fish meat`, 0.03],
  [$item`slug of rum`, 0.03],
  [$item`slug of shochu`, 0.03],
  [$item`slug of vodka`, 0.03],
  [$item`soggy seed packet`, 0.03],
]);

export function redTaffyWorth(): boolean {
  const averageRedTaffyValue = [...RED_TAFFY_DROP_WEIGHTS.entries()].reduce(
    (total, [item, weight]) => total + garboValue(item) * weight,
    0,
  );

  return mallPrice($item`pulled red taffy`) < averageRedTaffyValue;
}

/**
 * Equip a banish method's gear without creating an illegal dual-wield.
 *
 * KoL refuses an off-hand weapon of a different WeaponType and Outfit.equip()
 * does not check that, so dress() would fail. When dual-wielding is not legal
 * the banish item takes the weapon slot, restoring the weapon if it will not go
 * on.
 * @param outfit The outfit to add the banish gear to
 * @param thing The gear the chosen banish method needs equipped
 * @returns Whether the gear was equipped
 */
export function equipBanishGear(
  outfit: Outfit,
  thing: Item | Familiar,
): boolean {
  if (!(thing instanceof Item) || toSlot(thing) !== $slot`weapon`) {
    return outfit.equip(thing);
  }

  const weapon = outfit.equips.get($slot`weapon`);
  if (!weapon) return outfit.equip(thing, $slot`weapon`);

  const canDualWield =
    !outfit.equips.has($slot`off-hand`) &&
    have($skill`Double-Fisted Skull Smashing`) &&
    weaponHands(weapon) === 1 &&
    weaponHands(thing) === 1 &&
    weaponType(weapon) === weaponType(thing);
  if (canDualWield && outfit.equip(thing, $slot`off-hand`)) return true;

  outfit.equips.delete($slot`weapon`);
  if (outfit.equip(thing, $slot`weapon`)) return true;
  outfit.equips.set($slot`weapon`, weapon);
  return false;
}

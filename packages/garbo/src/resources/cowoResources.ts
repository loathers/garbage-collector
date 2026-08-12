import { Familiar, Item, mallPrice, Monster, myClass, myFury } from "kolmafia";
import {
  $class,
  $item,
  $monsters,
  $skill,
  get,
  getBanishedMonsters,
  have,
  Macro,
} from "libram";
import { garboAverageValue } from "../garboValue";

const monsters = $monsters`Mer-kin rustler, sea cowboy`;

export function getCowoMonstersToBanish(): Monster[] {
  const banishedMonsters = getBanishedMonsters();
  const alreadyBanished = Array.from(banishedMonsters.values());
  return monsters.filter((monster) => !alreadyBanished.includes(monster));
}

interface BanishMethod {
  available: () => boolean;
  macro: () => Macro;
  name: string;
  equip?: Item | Familiar;
}

const banishMethods: BanishMethod[] = [
  {
    name: "Monkey Slap",
    available: () =>
      get("_monkeyPawWishesUsed") === 0 && have($item`cursed monkey's paw`),
    macro: () => Macro.trySkill($skill`Monkey Slap`),
    equip: $item`cursed monkey's paw`,
  },
  {
    name: "Spring Kick",
    available: () => have($item`spring shoes`),
    macro: () =>
      Macro.trySkill($skill`Spring Kick`)
        .trySkill($skill`Spring Away`)
        .runaway(),
    equip: $item`spring shoes`,
  },
  {
    name: "Batter Up!",
    available: () =>
      myClass() === $class`Seal Clubber` &&
      have($skill`Batter Up!`) &&
      myFury() >= 5,
    macro: () => Macro.trySkill($skill`Batter Up!`),
    equip: $item`seal-clubbing club`,
  },
  {
    name: "human musk",
    available: () => true,
    macro: () => Macro.tryItem($item`human musk`),
  },
  {
    name: "Monodent",
    available: () =>
      have($item`Monodent of the Sea`) && get("_seadentLightningUsed", 0) < 11,
    equip: $item`Monodent of the Sea`,
    macro: () => Macro.trySkill($skill`Sea *dent: Throw a Lightning Bolt`),
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

export function redTaffyWorth(): boolean {
  return (
    mallPrice($item`pulled red taffy`) <
    garboAverageValue(
      $item`Alewife™ Ale`,
      $item`bazookafish bubble gum`,
      $item`beefy fish meat`,
      $item`dull fish scale`,
      $item`eel battery`,
      $item`eel sauce`,
      $item`glistening fish meat`,
      $item`high-pressure seltzer bottle`,
      $item`imitation crab crate`,
      $item`ink bladder`,
      $item`live nautical mine`,
      $item`Mer-kin healscroll`,
      $item`Mer-kin lunchbox`,
      $item`Mer-kin thingpouch`,
      $item`pufferfish spine`,
      $item`rough fish scale`,
      $item`salinated mint julep`,
      $item`sand dollar`,
      $item`sea lace`,
      $item`seaweed`,
      $item`shark cartilage`,
      $item`slick fish meat`,
      $item`slug of rum`,
      $item`slug of shochu`,
      $item`slug of vodka`,
      $item`soggy seed packet`,
    )
  );
}

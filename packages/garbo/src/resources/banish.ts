import { isBanished, Item, Monster, myClass, myFury, Skill } from "kolmafia";
import {
  $class,
  $item,
  $monster,
  $skill,
  get,
  getBanishedMonsters,
  have,
  MonodentOfTheSea,
  StrictMacro,
} from "libram";

export type BanishMethod = {
  available: () => boolean;
  macro: StrictMacro;
  source: Skill | Item;
  equip?: Item;
  retrieve?: boolean;
};

const banishMethods: BanishMethod[] = [
  {
    source: $skill`Spring Kick`,
    available: () => have($item`spring shoes`),
    macro: StrictMacro.trySkill($skill`Spring Kick`).trySkill(
      $skill`Spring Away`,
    ),
    equip: $item`spring shoes`,
  },
  {
    source: $skill`Batter Up!`,
    available: () =>
      myClass() === $class`Seal Clubber` &&
      have($skill`Batter Up!`) &&
      myFury() >= 5,
    macro: StrictMacro.trySkill($skill`Batter Up!`),
    equip: $item`seal-clubbing club`,
  },
  {
    source: $skill`Order a Kneecapping`,
    available: () =>
      have($skill`Order a Kneecapping`) && !get("_kneecappingOrdered"),
    macro: StrictMacro.trySkill($skill`Order a Kneecapping`),
  },
  {
    source: $item`human musk`,
    available: () => true,
    macro: StrictMacro.tryItem($item`human musk`),
    retrieve: true,
  },
  {
    source: MonodentOfTheSea.skills.ThrowALightningBolt,
    available: () => MonodentOfTheSea.lightningBoltsRemaining() > 0,
    equip: $item`Monodent of the Sea`,
    macro: StrictMacro.trySkill(MonodentOfTheSea.skills.ThrowALightningBolt),
  },
];

function availableBanishes(banishMonsters: readonly Monster[]): BanishMethod[] {
  const banishedMonsters = getBanishedMonsters();
  return banishMethods.filter(
    (method) =>
      method.available() &&
      !banishMonsters.includes(
        banishedMonsters.get(method.source) ?? $monster.none,
      ),
  );
}

export function haveEnoughBanishes(
  banishMonsters: readonly Monster[],
): boolean {
  return (
    availableBanishes(banishMonsters).length >=
    banishMonsters.filter((monster) => !isBanished(monster)).length
  );
}

export function chooseBanish(
  banishMonsters: readonly Monster[],
  targetMonster: Monster,
): BanishMethod | null {
  if (banishMonsters.every((monster) => isBanished(monster))) return null;

  const available = availableBanishes(banishMonsters);
  const banishedMonsters = getBanishedMonsters();

  // If a preceding script banished our target, reuse that banish first.
  return (
    available.find(
      (method) => banishedMonsters.get(method.source) === targetMonster,
    ) ??
    // Otherwise use FIFO.
    available[0] ??
    null
  );
}

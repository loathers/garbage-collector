import {
  isBanished,
  Item,
  mallPrice,
  Monster,
  myClass,
  myFury,
  Skill,
} from "kolmafia";
import {
  $class,
  $item,
  $monster,
  $skill,
  get,
  getBanishedMonsters,
  have,
  sum,
} from "libram";
import { garboValue } from "../garboValue";
import { farmingStrategy } from "../farmingStrategy";
import { Macro } from "../combat";

export function getMonstersToBanish(): Monster[] {
  return farmingStrategy().monstersToBanish.filter(
    (monster) => !isBanished(monster),
  );
}

export type BanishMethod = {
  available: () => boolean;
  macro: Macro;
  source: Skill | Item;
  equip?: Item;
  retrieve?: boolean;
};

const banishMethods: BanishMethod[] = [
  {
    source: $skill`Spring Kick`,
    available: () => have($item`spring shoes`),
    macro: Macro.trySkill($skill`Spring Kick`).trySkill($skill`Spring Away`),
    equip: $item`spring shoes`,
  },
  {
    source: $skill`Batter Up!`,
    available: () =>
      myClass() === $class`Seal Clubber` &&
      have($skill`Batter Up!`) &&
      myFury() >= 5,
    macro: Macro.trySkill($skill`Batter Up!`),
    equip: $item`seal-clubbing club`,
  },
  {
    source: $skill`Order a Kneecapping`,
    available: () =>
      have($skill`Order a Kneecapping`) && !get("_kneecappingOrdered"),
    macro: Macro.trySkill($skill`Order a Kneecapping`),
  },
  {
    source: $item`human musk`,
    available: () => true,
    macro: Macro.tryItem($item`human musk`),
    retrieve: true,
  },
  {
    source: $skill`Sea *dent: Throw a Lightning Bolt`,
    available: () =>
      have($item`Monodent of the Sea`) && get("_seadentLightningUsed", 0) < 11,
    equip: $item`Monodent of the Sea`,
    macro: Macro.trySkill($skill`Sea *dent: Throw a Lightning Bolt`),
  },
];

export function chooseBanish(): BanishMethod | null {
  if (getMonstersToBanish().length === 0) {
    return null;
  }

  const banishedMonsters = getBanishedMonsters();

  return (
    banishMethods.find(
      (method) =>
        method.available() &&
        !farmingStrategy().monstersToBanish.includes(
          banishedMonsters.get(method.source) ?? $monster.none,
        ),
    ) ?? null
  );
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
  const averageRedTaffyValue = sum(
    [...RED_TAFFY_DROP_WEIGHTS.entries()],
    ([item, weight]) => garboValue(item) * weight,
  );

  return mallPrice($item`pulled red taffy`) < averageRedTaffyValue;
}

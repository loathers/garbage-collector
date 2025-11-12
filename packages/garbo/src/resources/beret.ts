import { Effect, effectsModifier, Item, Skill, toSkill } from "kolmafia";
import {
  getAcquirePrice,
  getModifier,
  have,
  NumericModifier,
  sum,
} from "libram";
import { baseMeat, marginalFamWeightValue } from "../lib";

export function beretEffectValue(effect: Effect, duration: number) {
  const skill = toSkill(effect);
  if (skill !== Skill.none && have(skill)) return 0;
  const meatValue =
    duration *
    sum(
      [
        {
          modifier: "Meat Drop",
          value: baseMeat() / 100,
        },
        {
          modifier: "Familiar Weight",
          value: (marginalFamWeightValue() * baseMeat()) / 100,
        },
      ],
      ({ modifier, value }: { modifier: NumericModifier; value: number }) =>
        value * getModifier(modifier, effect),
    );
  if (meatValue <= 0) return meatValue;
  const potionPrices = Item.all()
    .filter(
      (i) =>
        i.potion &&
        i.tradeable &&
        effectsModifier(i, "Effect").includes(effect),
    )
    .map(
      (i) =>
        (getAcquirePrice(i) * duration) / getModifier("Effect Duration", i),
    );
  return Math.min(meatValue, ...potionPrices);
}

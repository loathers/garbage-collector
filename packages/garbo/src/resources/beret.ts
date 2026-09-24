import { Effect, effectsModifier, Item, Skill, toSkill } from "kolmafia";
import { getAcquirePrice, getModifier, have } from "libram";
import { effectValue } from "../potions";

export function beretEffectValue(effect: Effect, duration: number) {
  const skill = toSkill(effect);
  if (skill !== Skill.none && have(skill)) return 0;
  const value = effectValue(effect, duration);

  if (value <= 0) return value;
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
  return Math.min(value, ...potionPrices);
}

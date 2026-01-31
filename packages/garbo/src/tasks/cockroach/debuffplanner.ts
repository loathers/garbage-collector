import {
  abort,
  Effect,
  isShruggable,
  Item,
  myBuffedstat,
  print,
  retrieveItem,
  Stat,
  StatType,
  use,
} from "kolmafia";
import {
  $effect,
  $item,
  $items,
  $stat,
  clamp,
  getAcquirePrice,
  getActiveEffects,
  getModifier,
  have,
  maxBy,
  sum,
  uneffect,
} from "libram";
import { acquire } from "../../acquire";
import {
  asEffect,
  ignoreBeatenUp,
  improvedStats,
  improvesAStat,
  totalModifier,
} from "../../lib";
import { VALUABLE_MODIFIERS } from "../../potions";

type DebuffPlanElement =
  | { type: "potion"; target: Item }
  | { type: "shrug"; target: Effect }
  | { type: "uneffect"; target: Effect };

export class DebuffPlanner {
  plan: DebuffPlanElement[] = [];
  itemBanList = $items`pill cup`;
  priceCap = 150_000; // Chosen at random by Shiverwarp
  sizeCap = 69; // Chosen at random by sweaty bill

  possibleDebuffItems: Partial<
    Record<StatType, { item: Item; effect: Effect }[]>
  > = {};

  private constructor() {
    this.generateDebuffList();
  }

  private buffedStat(stat: Stat): number {
    return (
      myBuffedstat(stat) +
      sum(
        this.plan,
        ({ target, type }) =>
          (["uneffect", "shrug"].includes(type) ? -1 : 1) *
          totalModifier(asEffect(target), stat),
      )
    );
  }

  private isValuable(thing: Item | Effect): boolean {
    const effect = asEffect(thing);
    return VALUABLE_MODIFIERS.some(
      (modifier) => getModifier(modifier, effect) > 0,
    );
  }

  private debuffedEnough() {
    return Stat.all().every((stat) => this.buffedStat(stat) <= 100);
  }

  private effectiveDebuffQuantity(
    effect: Effect,
    stat: Stat,
    shrugging: boolean,
  ) {
    return clamp(
      (shrugging ? -1 : 1) *
        (getModifier(stat.toString(), effect) +
          // Eyepatch caps you at 20
          (20 / 100) * getModifier(`${stat.toString()} Percent`, effect)),
      100 - this.buffedStat(stat),
      0,
    );
  }

  private debuffEfficacy(
    item: Item,
    effect: Effect,
    stat: Stat,
    shrugging: boolean,
  ) {
    return (
      (-1 * this.effectiveDebuffQuantity(effect, stat, shrugging)) /
      getAcquirePrice(item)
    );
  }

  private have(effect: Effect): boolean {
    return have(effect)
      ? !this.plan.some(
          ({ type, target }) =>
            ["shrug", "uneffect"].includes(type) && target === effect,
        )
      : this.plan.some(
          ({ type, target }) =>
            type === "potion" && asEffect(target) === effect,
        );
  }

  private getDebuffItems(stat: Stat) {
    return (this.possibleDebuffItems[stat.toString()] ??= Item.all()
      .map((item) => ({ item, effect: asEffect(item) }))
      .filter(
        ({ item, effect }) =>
          item.potion &&
          (item.tradeable || have(item)) &&
          !this.itemBanList.includes(item) &&
          !improvesAStat(item) &&
          effect !== $effect.none &&
          !have(effect) &&
          totalModifier(effect, stat) < 0,
      )).filter(({ effect }) => !this.have(effect));
  }
  private getBestDebuffItem(stat: Stat): Item | Effect {
    const debuffItems = this.getDebuffItems(stat);
    if (!debuffItems.length) {
      this.printPlan();
      abort(`Failed to find a debuff item for ${stat}!`);
    }
    const bestPotion = maxBy(debuffItems, ({ item, effect }) =>
      this.debuffEfficacy(item, effect, stat, false),
    );

    const effectsToShrug = getActiveEffects().filter(
      (ef) => !isShruggable(ef) && this.shouldRemove(ef),
    );

    if (!effectsToShrug.length) return bestPotion.item;

    const bestEffectToShrug = maxBy(
      effectsToShrug,
      (ef) => this.effectiveDebuffQuantity(ef, stat, true),
      true,
    );
    return this.effectiveDebuffQuantity(bestEffectToShrug, stat, true) /
      getAcquirePrice($item`soft green echo eyedrop antidote`) >
      this.effectiveDebuffQuantity(bestPotion.effect, stat, false) /
        getAcquirePrice(bestPotion.item)
      ? bestEffectToShrug
      : bestPotion.item;
  }

  private shouldRemove(effect: Effect) {
    if (!this.have(effect)) return false;
    // Only shrug effects that buff at least one stat that's too high
    if (!improvedStats(effect).some((stat) => this.buffedStat(stat) >= 100)) {
      return false;
    }
    // Never shrug effects that give meat or whatever
    if (this.isValuable(effect)) return false;
    return true;
  }

  // Just checking for the gummi effects for now, maybe can check other stuff later?
  generateDebuffList(): void {
    ignoreBeatenUp();
    if (this.debuffedEnough()) return;

    // Decorative fountain is both cheap and reusable for -30% muscle, but is not a potion
    if (
      this.buffedStat($stat`Muscle`) > 100 &&
      !have($effect`Sleepy`) &&
      (have($item`decorative fountain`) ||
        getAcquirePrice($item`decorative fountain`) < 500)
    ) {
      acquire(1, $item`decorative fountain`, 500);
      use($item`decorative fountain`);
    }

    for (const effect of getActiveEffects()) {
      if (!isShruggable(effect)) continue;
      if (!this.shouldRemove(effect)) continue;

      this.plan.push({
        type: "shrug",
        target: effect,
      });

      if (this.debuffedEnough()) return;
    }

    let debuffItemLoops = 0;
    while (!this.debuffedEnough()) {
      if (debuffItemLoops > this.sizeCap) {
        this.printPlan();
        abort("Spent too long trying to debuff for PirateRealm!");
      }

      debuffItemLoops++;
      for (const stat of Stat.all()) {
        if (this.buffedStat(stat) > 100) {
          const debuff = this.getBestDebuffItem(stat);
          if (debuff instanceof Item) {
            this.plan.push({
              type: "potion",
              target: debuff,
            });
          } else {
            this.plan.push({
              type: "uneffect",
              target: debuff,
            });
          }
        }
      }
    }

    if (!this.debuffedEnough()) {
      this.printPlan();
      abort("Failed to generate debuff list!");
    }
  }

  private executeDebuff({ type, target }: DebuffPlanElement) {
    switch (type) {
      case "potion":
        retrieveItem(target);
        return use(target);
      case "shrug":
      case "uneffect":
        return uneffect(target);
    }
  }

  printPlan(colour = "green") {
    print("Debuff plan:", colour);
    for (const { target, type } of this.plan) {
      switch (type) {
        case "uneffect":
          print(
            ` - Remove ${target} with a soft green echo eyedrop antidote`,
            colour,
          );
          continue;
        case "potion":
          print(` - Use a ${target} to get ${asEffect(target)}`, colour);
          continue;
        case "shrug":
          print(` - Shrug ${target}`, colour);
          continue;
      }
    }
  }

  checkAndFixOvercapStats() {
    if (this.price() >= this.priceCap) {
      print("Failed to debuff enough to use piraterealm!", "red");
      this.printPlan();
      abort(
        "Total price of this debuff plan too great! Consider targeting something other than cockroaches next time.",
      );
    }
    for (const debuff of this.plan) this.executeDebuff(debuff);
    if (Stat.all().some((stat) => myBuffedstat(stat) > 100)) {
      abort("Failed to debuff sufficiently for piraterealm!");
    }
  }

  price(): number {
    return sum(this.plan, ({ type, target }) => {
      switch (type) {
        case "potion":
          return getAcquirePrice(target);
        case "shrug":
          return 0;
        case "uneffect":
          return getAcquirePrice($item`soft green echo eyedrop antidote`);
      }
    });
  }

  static checkAndFixOvercapStats(): void {
    return new DebuffPlanner().checkAndFixOvercapStats();
  }
}

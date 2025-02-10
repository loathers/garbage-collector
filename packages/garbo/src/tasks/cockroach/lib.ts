import {
  abort,
  Effect,
  effectModifier,
  isShruggable,
  Item,
  mallPrice,
  myBuffedstat,
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
  get,
  getActiveEffects,
  getModifier,
  have,
  maxBy,
  uneffect,
} from "libram";
import { VALUABLE_MODIFIERS } from "../../potions";
import { garboValue } from "../../garboValue";
import { acquire } from "../../acquire";

function asEffect(thing: Item | Effect): Effect {
  return thing instanceof Effect ? thing : effectModifier(thing, "Effect");
}

function improvesStat(thing: Item | Effect, stat: Stat): boolean {
  const effect = asEffect(thing);
  return ([stat.toString(), `${stat.toString()} Percent`] as const).some(
    (modifier) => getModifier(modifier, effect) > 0,
  );
}

function improvedStats(thing: Item | Effect): Stat[] {
  return Stat.all().filter((stat) => improvesStat(thing, stat));
}
function improvesAStat(thing: Item | Effect): boolean {
  return improvedStats(thing).length > 0;
}

function isValuable(thing: Item | Effect): boolean {
  const effect = asEffect(thing);
  return VALUABLE_MODIFIERS.some(
    (modifier) => getModifier(modifier, effect) > 0,
  );
}

const debuffedEnough = () =>
  Stat.all().every((stat) => myBuffedstat(stat) <= 100);

const effectiveDebuffQuantity = (
  effect: Effect,
  stat: Stat,
  shrugging: boolean,
) =>
  clamp(
    (shrugging ? -1 : 1) *
      (getModifier(stat.toString(), effect) +
        // Eyepatch caps you at 30
        (30 / 100) * getModifier(`${stat.toString()} Percent`, effect)),
    100 - myBuffedstat(stat),
    0,
  );

function debuffEfficacy(
  item: Item,
  effect: Effect,
  stat: Stat,
  shrugging: boolean,
) {
  return (
    (-1 * effectiveDebuffQuantity(effect, stat, shrugging)) / mallPrice(item)
  );
}

const itemBanList = $items`pill cup`;

const possibleDebuffItems: Partial<
  Record<StatType, { item: Item; effect: Effect }[]>
> = {};
const getDebuffItems = (stat: Stat) =>
  (possibleDebuffItems[stat.toString()] ??= Item.all()
    .filter(
      (i) =>
        i.potion &&
        (i.tradeable || have(i)) &&
        !itemBanList.includes(i) &&
        !improvesAStat(i),
    )
    .map((item) => ({ item, effect: asEffect(item) }))
    .filter(
      ({ effect }) =>
        effect !== $effect.none &&
        !have(effect) &&
        ([stat.toString(), `${stat.toString()} Percent`] as const).some(
          (mod) => getModifier(mod, effect) < 0,
        ),
    )).filter(({ effect }) => !have(effect));

function getBestDebuffItem(stat: Stat): Item | Effect {
  const bestPotion = maxBy(getDebuffItems(stat), ({ item, effect }) =>
    debuffEfficacy(item, effect, stat, false),
  );

  const effectsToShrug = getActiveEffects().filter(
    (ef) => !isShruggable(ef) && shouldRemove(ef),
  );

  if (!effectsToShrug.length) return bestPotion.item;

  const bestEffectToShrug = maxBy(
    effectsToShrug,
    (ef) => effectiveDebuffQuantity(ef, stat, true),
    true,
  );
  return effectiveDebuffQuantity(bestEffectToShrug, stat, true) /
    mallPrice($item`soft green echo eyedrop antidote`) >
    effectiveDebuffQuantity(bestPotion.effect, stat, false) /
      mallPrice(bestPotion.item)
    ? bestEffectToShrug
    : bestPotion.item;
}

function shouldRemove(effect: Effect) {
  // Only shrug effects that buff at least one stat that's too high
  if (!improvedStats(effect).some((stat) => myBuffedstat(stat) >= 100)) {
    return false;
  }
  // Never shrug effects that give meat or whatever
  if (isValuable(effect)) return false;
  return true;
}

// Just checking for the gummi effects for now, maybe can check other stuff later?
export function checkAndFixOvercapStats(): void {
  if (debuffedEnough()) return;

  // Decorative fountain is both cheap and reusable for -30% muscle, but is not a potion
  if (
    myBuffedstat($stat`Muscle`) > 100 &&
    !have($effect`Sleepy`) &&
    (have($item`decorative fountain`) ||
      mallPrice($item`decorative fountain`) < 500)
  ) {
    acquire(1, $item`decorative fountain`, 500);
    use($item`decorative fountain`);
  }

  for (const effect of getActiveEffects()) {
    if (!isShruggable(effect)) continue;
    if (!shouldRemove(effect)) continue;

    uneffect(effect);

    if (debuffedEnough()) return;
  }

  let debuffItemLoops = 0;
  while (!debuffedEnough()) {
    if (debuffItemLoops > 27) {
      abort("Spent too long trying to debuff for PirateRealm!");
    }

    debuffItemLoops++;
    for (const stat of Stat.all()) {
      if (myBuffedstat(stat) > 100) {
        const debuff = getBestDebuffItem(stat);
        if (debuff instanceof Item) {
          retrieveItem(debuff);
          use(debuff);
        } else {
          uneffect(debuff);
        }
      }
    }
  }

  if (!debuffedEnough()) {
    abort(
      "Buffed stats are too high for PirateRealm! Check for equipment or buffs that we can add to prevent in the script",
    );
  }
}

export function dessertIslandWorthIt(): boolean {
  // estimating value of giant crab at 3*VOA
  return garboValue($item`cocoa of youth`) > 3 * get("valueOfAdventure");
}

function crewRoleValue(crewmate: string): number {
  // Cuisinier is highest value if cocoa of youth is more meat than expected from giant crab
  if (dessertIslandWorthIt() && crewmate.includes("Cuisinier")) {
    return 50;
  }
  // Coxswain helps save turns if we run from storms
  if (crewmate.includes("Coxswain")) return 40;
  // Harquebusier gives us extra fun from combats
  if (crewmate.includes("Harquebusier")) return 30;
  // Crypto, Cuisinier (if cocoa not worth it), and Mixologist have small bonuses we care about less
  return 0;
}

function crewAdjectiveValue(crewmate: string): number {
  // Wide-Eyed give us bonus fun when counting birds in smooth sailing, and we'll mostly be doing that rather than spending limited grub/grog
  if (crewmate.includes("Wide-Eyed")) return 5;
  // Gluttonous can help when running out of grub, even though we usually shouldn't?
  if (crewmate.includes("Gluttonous")) return 4;
  // Beligerent, Dipsomaniacal, and Pinch-Fisted don't make much difference
  return 0;
}

export function bestCrewmate(): 1 | 2 | 3 {
  return maxBy([1, 2, 3], (choiceOption) => {
    const crewmatePref = `_pirateRealmCrewmate${choiceOption}`;
    const crewmate = get(crewmatePref);
    const roleValue = crewRoleValue(crewmate);
    const adjectiveValue = crewAdjectiveValue(crewmate);
    return roleValue + adjectiveValue;
  });
}

export function outfitBonuses() {
  const funPointValue = garboValue($item`PirateRealm guest pass`) / 600;
  return new Map([
    [
      $item`carnivorous potted plant`,
      get("valueOfAdventure") / (20 + get("_carnivorousPottedPlantWins")),
    ],
    [$item`Red Roger's red left foot`, funPointValue],
    [$item`PirateRealm party hat`, funPointValue],
  ]);
}

import { closetAmount, Item, itemAmount, storageAmount } from "kolmafia";
import { $item, $items } from "libram";

// SoCP drop list updated 5 November 2026

enum PriceTier {
  One = (2500 + 3000) / 2,
  Two = (1501 + 2500) / 2,
  Three = (501 + 1500) / 2,
  Four = (101 + 500) / 2,
  Five = (10 + 100) / 2,
}

const dailySpecials = new Map<PriceTier, Item[]>([
  [
    PriceTier.Five,
    $items`Crimbo salad, aspirin, bark rootbeer, bottle of bubbles, bubble-wrap simulator, drive-thru burger, elven moonshine, industrially-crushed ice, laser-broiled pear, paperclip, steamed oyster, stuffed doppelshifter, stuffed gray blob`,
  ],
  [
    PriceTier.Four,
    $items`"caramel" orange, BittyCar HotCar, Crimbeau de toilette, Crimbo Factory surprise box, Crimboysters Rockefeller, Elf Guard safety bear, Uncle Greenspan's Bathroom Finance Guide, battered Crimbo Crate, bottle of Crimbognac, cheap elven gloves, cloning kit, clovermint, cyborg stompin' boot, elven socks, iron chain, penguin thesaurus, peppermint-scented socks, pine cone, reindeer hammer, stuffed kraken`,
  ],
  [
    PriceTier.Three,
    $items`C.B.F.G., ChibiBuddy™ (off), Crimbuccaneer premium booty sack, Crimbuccaneer squirtblunderbuss, Elf Guard honor present, Elf Guard squirtgun, Fuzzby, Satan hat, antique nutcracker beard, antique nutcracker boots, antique nutcracker cape, antique nutcracker drumstick, antique nutcracker epaulets, antique nutcracker hat, antique nutcracker pants, antique nutcracker sword, antique nutcracker waistcoat, augmented-reality shades, biomechanical crimborg helmet, biomechanical crimborg leg armor, candy egg deviler, cheerful Crimbo sweater, cheerful pajama pants, crystal belt buckle, depleted Crimbonium football helmet, dusty Crimbo crate, electronic dulcimer pants, elven tambourine, fitness wristband, golden fleece, lucky napkin, miniature goose mask, nylon Christmas stockings, portable steam unit, roboduck-on-a-string, saffron antaravasaka, snow belly, snow hat, snow pants, sucker hakama, sucker kabuto, sucker tachi, tinsel orb`,
  ],
  [
    PriceTier.Two,
    $items`A Crimbo Carol\, Ch. 1, A Crimbo Carol\, Ch. 2, A Crimbo Carol\, Ch. 3, A Crimbo Carol\, Ch. 4, A Crimbo Carol\, Ch. 5, A Crimbo Carol\, Ch. 6, CRIMBCO Employee Handbook (chapter 1), CRIMBCO Employee Handbook (chapter 2), CRIMBCO Employee Handbook (chapter 3), CRIMBCO Employee Handbook (chapter 4), CRIMBCO Employee Handbook (chapter 5), Hanukkimbo dreidl, Jackass Plumber home game, Lil' Snowball Factory, Mini-Crimbot crate, The Big Book of Communism, Trivial Avocations board game, barrel-aged eggnog, deactivated mini-Trainbot, deluxe fax machine, festive egg sac, pet anchor, pet bad vibe, portable photocopier, robotronic egg, sturdy Crimbo crate, warehouse key, yule pup`,
  ],
  [
    PriceTier.One,
    $items`Carol of the Bulls, Carol of the Hells, Carol of the Thrills, Crimbot ROM: Mathematical Precision, Crimbot ROM: Rapid Prototyping, Crimbot ROM: Ruthless Efficiency, Rethinking Candy, The Journal of Mime Science Vol. 1, The Journal of Mime Science Vol. 2, The Journal of Mime Science Vol. 3, The Journal of Mime Science Vol. 4, The Journal of Mime Science Vol. 5, The Journal of Mime Science Vol. 6, Tickle-Me Emilio, tiny plastic sword, warbear requisition box`,
  ],
]);

/**
 * Value the next knucklebone after reserving enough for two of each better
 * daily special. Prices are evaluated lazily and cached; current bone balance
 * is read on each call.
 * This models one rotation of the special pool, without forecasting future drops.
 *
 * @param value Value function for a tradeable reward.
 * @returns A knucklebone valuation function, with an optional arg for available bones.
 */
export function makeKnuckleboneValue(
  value: (item: Item) => number,
): (bones?: number) => number {
  let rewards: { cost: number; meatPerBone: number }[] | undefined;

  return (
    bones = itemAmount($item`knucklebone`) +
      closetAmount($item`knucklebone`) +
      storageAmount($item`knucklebone`),
  ) => {
    rewards ??= [...dailySpecials.entries()]
      .flatMap(([cost, items]) =>
        items
          .filter((item) => item.tradeable)
          .map((item) => ({ cost, meatPerBone: value(item) / cost })),
      )
      .filter(({ meatPerBone }) => meatPerBone > 0)
      .sort((a, b) => b.meatPerBone - a.meatPerBone);

    for (const { cost, meatPerBone } of rewards) {
      if (bones < 2 * cost) return meatPerBone;
      bones -= 2 * cost;
    }
    return 0;
  };
}

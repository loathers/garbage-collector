import "core-js/modules/es.object.from-entries";
import {
  adv1,
  canAdventure,
  canEquip,
  cliExecute,
  Effect,
  effectModifier,
  equip,
  getMonsters,
  historicalAge,
  historicalPrice,
  inebrietyLimit,
  Item,
  itemAmount,
  itemDropsArray,
  itemType,
  Location,
  mallPrice,
  monkeyPaw,
  myInebriety,
  myTurncount,
  numericModifier,
  print,
  setLocation,
  use,
} from "kolmafia";
import {
  $effect,
  $effects,
  $item,
  $items,
  $location,
  $slot,
  ClosedCircuitPayphone,
  CursedMonkeyPaw,
  get,
  getActiveEffects,
  getActiveSongs,
  have,
  isSong,
  maxBy,
  Mood,
  sum,
  sumNumbers,
  withChoice,
} from "libram";
import { acquire } from "./acquire";
import {
  baseMeat,
  bestShadowRift,
  HIGHLIGHT,
  pillkeeperOpportunityCost,
  withLocation,
} from "./lib";
import { embezzlerCount } from "./counts/embezzler";
import { failedWishes, Potion } from "./potions/potion";
import { VariableMeatPotion } from "./potions/variableMeatPotion";
import { globalOptions } from "./config";

const banned = $items`Uncle Greenspan's Bathroom Finance Guide`;

const mutuallyExclusiveList: Effect[][] = [
  $effects`Blue Tongue, Green Tongue, Orange Tongue, Purple Tongue, Red Tongue, Black Tongue`,
  $effects`Cupcake of Choice, The Cupcake of Wrath, Shiny Happy Cupcake, Your Cupcake Senses Are Tingling, Tiny Bubbles in the Cupcake`,
  $effects`Broken Heart, Fiery Heart, Cold Hearted, Sweet Heart, Withered Heart, Lustful Heart`,
  $effects`Coldform, Hotform, Sleazeform, Spookyform, Stenchform`,
];
export const mutuallyExclusive = new Map<Effect, Effect[]>();
for (const effectGroup of mutuallyExclusiveList) {
  for (const effect of effectGroup) {
    mutuallyExclusive.set(effect, [
      ...(mutuallyExclusive.get(effect) ?? []),
      ...effectGroup.filter((other) => other !== effect),
    ]);
  }
}

const INVALID_CHARS_REGEX = /[.',]/g;

const wishableEffects = Effect.all().filter((e) => !e.attributes.includes("nohookah"));
const wishableEffectData = wishableEffects.map((e) => {
  const name = e.name.toLowerCase();
  const splitName = name.split(INVALID_CHARS_REGEX);
  return { e, name, splitName };
});

const invalidWishStrings = wishableEffectData
  .filter(({ name }) => name.match(INVALID_CHARS_REGEX))
  .filter(({ name, splitName }) =>
    splitName.every((s) =>
      wishableEffectData.some((n) => n.name !== name && n.splitName.some((x) => x.includes(s))),
    ),
  )
  .map(({ name }) => name);

const availableItems = [
  ...new Set(
    Location.all()
      .filter((l) => canAdventure(l))
      .map((l) =>
        getMonsters(l)
          .filter((m) => m.copyable)
          .map((m) => itemDropsArray(m).filter(({ rate }) => rate > 1))
          .flat(),
      )
      .flat()
      .map(({ drop }) => drop),
  ),
].map((i) => i.name);

const validPawWishes: Map<Effect, string> = new Map(
  wishableEffectData
    .filter(
      ({ e, name }) =>
        !invalidWishStrings.includes(name) &&
        (globalOptions.prefs.yachtzeechain ? e !== $effect`Eau d' Clochard` : true), // hardcoded heuristics
    )
    .map(({ e, name, splitName }) => {
      if (!name.match(INVALID_CHARS_REGEX)) return [e, name];

      return [
        e,
        splitName.filter(
          (s) =>
            !availableItems.includes(s) &&
            !wishableEffectData.some(
              (n) => n.name !== name && n.splitName.some((x) => x.includes(s)),
            ),
        )[0],
      ];
    }),
);

function useAsValuable(potion: Potion, embezzlers: number, embezzlersOnly: boolean): number {
  const value = potion.value(embezzlers);
  const price = potion.price(false);
  const amountsAcquired = value.map((value) =>
    (!embezzlersOnly || value.name === "embezzler") && value.value - price > 0
      ? potion.acquire(value.quantity, potion.potion, value.value, false, undefined, true)
      : 0,
  );

  const total = sumNumbers(amountsAcquired);
  if (total > 0) {
    const effect = potion.effect();
    if (isSong(effect) && !have(effect)) {
      for (const song of getActiveSongs()) {
        const slot = Mood.defaultOptions.songSlots.find((slot) => slot.includes(song));
        if (!slot || slot.includes(effect)) {
          cliExecute(`shrug ${song}`);
        }
      }
    }
    print(`Using ${total} ${potion.potion.plural}`);
    potion.use(total);
  }
  return total;
}

export const rufusPotion = new Potion($item`closed-circuit pay phone`, {
  providesDoubleDuration: false,
  canDouble: false,
  effect: $effect`Shadow Waters`,
  duration: 30,
  price: (historical: boolean) => {
    if (!have($item`closed-circuit pay phone`)) return Infinity;

    const target = ClosedCircuitPayphone.rufusTarget();
    const haveItemQuest = get("rufusQuestType") === "items" && target instanceof Item;
    const haveArtifact =
      get("rufusQuestType") === "artifact" && target instanceof Item && have(target);

    // We will only buff up if we can complete the item quest
    if (!(!target || haveItemQuest || haveArtifact || have($item`Rufus's shadow lodestone`))) {
      return Infinity;
    }

    // If we are overdrunk, we will need to be able to grab the NC (with a wineglass)
    if (
      myInebriety() > inebrietyLimit() &&
      (!have($item`Drunkula's wineglass`) || !canEquip($item`Drunkula's wineglass`))
    ) {
      return Infinity;
    }

    // We consider the average price of the shadow items to not get gated behind an expensive one
    const shadowItems = $items`shadow brick, shadow ice, shadow sinew, shadow glass, shadow stick, shadow skin, shadow flame, shadow fluid, shadow sausage, shadow bread, shadow venom, shadow nectar`;
    const averagePrice =
      sum(shadowItems, (it) =>
        historical && historicalAge(it) < 14 ? historicalPrice(it) : mallPrice(it),
      ) / shadowItems.length;

    return 3 * averagePrice;
  },
  acquire: (qty: number) => {
    if (myInebriety() > inebrietyLimit()) {
      equip($slot`weapon`, $item.none);
      equip($slot`off-hand`, $item`Drunkula's wineglass`);
    }
    for (let iteration = 0; iteration < qty; iteration++) {
      // Grab a lodestone if we don't have one
      if (!have($item`Rufus's shadow lodestone`)) {
        // If we currently have no quest, acquire one
        ClosedCircuitPayphone.chooseQuest(() => 3);

        // If we need to acquire items, do so; then complete the quest
        const target = ClosedCircuitPayphone.rufusTarget() as Item;
        if (get("rufusQuestType") === "items") {
          if (acquire(3, target, 2 * mallPrice(target), false, 100000)) {
            withChoice(1498, 1, () => use($item`closed-circuit pay phone`));
          } else break;
        } else if (get("rufusQuestType") === "artifact") {
          if (have(target)) withChoice(1498, 1, () => use($item`closed-circuit pay phone`));
          else break;
        }
      }

      // Grab the buff from the NC
      const curTurncount = myTurncount();
      if (have($item`Rufus's shadow lodestone`)) {
        withChoice(1500, 2, () => adv1(bestShadowRift(), -1, ""));
      }
      if (myTurncount() > curTurncount) {
        throw new Error("Failed to acquire Shadow Waters and spent a turn!");
      }
    }
    setLocation($location.none); // Reset location to not affect mafia's item drop calculations
    return 0;
  },
  use: () => {
    return false;
  },
});

export const wishPotions = wishableEffects.map(
  (effect) =>
    new Potion($item`pocket wish`, {
      effect,
      canDouble: false,
      duration: 20,
      use: (quantity: number) => {
        for (let i = 0; i < quantity; i++) {
          const madeValidWish = cliExecute(`genie effect ${effect}`);
          if (!madeValidWish) return false;
        }
        return true;
      },
    }),
);

export const pawPotions = Array.from(validPawWishes.keys())
  .filter((effect) => numericModifier(effect, "Meat Drop") >= 100)
  .map(
    (effect) =>
      new Potion($item`cursed monkey's paw`, {
        effect,
        canDouble: false,
        price: () =>
          !CursedMonkeyPaw.have() || CursedMonkeyPaw.wishes() === 0 || failedWishes.includes(effect)
            ? 2 ** 100 // Something large but non-infinite for sorting reasons
            : 0,
        duration: 30,
        acquire: () => (CursedMonkeyPaw.wishes() ? 1 : 0),
        use: () => {
          if (
            !CursedMonkeyPaw.have() ||
            CursedMonkeyPaw.wishes() === 0 ||
            failedWishes.includes(effect)
          ) {
            return false;
          }

          if (!CursedMonkeyPaw.isWishable(effect)) return false;

          if (!monkeyPaw(effect)) {
            failedWishes.push(effect);
            return false;
          }
          return true;
        },
      }),
  );

export const farmingPotions = [
  ...Item.all()
    .filter((item) => item.tradeable && !banned.includes(item) && itemType(item) === "potion")
    .map((item) => new Potion(item))
    .filter((potion) => potion.bonusMeat() > 0),
  ...wishPotions,
  new Potion($item`papier-mâché toothpicks`),
  ...(have($item`closed-circuit pay phone`) ? [rufusPotion] : []),
];

export function doublingPotions(embezzlers: number): Potion[] {
  return farmingPotions
    .filter((potion) => potion.doubleDuration().gross(embezzlers) / potion.price(true) > 0.5)
    .map((potion) => {
      return { potion: potion, value: potion.doublingValue(embezzlers) };
    })
    .sort((a, b) => b.value - a.value)
    .map((pair) => pair.potion);
}

export function usePawWishes(singleUseValuation: (potion: Potion) => number): void {
  while (CursedMonkeyPaw.wishes() > 0) {
    // Sort the paw potions by the profits of a single wish, then use the best one
    const madeValidWish = pawPotions
      .sort((a, b) => singleUseValuation(b) - singleUseValuation(a))
      .some((potion) => potion.use(1));
    if (!madeValidWish) return;
  }
}

let completedPotionSetup = false;
export function potionSetupCompleted(): boolean {
  return completedPotionSetup;
}
/**
 * Determines if potions are worth using by comparing against meat-equilibrium. Considers using pillkeeper to double them. Accounts for non-wanderer embezzlers. Does not account for PYEC/LTC, or running out of turns with the ascend flag.
 * @param embezzlersOnly Are we valuing the potions only for embezzlers (noBarf)?
 */
export function potionSetup(embezzlersOnly: boolean): void {
  // TODO: Count PYEC.
  // TODO: Count free fights (25 meat each for most).
  withLocation($location.none, () => {
    const embezzlers = embezzlerCount();

    if (have($item`Eight Days a Week Pill Keeper`) && !get("_freePillKeeperUsed")) {
      const possibleDoublingPotions = doublingPotions(embezzlers);
      const bestPotion =
        possibleDoublingPotions.length > 0 ? possibleDoublingPotions[0] : undefined;
      if (bestPotion && bestPotion.doubleDuration().net(embezzlers) > pillkeeperOpportunityCost()) {
        print(`Determined that ${bestPotion.potion} was the best potion to double`, HIGHLIGHT);
        cliExecute("pillkeeper extend");
        bestPotion.acquire(1, bestPotion.potion, bestPotion.doubleDuration().gross(embezzlers));
        bestPotion.use(1);
      }
    }

    // Only test potions which are reasonably close to being profitable using historical price.
    const testPotions = farmingPotions.filter(
      (potion) => potion.gross(embezzlers) / potion.price(true) > 0.5,
    );
    const nonWishTestPotions = testPotions.filter((potion) => potion.potion !== $item`pocket wish`);
    nonWishTestPotions.sort((a, b) => b.net(embezzlers) - a.net(embezzlers));

    const excludedEffects = new Set<Effect>();
    for (const effect of getActiveEffects()) {
      for (const excluded of mutuallyExclusive.get(effect) ?? []) {
        excludedEffects.add(excluded);
      }
    }

    for (const potion of nonWishTestPotions) {
      const effect = potion.effect();
      if (!excludedEffects.has(effect) && useAsValuable(potion, embezzlers, embezzlersOnly) > 0) {
        for (const excluded of mutuallyExclusive.get(effect) ?? []) {
          excludedEffects.add(excluded);
        }
      }
    }

    usePawWishes((potion) => {
      const value = potion.value(embezzlers);
      return value.length > 0
        ? maxBy(value, ({ quantity, value }) => (quantity > 0 ? value : 0)).value
        : 0;
    });

    const wishTestPotions = testPotions.filter((potion) => potion.potion === $item`pocket wish`);
    wishTestPotions.sort((a, b) => b.net(embezzlers) - a.net(embezzlers));

    for (const potion of wishTestPotions) {
      const effect = potion.effect();
      if (
        !excludedEffects.has(effect) &&
        !failedWishes.includes(effect) &&
        useAsValuable(potion, embezzlers, embezzlersOnly) > 0
      ) {
        for (const excluded of mutuallyExclusive.get(effect) ?? []) {
          excludedEffects.add(excluded);
        }
      }
    }

    variableMeatPotionsSetup(0, embezzlers);
    completedPotionSetup = true;
  });
}

/**
 * Uses a Greenspan iff profitable; does not account for PYEC/LTC, or running out of adventures with the ascend flag.
 * @param embezzlers Do we want to account for embezzlers when calculating the value of bathroom finance?
 */
export function bathroomFinance(embezzlers: number): void {
  if (have($effect`Buy!  Sell!  Buy!  Sell!`)) return;

  // Average meat % for embezzlers is sum of arithmetic series, 2 * sum(1 -> embezzlers)
  const averageEmbezzlerGross = ((baseMeat + 750) * 2 * (embezzlers + 1)) / 2 / 100;
  const embezzlerGross = averageEmbezzlerGross * embezzlers;
  const tourists = 100 - embezzlers;

  // Average meat % for tourists is sum of arithmetic series, 2 * sum(embezzlers + 1 -> 100)
  const averageTouristGross = (baseMeat * 2 * (100 + embezzlers + 1)) / 2 / 100;
  const touristGross = averageTouristGross * tourists;

  const greenspan = $item`Uncle Greenspan's Bathroom Finance Guide`;
  if (touristGross + embezzlerGross > mallPrice(greenspan)) {
    acquire(1, greenspan, touristGross + embezzlerGross, false);
    if (itemAmount(greenspan) > 0) {
      print(`Using ${greenspan}!`, HIGHLIGHT);
      use(greenspan);
    }
  }
}

export function variableMeatPotionsSetup(yachtzees: number, embezzlers: number): void {
  const potions = [
    new VariableMeatPotion($item`love song of sugary cuteness`, 20, 2),
    new VariableMeatPotion($item`pulled yellow taffy`, 50, 2),
    ...(globalOptions.prefs.candydish
      ? [new VariableMeatPotion($item`porcelain candy dish`, 500, 1)]
      : []),
  ];

  const excludedEffects = new Set<Effect>();
  for (const effect of getActiveEffects()) {
    for (const excluded of mutuallyExclusive.get(effect) ?? []) {
      excludedEffects.add(excluded);
    }
  }

  for (const potion of potions) {
    const effect = effectModifier(potion.potion, "Effect");
    const n = excludedEffects.has(effect) ? 0 : potion.getOptimalNumberToUse(yachtzees, embezzlers);
    if (n > 0) {
      potion.use(n);
      for (const excluded of mutuallyExclusive.get(effect) ?? []) {
        excludedEffects.add(excluded);
      }
    }
  }
}

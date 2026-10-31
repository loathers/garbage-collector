import {
  fullnessLimit,
  inebrietyLimit,
  Item,
  itemType,
  mallPrice,
  myFullness,
  myInebriety,
  myLevel,
  print,
} from "kolmafia";
import {
  $item,
  $items,
  Diet,
  getRemainingLiver,
  maxBy,
  MenuItem,
} from "libram";
import { priceCaps } from "../acquire";
import { HIGHLIGHT } from "../lib";
import { estimatedGarboTurns, highMeatMonsterCount } from "../turns";
import {
  frostyMug,
  Mayo,
  MPA,
  Note,
  Organ,
  saladFork,
  spleenCleaners,
  stomachLiverCleaners,
} from "./lib";
import { countCopies, menu, potionMenu } from "./menu";

function foodCounts(diet: Diet<Note>): Map<Item, number> {
  const counts = new Map<Item, number>();
  for (const { menuItems, quantity } of diet.entries) {
    const food = menuItems[menuItems.length - 1]?.item;
    if (food && itemType(food) === "food") {
      counts.set(food, (counts.get(food) ?? 0) + quantity);
    }
  }
  return counts;
}

function sameCounts(a: Map<Item, number>, b: Map<Item, number>): boolean {
  return (
    a.size === b.size && [...a].every(([item, count]) => b.get(item) === count)
  );
}

interface DietPlanner {
  (menu: MenuItem<Note>[]): Diet<Note>;
}

/**
 * Plan a diet, iteratively re-balancing it to account for potion duration and copytarget fights.
 * Early exits when it reaches a stable state; otherwise does 5 iterations.
 */
function planBalancedDiet(
  baseMenu: MenuItem<Note>[],
  dietPlanner: DietPlanner,
): Diet<Note> {
  const start = Date.now();
  let passes = 0;
  const timedPlanner = (menu: MenuItem<Note>[]) => {
    const passStart = Date.now();
    const diet = dietPlanner(menu);
    passes++;
    print(`Diet pass ${passes} took ${Date.now() - passStart}ms.`);
    return diet;
  };
  const finish = (diet: Diet<Note>) => {
    print(`Diet planned in ${Date.now() - start}ms over ${passes} passes.`);
    return diet;
  };
  const baseTargets = highMeatMonsterCount();
  const baseTurns = estimatedGarboTurns(false);
  let targets = 0;
  const baseDiet = timedPlanner(baseMenu);
  let adventures = baseDiet.expectedAdventures();
  let foods = foodCounts(baseDiet);
  for (let iterations = 5; iterations > 0; iterations--) {
    print(
      `Calculating diet, please wait${".....".slice(0, iterations)}`,
      HIGHLIGHT,
    );
    const balancingDiet = timedPlanner(
      potionMenu(
        baseMenu,
        baseTargets + targets,
        baseTurns + adventures,
        foods,
      ),
    );
    const nextTargets = countCopies(balancingDiet);
    const nextAdventures = balancingDiet.expectedAdventures();
    const nextFoods = foodCounts(balancingDiet);
    if (
      nextTargets === targets &&
      nextAdventures === adventures &&
      sameCounts(nextFoods, foods)
    ) {
      return finish(balancingDiet);
    }
    targets = nextTargets;
    adventures = nextAdventures;
    foods = nextFoods;
  }
  return finish(
    timedPlanner(
      potionMenu(
        baseMenu,
        baseTargets + targets,
        baseTurns + adventures,
        foods,
      ),
    ),
  );
}

/**
 * Items that affect both stomach and liver, as [fullness, inebriety]; negative values clean.
 * These double diet planning time, because the knapsack is run with and without each of them.
 */
const crossOrganItems = new Map<Item, [number, number]>([
  [$item`spice melange`, [-3, -3]],
  [$item`Ultra Mega Sour Ball`, [-3, -3]],
  [$item`The Plumber's mushroom stew`, [3, -1]],
  [$item`The Mad Liquor`, [-1, 3]],
  [$item`Doc Clock's thyme cocktail`, [-2, 4]],
  [$item`Mr. Burnsger`, [4, -2]],
]);

/**
 * An upper bound on the adventures from an item, including all possible bonuses.
 * Used to find items whose best case is still negative, so we can prune them from the menu.
 */
function maxAdventures(menuItem: MenuItem<Note>): number {
  const { adventures, fullness } = menuItem.item;
  if (!adventures) return 0;
  const range = adventures.match(/^(-?\d+)(?:-(-?\d+))?$/);
  if (!range) return Infinity;
  const max = Number(range[2] ?? range[1]);
  // fork/mug, then saucemaven and gar-ish
  let result = Math.floor(max * 1.5) + 5 + 5;
  // refined palate, pinky ring, tuxedo shirt
  result = Math.ceil(Math.floor(result * 1.25) * 1.125) + 2;
  if (menuItem.itemType() === "food") {
    // mayoflex, seasoning, aioli, whet stone
    result += 1 + 1 + fullness + 1;
  }
  return result;
}

/**
 * Prune items that can't possibly be in our planned diet (i.e., items with negative value).
 * Accounts for cross-organ items by assuming that we fill the cleaned space with
 * optimal choices.
 */
function withoutHopelessItems(menu: MenuItem<Note>[]): MenuItem<Note>[] {
  const valueUpperBound = (menuItem: MenuItem<Note>) =>
    maxAdventures(menuItem) * MPA +
    (menuItem.additionalValue ?? 0) -
    menuItem.price();

  const spleenRatio = Math.max(
    0,
    ...menu
      .filter(
        (menuItem) => menuItem.organ === "spleen item" && menuItem.size > 0,
      )
      .map((menuItem) => valueUpperBound(menuItem) / menuItem.size),
  );
  const spleenCleaningValue = (menuItem: MenuItem<Note>) =>
    $items`jar of fermented pickle juice, extra-greasy slider`.includes(
      menuItem.item,
    )
      ? 5 * spleenRatio
      : 0;

  const ratioAndValue = (organ: Organ) => {
    let ratio = 0;
    let value = 0;
    for (const menuItem of menu) {
      if (menuItem.organ !== organ || crossOrganItems.has(menuItem.item)) {
        continue;
      }
      // Negative-size items are planned as "not using them", worth -value
      const itemValue =
        menuItem.size > 0
          ? valueUpperBound(menuItem) + spleenCleaningValue(menuItem)
          : ["food", "booze"].includes(menuItem.itemType())
            ? Infinity
            : menuItem.price() - (menuItem.additionalValue ?? 0);
      if (menuItem.size === 0 || itemValue <= 0) continue;
      ratio = Math.max(ratio, itemValue / Math.abs(menuItem.size));
      value = Math.max(value, itemValue);
    }
    return { ratio, value };
  };
  const food = ratioAndValue("food");
  const booze = ratioAndValue("booze");
  const freedSpaceValue = (size: number, { ratio, value }: typeof food) =>
    size < 0 ? -size * ratio + value : 0;
  // An overfull organ makes the planner's "without" case invalid; don't guess.
  const overfull =
    myFullness() > fullnessLimit() || myInebriety() > inebrietyLimit();

  // Items whose value depends on the rest of the diet, like Refined Palate
  const modifierItems = $items`pocket wish, toasted brie, potion of the field gar`;

  const bestCase = (menuItem: MenuItem<Note>): number => {
    const sizes = crossOrganItems.get(menuItem.item);
    if (sizes) {
      if (overfull) return Infinity;
      const [fullness, inebriety] = sizes;
      return (
        valueUpperBound(menuItem) +
        freedSpaceValue(fullness, food) +
        freedSpaceValue(inebriety, booze)
      );
    }
    if (
      menuItem.organ &&
      menuItem.size > 0 &&
      !modifierItems.includes(menuItem.item)
    ) {
      return valueUpperBound(menuItem) + spleenCleaningValue(menuItem);
    }
    // Helpers, organ expanders, and cleaners are valued by the planner in context
    return Infinity;
  };

  return menu.filter(
    (menuItem) =>
      (menuItem.maximum !== undefined && menuItem.maximum <= 0) ||
      !(bestCase(menuItem) < 0),
  );
}

/**
 * Prune out any unlimited item that is strictly surpassed by another unlimited item.
 * Accounts for forks, mugs, refined palate, etc; doesn't account for proper divisors
 * of the organ-size (e.g., a size-6 item will not be obsoleted by a stronger size-3 item).
 */
function withoutDominatedItems(menu: MenuItem<Note>[]): MenuItem<Note>[] {
  const isCandidate = (menuItem: MenuItem<Note>) =>
    menuItem.maximum === undefined &&
    menuItem.size > 0 &&
    (["food", "booze", "spleen item"] as (Organ | undefined)[]).includes(
      menuItem.organ,
    ) &&
    menuItem.additionalValue === undefined &&
    menuItem.effect === undefined &&
    menuItem.mayo === undefined &&
    menuItem.data === undefined &&
    menuItem.item.levelreq <= myLevel() &&
    !crossOrganItems.has(menuItem.item) &&
    !stomachLiverCleaners.has(menuItem.item) &&
    !spleenCleaners.has(menuItem.item);

  const seasoning = menu.find(
    (menuItem) => menuItem.item === $item`Special Seasoning`,
  );
  const forkMug = (menuItem: MenuItem<Note>) =>
    menuItem.organ === "food"
      ? new MenuItem<Note>(saladFork)
      : menuItem.organ === "booze"
        ? new MenuItem<Note>(frostyMug)
        : undefined;
  // Zero-quantity entries switch on the diet-wide effects without adding adventures
  const palate = new MenuItem<Note>($item`toasted brie`);
  const garish = new MenuItem<Note>($item`potion of the field gar`);
  const scenarios = [false, true].flatMap((useForkMug) =>
    [[], [palate], [garish], [palate, garish]].map((modifiers) => ({
      useForkMug,
      modifiers,
    })),
  );

  const value = (
    menuItem: MenuItem<Note>,
    { useForkMug, modifiers }: (typeof scenarios)[number],
  ): number => {
    const helper = useForkMug ? forkMug(menuItem) : undefined;
    const helperSets = [helper ? [helper] : []];
    if (seasoning && menuItem.organ === "food") {
      helperSets.push([...helperSets[0], seasoning]);
    }
    return Math.max(
      ...helperSets.map((helpers) => {
        const adventures = Diet.from<Note>([
          [[...helpers, menuItem], 1],
          ...modifiers.map((modifier): [MenuItem<Note>[], number] => [
            [modifier],
            0,
          ]),
        ]).expectedAdventures();
        const helperCost = helpers.includes(seasoning as MenuItem<Note>)
          ? (seasoning as MenuItem<Note>).price()
          : 0;
        return adventures * MPA - menuItem.price() - helperCost;
      }),
    );
  };

  const groups = new Map<string, MenuItem<Note>[]>();
  for (const menuItem of menu.filter(isCandidate)) {
    const key = `${menuItem.organ}:${menuItem.size}`;
    groups.set(key, [...(groups.get(key) ?? []), menuItem]);
  }
  const kept = new Set<MenuItem<Note>>();
  for (const group of groups.values()) {
    for (const scenario of scenarios) {
      kept.add(maxBy(group, (menuItem) => value(menuItem, scenario)));
    }
  }

  return menu.filter(
    (menuItem) => !isCandidate(menuItem) || kept.has(menuItem),
  );
}

export function computeDiet(): {
  diet: () => Diet<Note>;
  shotglass: () => Diet<Note>;
  pantsgiving: () => Diet<Note>;
  sweatpants: () => Diet<Note>;
} {
  // Handle spleen manually, as the diet planner doesn't support synth. Only fill food and booze.

  const orEmpty = (diet: Diet<Note>) =>
    diet.expectedValue(MPA, "net") < 0 ? new Diet<Note>() : diet;
  const plan = (
    menu: MenuItem<Note>[],
    organCapacities?: Parameters<typeof Diet.plan>[2],
  ) =>
    orEmpty(
      Diet.plan(
        MPA,
        withoutDominatedItems(withoutHopelessItems(menu)),
        organCapacities,
      ),
    );
  const fullDietPlanner = (menu: MenuItem<Note>[]) => plan(menu);
  const shotglassDietPlanner = (menu: MenuItem<Note>[]) =>
    plan(menu, { booze: 1 });
  const pantsgivingDietPlanner = (menu: MenuItem<Note>[]) =>
    plan(menu, { food: 1 });
  const sweatpantsDietPlanner = (menu: MenuItem<Note>[]) =>
    plan(menu, { booze: getRemainingLiver() });
  // const shotglassFilter = (menuItem: MenuItem)

  return {
    diet: () =>
      planBalancedDiet(
        menu().filter(
          (menuItem) =>
            !priceCaps[menuItem.item.name] ||
            priceCaps[menuItem.item.name] >= mallPrice(menuItem.item),
        ),
        fullDietPlanner,
      ),
    shotglass: () =>
      planBalancedDiet(
        menu().filter(
          (menuItem) =>
            itemType(menuItem.item) === "booze" && menuItem.size === 1,
        ),
        shotglassDietPlanner,
      ),
    pantsgiving: () =>
      planBalancedDiet(
        menu().filter(
          (menuItem) =>
            (itemType(menuItem.item) === "food" && menuItem.size === 1) ||
            [
              Mayo.flex,
              Mayo.zapine,
              $item`Special Seasoning`,
              $item`mini kiwi aioli`,
              $item`whet stone`,
            ].includes(menuItem.item),
        ),
        pantsgivingDietPlanner,
      ),
    sweatpants: () =>
      planBalancedDiet(
        menu().filter(
          (menuItem) =>
            itemType(menuItem.item) === "booze" && menuItem.size <= 3,
        ),
        sweatpantsDietPlanner,
      ),
  };
}

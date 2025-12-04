import { Familiar, getMonsters, holiday, Location, squareRoot } from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  $locations,
  $monster,
  clamp,
  findLeprechaunMultiplier,
  get,
  getModifier,
  have,
  PeridotOfPeril,
  Robortender,
  totalFamiliarWeight,
} from "libram";
import { baseMeat, felizValue, newarkValue } from "../lib";
import { garboAverageValue, garboValue } from "../garboValue";
import { FamiliarMode, GeneralFamiliar } from "./lib";
import { effectExtenderValue } from "../potions";
import { globalOptions } from "../config";
import { canAdventureOrUnlock, unperidotableZones } from "garbo-lib";
import { estimatedGarboTurns } from "../turns";

type ConstantValueFamiliar = {
  familiar: Familiar;
  value: (_mode: FamiliarMode) => number;
  worksOnFreeRun?: boolean;
};

const bestAlternative = getModifier("Meat Drop", $item`amulet coin`);
// Constant Value familiars are those that drop items at a constant rate without limit, compare Rotating Value familiars
const standardFamiliars: ConstantValueFamiliar[] = [
  {
    familiar: $familiar`Obtuse Angel`,
    value: () => 0.02 * garboValue($item`time's arrow`),
  },
  {
    familiar: $familiar`Stocking Mimic`,
    value: (mode) =>
      garboAverageValue(...$items`Polka Pop, BitterSweetTarts, Piddles`) / 6 -
      // We can't equip an amulet coin if we equip the bag of many confections
      (mode === "barf" ? (bestAlternative * baseMeat()) / 100 : 0) +
      (1 / 3 + (have($effect`Jingle Jangle Jingle`) ? 0.1 : 0)) *
        totalFamiliarWeight($familiar`Stocking Mimic`),
  },
  {
    familiar: $familiar`Shorter-Order Cook`,
    value: () =>
      garboAverageValue(
        ...$items`short beer, short stack of pancakes, short stick of butter, short glass of water, short white`,
      ) / 11, // 9 with blue plate
  },
  {
    familiar: $familiar`Robortender`,
    value: (mode) => {
      const olfactedMonster = get("olfactedMonster");
      const olfactedIsFromBarf = olfactedMonster && getMonsters($location`Barf Mountain`).includes(olfactedMonster);
      return Robortender.dropChance() *
        garboValue(
          Robortender.dropFrom(
            (mode === "barf" && olfactedIsFromBarf)
              ? olfactedMonster
              : mode === "target"
                ? globalOptions.target
                : $monster.none,
          ),
        ) +
      (Robortender.currentDrinks().includes($item`Feliz Navidad`)
        ? felizValue() * 0.25
        : 0) +
      (Robortender.currentDrinks().includes($item`Newark`)
        ? newarkValue() * 0.25
        : 0)
      },
  },
  {
    familiar: $familiar`Twitching Space Critter`,

    // Item is ludicrously overvalued and incredibly low-volume.
    // We can remove this cap once the price reaches a lower equilibrium
    // we probably won't, but we can.
    value: () => Math.min(garboValue($item`twitching space egg`) * 0.0002, 690),
  },
  {
    familiar: $familiar`Hobo Monkey`,
    value: () => 75,
  },
  {
    familiar: $familiar`Trick-or-Treating Tot`,
    // This is the value of getting a pirate costume over getting an amulet coin or whatever
    value: (mode) =>
      have($item`li'l pirate costume`) && mode === "barf"
        ? (baseMeat() * (300 - bestAlternative)) / 100
        : 0,
  },
  {
    familiar: $familiar`Cookbookbat`,
    value: (mode) =>
      (3 *
        garboAverageValue(
          ...$items`Vegetable of Jarlsberg, Yeast of Boris, St. Sneaky Pete's Whey`,
        )) /
        11 +
      (mode === "barf" ? cookbookbatPerilBonus() : 0), // We cannot run the turn spending task during our start of day freefights, so cannot guarantee this value
  },
  {
    familiar: $familiar`Unspeakachu`,
    value: () => {
      return effectExtenderValue(5) * 0.5 * 0.05;
    },
  },
  {
    familiar: $familiar`Patriotic Eagle`,
    value: () =>
      holiday().includes("Dependence Day")
        ? 0.05 * garboValue($item`souvenir flag`)
        : 0,
    worksOnFreeRun: true,
  },
  {
    familiar: $familiar`Mini Kiwi`,
    value: (mode) =>
      mode === "barf"
        ? 0 // Handled in outfit caching code
        : clamp(totalFamiliarWeight($familiar`Mini Kiwi`) * 0.005, 0, 1) *
          garboValue($item`mini kiwi`), // faster with aviator goggles
  },
  {
    familiar: $familiar`Quantum Entangler`,
    value: () => garboValue($item`quantized familiar experience`) / 11,
  },
  {
    familiar: $familiar`Peace Turkey`,
    value: () =>
      // drops are ~1/2 of the activations, whirled peas are twice as likely to drop
      (garboAverageValue(
        ...$items`whirled peas, whirled peas, piece of cake, peace shooter`,
      ) *
        peaceTurkeyDropChance()) /
      2,
    worksOnFreeRun: true,
  },
  {
    /* eslint-disable-next-line libram/verify-constants */
    familiar: $familiar`Skeleton of Crimbo Past`,
    value: () => get("_knuckleboneDrops", 0) < 100 ? 50_000 : 0,
  },
];

function peaceTurkeyDropChance(): number {
  return 0.24 + squareRoot(totalFamiliarWeight($familiar`Peace Turkey`)) / 100;
}

export default function getConstantValueFamiliars(
  mode: FamiliarMode,
): GeneralFamiliar[] {
  return standardFamiliars
    .filter(({ familiar }) => have(familiar))
    .map(({ familiar, value, worksOnFreeRun = false }) => ({
      familiar,
      worksOnFreeRun,
      expectedValue: value(mode),
      leprechaunMultiplier: findLeprechaunMultiplier(familiar),
      limit: "none",
    }));
}

const locationsWithMonsters = Location.all().filter(
  (l) => getMonsters(l).length > 0,
);

function cookbookbatPerilBonus(): number {
  if (
    !have($item`Peridot of Peril`) ||
    get("_cookbookbatCombatsUntilNewQuest") + 1 > estimatedGarboTurns()
  ) {
    return 0;
  }
  // canAdventure includes some zones we need to exclude
  const canAdvExclusions = $locations`Fastest Adventurer Contest, Strongest Adventurer Contest, Smartest Adventurer Contest, Smoothest Adventurer Contest, Hottest Adventurer Contest, Coldest Adventurer Contest, Spookiest Adventurer Contest, Stinkiest Adventurer Contest, Sleaziest Adventurer Contest, The Hedge Maze, Tower Level 1, Tower Level 2, Tower Level 3, Tower Level 5, The Naughty Sorceress' Chamber, The Daily Dungeon, An Overgrown Shrine (Northwest), An Overgrown Shrine (Southwest), An Overgrown Shrine (Northeast), An Overgrown Shrine (Southeast), A Crater Full of Space Beasts, Mt. Molehill, The Red Queen's Garden, An Incredibly Strange Place (Bad Trip), An Incredibly Strange Place (Mediocre Trip), An Incredibly Strange Place (Great Trip), The Primordial Soup, The Jungles of Ancient Loathing, Seaside Megalopolis, Domed City of Ronaldus, Domed City of Grimacia, Hamburglaris Shield Generator, The X-32-F Combat Training Snowman, The Haiku Dungeon, The Deep Machine Tunnels, The Oasis, Shadow Rift`;
  const cookbookbatQuestLocations = locationsWithMonsters.filter(
    (l) => canAdventureOrUnlock(l, false) && !canAdvExclusions.includes(l),
  );
  const availablePeridotCookbookbatLocations = cookbookbatQuestLocations.filter(
    (l) => PeridotOfPeril.canImperil(l) && !unperidotableZones.includes(l),
  );
  const doableQuestChance =
    availablePeridotCookbookbatLocations.length /
    cookbookbatQuestLocations.length;
  const averageCookbookbatRewardValue =
    3 *
    garboAverageValue(
      ...$items`Vegetable of Jarlsberg, Yeast of Boris, St. Sneaky Pete's Whey`,
    );

  // It takes 5 turns to get a quest, times the chance we hit a zone we can do with peridot. Assume worst case of spending a turn to complete the quest
  return Math.max(
    0,
    (averageCookbookbatRewardValue * doableQuestChance -
      get("valueOfAdventure")) /
      5,
  );
}

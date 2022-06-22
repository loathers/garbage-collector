import {
  Effect,
  equippedItem,
  Familiar,
  familiarWeight,
  inebrietyLimit,
  Item,
  Location,
  myAdventures,
  myInebriety,
  numericModifier,
  Slot,
  totalTurnsPlayed,
  useFamiliar,
  weightAdjustment,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $familiars,
  $item,
  $items,
  $location,
  $slots,
  findFairyMultiplier,
  findLeprechaunMultiplier,
  get,
  getActiveEffects,
  getModifier,
  have,
  propertyTypes,
  sum,
} from "libram";
import { bonusGear } from "./dropsgear";
import { baseMeat, globalOptions } from "./lib";
import { meatOutfit } from "./outfit";
import { garboAverageValue, garboValue } from "./session";

export function calculateMeatFamiliar(): void {
  const bestLeps = Familiar.all()
    // The commerce ghost canot go underwater in most circumstances, and cannot use an amulet coin
    // We absolutely do not want that
    .filter((fam) => have(fam) && fam !== $familiar`Ghost of Crimbo Commerce`)
    .sort((a, b) => findLeprechaunMultiplier(b) - findLeprechaunMultiplier(a));
  const bestLepMult = findLeprechaunMultiplier(bestLeps[0]);
  _meatFamiliar = bestLeps
    .filter((familiar) => findLeprechaunMultiplier(familiar) === bestLepMult)
    .reduce((a, b) => (findFairyMultiplier(a) > findFairyMultiplier(b) ? a : b));
}

let _meatFamiliar: Familiar;
export function meatFamiliar(): Familiar {
  if (!_meatFamiliar) {
    if (
      myInebriety() > inebrietyLimit() &&
      have($familiar`Trick-or-Treating Tot`) &&
      have($item`li'l pirate costume`)
    ) {
      _meatFamiliar = $familiar`Trick-or-Treating Tot`;
    } else if (have($familiar`Robortender`)) {
      _meatFamiliar = $familiar`Robortender`;
    } else {
      calculateMeatFamiliar();
    }
  }
  return _meatFamiliar;
}

type GeneralFamiliar = {
  familiar: Familiar;
  expectedValue: number;
  leprechaunMultiplier: number;
};

type StandardDropFamiliar = {
  familiar: Familiar;
  expected: number[];
  drop: Item;
  pref: propertyTypes.NumericProperty;
  additionalValue?: number;
};

function valueStandardDropFamiliar({
  familiar,
  expected,
  drop,
  pref,
  additionalValue,
}: StandardDropFamiliar): GeneralFamiliar | null {
  const expectedTurns = expected[get(pref)];
  if (!have(familiar) || !expectedTurns) return null;
  const expectedValue = garboValue(drop) / expectedTurns + (additionalValue ?? 0);
  return { familiar, expectedValue, leprechaunMultiplier: findLeprechaunMultiplier(familiar) };
}

// 5, 10, 15, 20, 25 +5/turn: 5.29, 4.52, 3.91, 3.42, 3.03
const rotatingFamiliars: StandardDropFamiliar[] = [
  {
    familiar: $familiar`Fist Turkey`,
    expected: [3.91, 4.52, 4.52, 5.29, 5.29],
    drop: $item`Ambitious Turkey`,
    pref: "_turkeyBooze",
  },
  {
    familiar: $familiar`Llama Lama`,
    expected: [3.42, 3.91, 4.52, 5.29, 5.29],
    drop: $item`llama lama gong`,
    pref: "_gongDrops",
  },
  {
    familiar: $familiar`Astral Badger`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`astral mushroom`,
    pref: "_astralDrops",
  },
  {
    familiar: $familiar`Li'l Xenomorph`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`transporter transponder`,
    pref: "_transponderDrops",
  },
  {
    familiar: $familiar`Rogue Program`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`Game Grid token`,
    pref: "_tokenDrops",
  },
  {
    familiar: $familiar`Bloovian Groose`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`groose grease`,
    pref: "_grooseDrops",
  },
  {
    familiar: $familiar`Baby Sandworm`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`agua de vida`,
    pref: "_aguaDrops",
  },
  {
    familiar: $familiar`Green Pixie`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`tiny bottle of absinthe`,
    pref: "_absintheDrops",
  },
  {
    familiar: $familiar`Blavious Kloop`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`devilish folio`,
    pref: "_kloopDrops",
  },
  {
    familiar: $familiar`Galloping Grill`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`hot ashes`,
    pref: "_hotAshesDrops",
  },
  {
    familiar: $familiar`Grim Brother`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`grim fairy tale`,
    pref: "_grimFairyTaleDrops",
  },
  {
    familiar: $familiar`Golden Monkey`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`powdered gold`,
    pref: "_powderedGoldDrops",
  },
  {
    familiar: $familiar`Unconscious Collective`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`Unconscious Collective Dream Jar`,
    pref: "_dreamJarDrops",
  },
  {
    familiar: $familiar`Ms. Puck Man`,
    expected: Array($familiar`Ms. Puck Man`.dropsLimit).fill(12.85),
    drop: $item`power pill`,
    pref: "_powerPillDrops",
    additionalValue: garboValue($item`yellow pixel`),
  },
  {
    familiar: $familiar`Puck Man`,
    expected: Array($familiar`Puck Man`.dropsLimit).fill(12.85),
    drop: $item`power pill`,
    pref: "_powerPillDrops",
    additionalValue: garboValue($item`yellow pixel`),
  },
  {
    familiar: $familiar`Adventurous Spelunker`,
    expected: [7.0],
    drop: $item`Tales of Spelunking`,
    pref: "_spelunkingTalesDrops",
  },
  {
    familiar: $familiar`Angry Jung Man`,
    expected: [30.0],
    drop: $item`psychoanalytic jar`,
    pref: "_jungDrops",
  },
  {
    familiar: $familiar`Grimstone Golem`,
    expected: [45.0],
    drop: $item`grimstone mask`,
    pref: "_grimstoneMaskDrops",
  },
];

type ExperienceFamiliar = {
  familiar: Familiar;
  used: propertyTypes.BooleanProperty;
  useValue: number;
  baseExp: number;
};

const experienceFamiliars: ExperienceFamiliar[] = [
  {
    familiar: $familiar`Pocket Professor`,
    used: "_thesisDelivered",
    useValue: 11 * get("valueOfAdventure"),
    baseExp: 200,
  },
  {
    familiar: $familiar`Grey Goose`,
    used: "_meatifyMatterUsed",
    useValue: 15 ** 4,
    baseExp: 25,
  },
];

function valueExperienceFamiliar({
  familiar,
  used,
  useValue,
  baseExp,
}: ExperienceFamiliar): GeneralFamiliar | null {
  if (!have(familiar) || get(used)) return null;
  const currentExp = familiar.experience || (have($familiar`Shorter-Order Cook`) ? 100 : 0);
  const experienceNeeded = 400 - (globalOptions.ascending ? currentExp : baseExp);
  const estimatedExperience = 12;
  return {
    familiar,
    expectedValue: useValue / (experienceNeeded / estimatedExperience),
    leprechaunMultiplier: findLeprechaunMultiplier(familiar),
  };
}

const standardFamiliars: () => GeneralFamiliar[] = () =>
  [
    {
      familiar: $familiar`Obtuse Angel`,
      expectedValue: 0.02 * garboValue($item`time's arrow`),
    },
    {
      familiar: $familiar`Stocking Mimic`,
      expectedValue:
        garboAverageValue(...$items`Polka Pop, BitterSweetTarts, Piddles`) / 6 +
        (1 / 3 + (have($effect`Jingle Jangle Jingle`) ? 0.1 : 0)) *
          (familiarWeight($familiar`Stocking Mimic`) + weightAdjustment()),
    },
    {
      familiar: $familiar`Shorter-Order Cook`,
      expectedValue:
        garboAverageValue(
          ...$items`short beer, short stack of pancakes, short stick of butter, short glass of water, short white`
        ) / 11,
    },
    {
      familiar: $familiar`Robortender`,
      expectedValue: 200,
    },
    ...$familiars`Hobo Monkey, Cat Burglar, Urchin Urchin, Leprechaun`.map((familiar) => ({
      familiar,
      expectedValue: 0,
    })),
    {
      familiar: $familiar`none`,
      expectedValue: 0,
    },
  ].map((x) => ({ ...x, leprechaunMultiplier: findLeprechaunMultiplier(x.familiar) }));

function filterNull<T>(arr: (T | null)[]): T[] {
  return arr.filter((x) => x !== null) as T[];
}

export function freeFightFamiliarData(canMeatify = false): GeneralFamiliar {
  if (canMeatify && timeToMeatify()) {
    return {
      familiar: $familiar`Grey Goose`,
      expectedValue: (familiarWeight($familiar`Grey Goose`) - 5) ** 4,
      leprechaunMultiplier: 0,
    };
  }

  const familiars = [
    ...standardFamiliars(),
    ...filterNull(experienceFamiliars.map(valueExperienceFamiliar)),
    ...filterNull(rotatingFamiliars.map(valueStandardDropFamiliar)),
  ];

  const compareFams = (a: GeneralFamiliar, b: GeneralFamiliar) => {
    if (a.expectedValue === b.expectedValue) {
      return findLeprechaunMultiplier(a.familiar) > findLeprechaunMultiplier(b.familiar);
    }
    return a.expectedValue > b.expectedValue;
  };

  return familiars.reduce((a, b) => (compareFams(a, b) ? a : b));
}

export function freeFightFamiliar(canMeatify = false): Familiar {
  return freeFightFamiliarData(canMeatify).familiar;
}

type MarginalFamiliar = GeneralFamiliar & { outfitValue: number };
const outfitSlots = $slots`hat, back, shirt, weapon, off-hand, pants, acc1, acc2, acc3, familiar`;
const cachedOutfits = new Map<number, { weight: number; meat: number; bonus: number }>();

function cacheOutfit(
  mult: number,
  familiar: Familiar
): { weight: number; meat: number; bonus: number } {
  useFamiliar(familiar);
  meatOutfit(false, undefined, false);
  const outfit = outfitSlots.map((slot) => equippedItem(slot));
  const bonuses = bonusGear("barf");
  const values = {
    weight: sum(outfit, (eq: Item) => getModifier("Familiar Weight", eq)),
    meat: sum(outfit, (eq: Item) => getModifier("Meat Drop", eq)),
    bonus: sum(outfit, (eq: Item) => bonuses.get(eq) ?? 0),
  };
  cachedOutfits.set(mult, values);
  return values;
}

export function setMarginalFamiliar(location: Location) {
  const underwater = location.environment === "underwater";
  const buffWeight = sum(getActiveEffects(), (ef: Effect) => getModifier("Familiar Weight", ef));
  const outfitWeight = sum(outfitSlots, (slot: Slot) =>
    getModifier("Familiar Weight", equippedItem(slot))
  );
  const passiveWeight = weightAdjustment() - buffWeight - outfitWeight;

  const barf = location === $location`Barf Mountain`;
  const dropFamiliars: MarginalFamiliar[] = [
    ...filterNull(rotatingFamiliars.map(valueStandardDropFamiliar)),
    ...standardFamiliars(),
    {
      familiar: $familiar`Space Jellyfish`,
      expectedValue: barf
        ? garboValue($item`stench jelly`) /
          (get("_spaceJellyfishDrops") < 5 ? get("_spaceJellyfishDrops") + 1 : 20)
        : 0,
      leprechaunMultiplier: 0,
    },
  ]
    .filter((f) => !underwater || f.familiar.underwater)
    .map(({ familiar, expectedValue, leprechaunMultiplier }) => {
      const { meat, weight, bonus } =
        cachedOutfits.get(leprechaunMultiplier) ?? cacheOutfit(leprechaunMultiplier, familiar);

      return {
        familiar,
        expectedValue,
        leprechaunMultiplier,
        outfitValue:
          bonus +
          ((meat +
            numericModifier(
              familiar,
              "Meat Drop",
              weight + passiveWeight + familiarWeight(familiar),
              $item`none`
            )) *
            baseMeat) /
            100,
      };
    });
}

export function pocketProfessorLectures(): number {
  return 2 + Math.ceil(Math.sqrt(familiarWeight($familiar`Pocket Professor`) + weightAdjustment()));
}

export function timeToMeatify(): boolean {
  if (
    !have($familiar`Grey Goose`) ||
    get("_meatifyMatterUsed") ||
    myInebriety() > inebrietyLimit()
  ) {
    return false;
  } else if ($familiar`Grey Goose`.experience >= 400) return true;
  else if (!globalOptions.ascending || myAdventures() > 50) return false;

  // Check Wanderers
  const totalTurns = totalTurnsPlayed();
  const baseMeat = have($item`SongBoom™ BoomBox`) ? 275 : 250;
  const usingLatte =
    have($item`latte lovers member's mug`) &&
    get("latteModifier").split(",").includes("Meat Drop: 40");

  const nextProtonicGhost = have($item`protonic accelerator pack`)
    ? Math.max(1, get("nextParanormalActivity") - totalTurns)
    : Infinity;
  const nextVoteMonster =
    have($item`"I Voted!" sticker`) && get("_voteFreeFights") < 3
      ? Math.max(0, ((totalTurns % 11) - 1) % 11)
      : Infinity;
  const nextVoidMonster =
    have($item`cursed magnifying glass`) &&
    get("_voidFreeFights") < 5 &&
    get("valueOfFreeFight", 2000) / 13 > baseMeat * (usingLatte ? 0.75 : 0.6)
      ? -get("cursedMagnifyingGlassCount") % 13
      : Infinity;

  // If any of the above are 0, then
  // (1) We should be fighting a free fight
  // (2) We meatify if Grey Goose is sufficiently heavy and we don't have another free wanderer in our remaining turns

  const freeFightNow =
    get("questPAGhost") !== "unstarted" || nextVoteMonster === 0 || nextVoidMonster === 0;
  const delay = [
    nextProtonicGhost,
    nextVoteMonster === 0 ? (get("_voteFreeFights") < 2 ? 11 : Infinity) : nextVoteMonster,
    nextVoidMonster === 0 ? 13 : nextVoidMonster,
  ].reduce((a, b) => (a < b ? a : b));

  if (delay < myAdventures()) return false;
  // We can wait for the next free fight
  else if (freeFightNow || $familiar`Grey Goose`.experience >= 121) return true;

  return false;
}

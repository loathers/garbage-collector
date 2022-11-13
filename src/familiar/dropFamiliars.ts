import { Familiar, Item } from "kolmafia";
import { $familiar, $item, findLeprechaunMultiplier, have } from "libram";
import { garboValue } from "../session";
import { GeneralFamiliar } from "./lib";

type StandardDropFamiliar = {
  familiar: Familiar;
  expected: number[];
  drop: Item;
  additionalValue?: () => number;
};

function valueStandardDropFamiliar({
  familiar,
  expected,
  drop,
  additionalValue,
}: StandardDropFamiliar): GeneralFamiliar {
  const expectedTurns = expected[familiar.dropsToday] || Infinity;
  const expectedValue = garboValue(drop) / expectedTurns + (additionalValue?.() ?? 0);
  return {
    familiar,
    expectedValue,
    leprechaunMultiplier: findLeprechaunMultiplier(familiar),
    limit: "drops",
  };
}

const rotatingFamiliars: StandardDropFamiliar[] = [
  {
    familiar: $familiar`Fist Turkey`,
    expected: [3.91, 4.52, 4.52, 5.29, 5.29],
    drop: $item`Ambitious Turkey`,
  },
  {
    familiar: $familiar`Llama Lama`,
    expected: [3.42, 3.91, 4.52, 5.29, 5.29],
    drop: $item`llama lama gong`,
  },
  {
    familiar: $familiar`Astral Badger`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`astral mushroom`,
  },
  {
    familiar: $familiar`Li'l Xenomorph`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`transporter transponder`,
  },
  {
    familiar: $familiar`Rogue Program`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`Game Grid token`,
  },
  {
    familiar: $familiar`Bloovian Groose`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`groose grease`,
  },
  {
    familiar: $familiar`Baby Sandworm`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`agua de vida`,
  },
  {
    familiar: $familiar`Green Pixie`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`tiny bottle of absinthe`,
  },
  {
    familiar: $familiar`Blavious Kloop`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`devilish folio`,
  },
  {
    familiar: $familiar`Galloping Grill`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`hot ashes`,
  },
  {
    familiar: $familiar`Grim Brother`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`grim fairy tale`,
  },
  {
    familiar: $familiar`Golden Monkey`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`powdered gold`,
  },
  {
    familiar: $familiar`Unconscious Collective`,
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`Unconscious Collective Dream Jar`,
  },
  {
    familiar: $familiar`Ms. Puck Man`,
    expected: Array($familiar`Ms. Puck Man`.dropsLimit).fill(12.85),
    drop: $item`power pill`,
    additionalValue: () => garboValue($item`yellow pixel`),
  },
  {
    familiar: $familiar`Puck Man`,
    expected: Array($familiar`Puck Man`.dropsLimit).fill(12.85),
    drop: $item`power pill`,
    additionalValue: () => garboValue($item`yellow pixel`),
  },
  {
    familiar: $familiar`Adventurous Spelunker`,
    expected: [7.0],
    drop: $item`Tales of Spelunking`,
  },
  {
    familiar: $familiar`Angry Jung Man`,
    expected: [30.0],
    drop: $item`psychoanalytic jar`,
  },
  {
    familiar: $familiar`Grimstone Golem`,
    expected: [45.0],
    drop: $item`grimstone mask`,
  },
];

export default function getDropFamiliars(): GeneralFamiliar[] {
  return rotatingFamiliars
    .map(valueStandardDropFamiliar)
    .filter(
      ({ familiar, expectedValue, leprechaunMultiplier }) =>
        have(familiar) && (expectedValue || leprechaunMultiplier)
    );
}

export function getAllDrops(fam: Familiar): { expectedValue: number; expectedTurns: number }[] {
  const target = rotatingFamiliars.find(({ familiar }) => familiar === fam);
  if (!have(fam) || !target) return [];

  const current = fam.dropsToday;
  const returnValue = [];

  for (let i = current; i < target.expected.length; i++) {
    const turns = target.expected[i];
    returnValue.push({
      expectedValue: garboValue(target.drop) / turns + (target.additionalValue?.() ?? 0),
      expectedTurns: turns,
    });
  }

  return returnValue;
}

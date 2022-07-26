import { Familiar, inebrietyLimit, Item, myInebriety } from "kolmafia";
import { $familiar, $item, findLeprechaunMultiplier, get, have, propertyTypes } from "libram";
import { garboValue } from "../session";
import { GeneralFamiliar } from "./lib";

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
}: StandardDropFamiliar): GeneralFamiliar {
  const expectedTurns = expected[get(pref)] || Infinity;
  const expectedValue = garboValue(drop) / expectedTurns + (additionalValue ?? 0);
  return {
    familiar,
    expectedValue,
    leprechaunMultiplier: findLeprechaunMultiplier(familiar),
    limit: "drops",
  };
}

const jellyfish: StandardDropFamiliar = {
  familiar: $familiar`Space Jellyfish`,
  expected: [1, 2, 3, 4, 5],
  drop: $item`stench jelly`,
  pref: "_spaceJellyfishDrops",
};

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

export default function getDropFamiliars(purpose: "barf" | "free" = "free"): GeneralFamiliar[] {
  const familiarPool = rotatingFamiliars;
  if (purpose === "barf" && myInebriety() <= inebrietyLimit()) {
    familiarPool.push(jellyfish);
  }
  return familiarPool
    .map(valueStandardDropFamiliar)
    .filter(
      ({ familiar, expectedValue, leprechaunMultiplier }) =>
        have(familiar) && (expectedValue || leprechaunMultiplier)
    );
}

export function getAllDrops(fam: Familiar): { expectedValue: number; expectedTurns: number }[] {
  const target =
    fam === $familiar`Space Jellyfish`
      ? jellyfish
      : rotatingFamiliars.find(({ familiar }) => familiar === fam);
  if (!have(fam) || !target) return [];

  const current = get(target.pref);
  const returnValue = [];

  for (let i = current; i < target.expected.length; i++) {
    const turns = target.expected[i];
    returnValue.push({
      expectedValue: garboValue(target.drop) / turns + (target.additionalValue ?? 0),
      expectedTurns: turns,
    });
  }

  return returnValue;
}

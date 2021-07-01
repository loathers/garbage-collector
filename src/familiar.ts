import {
  myInebriety,
  inebrietyLimit,
  haveFamiliar,
  mallPrice,
  familiarWeight,
  haveEffect,
  myFamiliar,
  weightAdjustment,
  numericModifier,
} from "kolmafia";
import { have, $familiar, $item, $familiars, get, $effect, $items } from "libram";
import { argmax, trueValue } from "./lib";

export function meatFamiliar(): Familiar {
  if (
    myInebriety() > inebrietyLimit() &&
    have($familiar`Trick-or-Treating Tot`) &&
    have($item`li'l pirate costume`)
  ) {
    return $familiar`Trick-or-Treating Tot`;
  } else {
    const bestLeps = Familiar.all()
      .filter(have)
      .sort(
        (a, b) =>
          numericModifier(b, "Leprechaun", 1, $item`none`) -
          numericModifier(a, "Leprechaun", 1, $item`none`)
      );
    const bestLepMult = numericModifier(bestLeps[0], "Leprechaun", 1, $item`none`);
    return bestLeps
      .filter((familiar) => numericModifier(familiar, "Leprechaun", 1, $item`none`) === bestLepMult)
      .sort(
        (a, b) =>
          numericModifier(b, "Fairy", 1, $item`none`) - numericModifier(a, "Fairy", 1, $item`none`)
      )[0];
  }
}

function myFamiliarWeight(familiar: Familiar | null = null) {
  if (familiar === null) familiar = myFamiliar();
  return familiarWeight(familiar) + weightAdjustment();
}

// 5, 10, 15, 20, 25 +5/turn: 5.29, 4.52, 3.91, 3.42, 3.03
const rotatingFamiliars: { [index: string]: { expected: number[]; drop: Item; pref: string } } = {
  "Fist Turkey": {
    expected: [3.91, 4.52, 4.52, 5.29, 5.29],
    drop: $item`Ambitious Turkey`,
    pref: "_turkeyBooze",
  },
  "Llama Lama": {
    expected: [3.42, 3.91, 4.52, 5.29, 5.29],
    drop: $item`llama lama gong`,
    pref: "_gongDrops",
  },
  "Li'l Xenomorph": {
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`transporter transponder`,
    pref: "_transponderDrops",
  },
  "Rogue Program": {
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`Game Grid token`,
    pref: "_tokenDrops",
  },
  "Bloovian Groose": {
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`groose grease`,
    pref: "_grooseDrops",
  },
  "Baby Sandworm": {
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`agua de vida`,
    pref: "_aguaDrops",
  },
  "Green Pixie": {
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`tiny bottle of absinthe`,
    pref: "_absintheDrops",
  },
  "Blavious Kloop": {
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`devilish folio`,
    pref: "_kloopDrops",
  },
  "Galloping Grill": {
    expected: [3.03, 3.42, 3.91, 4.52, 5.29],
    drop: $item`hot ashes`,
    pref: "_hotAshesDrops",
  },
};

let savedMimicDropValue: number | null = null;
function mimicDropValue() {
  return (
    savedMimicDropValue ??
    (savedMimicDropValue =
      trueValue(...$items`Polka Pop, BitterSweetTarts, Piddles`) / (6.29 * 0.95 + 1 * 0.05))
  );
}

export function freeFightFamiliar(): Familiar {
  const familiarValue: [Familiar, number][] = [];

  if (
    have($familiar`Pocket Professor`) &&
    $familiar`Pocket Professor`.experience < 400 &&
    !get("_thesisDelivered")
  ) {
    // Estimate based on value to charge thesis.
    familiarValue.push([$familiar`Pocket Professor`, 3000]);
  }

  for (const familiarName of Object.keys(rotatingFamiliars)) {
    const familiar: Familiar = Familiar.get(familiarName);
    if (have(familiar)) {
      const { expected, drop, pref } = rotatingFamiliars[familiarName];
      const dropsAlready = get<number>(pref);
      if (dropsAlready >= expected.length) continue;
      const value = mallPrice(drop) / expected[dropsAlready];
      familiarValue.push([familiar, value]);
    }
  }

  if (have($familiar`Stocking Mimic`)) {
    const mimicWeight = myFamiliarWeight($familiar`Stocking Mimic`);
    const actionPercentage = 1 / 3 + (haveEffect($effect`Jingle Jangle Jingle`) ? 0.1 : 0);
    const mimicValue = mimicDropValue() + ((mimicWeight * actionPercentage * 1) / 4) * 10 * 4 * 1.2;
    familiarValue.push([$familiar`Stocking Mimic`, mimicValue]);
  }

  if (haveFamiliar($familiar`Robortender`)) familiarValue.push([$familiar`Robortender`, 200]);

  for (const familiar of $familiars`Hobo Monkey, Cat Burglar, Urchin Urchin, Leprechaun`) {
    if (haveFamiliar(familiar)) familiarValue.push([familiar, 1]);
  }

  familiarValue.push([$familiar`None`, 0]);

  return argmax(familiarValue);
}

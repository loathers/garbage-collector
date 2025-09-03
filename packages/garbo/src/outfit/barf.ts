import { Outfit, OutfitSpec } from "grimoire-kolmafia";
import {
  cliExecute,
  Familiar,
  inebrietyLimit,
  Item,
  myClass,
  myFamiliar,
  myFury,
  myInebriety,
  retrieveItem,
  toSlot,
  totalTurnsPlayed,
} from "kolmafia";
import {
  $class,
  $familiar,
  $item,
  $items,
  $skill,
  $slot,
  Delayed,
  get,
  getKramcoWandererChance,
  have,
  undelay,
} from "libram";
import { barfFamiliar } from "../familiar";
import { chooseBjorn } from "./bjorn";
import { bonusGear, toyCupidBow } from "./dropsgear";
import {
  applyCheeseBonus,
  bestBjornalike,
  cleaverCheck,
  validateGarbageFoldable,
} from "./lib";
import {
  BonusEquipMode,
  MEAT_TARGET_MULTIPLIER,
  modeValueOfItem,
  modeValueOfMeat,
} from "../lib";
import { trackMarginalTurnExtraValue } from "../session";

function chooseGun() {
  if (have($item`love`)) {
    return $item`love`;
  }
  if (!have($item`ice nine`)) {
    cliExecute("refresh inventory");
    retrieveItem($item`ice nine`);
  }

  return have($item`ice nine`) ? $item`ice nine` : null;
}

function gunSpec(outfit: Outfit) {
  if (!outfit.canEquip($item`unwrapped knock-off retro superhero cape`)) {
    return { available: false, items: [] };
  }

  const gun = chooseGun();
  if (!gun) return { available: false, items: [] };

  return {
    available: true,
    items: {
      back: $item`unwrapped knock-off retro superhero cape`,
      weapon: gun,
      equip: $items`mafia pointer finger ring`,
      modes: {
        retrocape: ["robot", "kill"],
      },
    } as OutfitSpec,
  };
}

const POINTER_RING_SPECS: (
  outfit: Outfit,
) => Delayed<{ available: boolean; items: Item[] | OutfitSpec }>[] = (
  outfit: Outfit,
) => [
  {
    available: have($skill`Furious Wallop`) && myFury() > 0,
    items: $items`mafia pointer finger ring`,
  },
  {
    available: have($skill`Head in the Game`),
    items: $items`mafia pointer finger ring`,
  },
  {
    available: myClass() === $class`Turtle Tamer`,
    items: $items`Operation Patriot Shield, mafia pointer finger ring`,
  },
  {
    available: true,
    items: $items`haiku katana, mafia pointer finger ring`,
  },
  () => gunSpec(outfit),
  {
    available: true,
    items: $items`Operation Patriot Shield, mafia pointer finger ring`,
  },
  {
    available: true,
    items: $items`left bear arm, right bear arm, mafia pointer finger ring`,
  },
];

const trueInebrietyLimit = () =>
  inebrietyLimit() - (myFamiliar() === $familiar`Stooper` ? 1 : 0);

export function computeBarfOutfit(
  spec: OutfitSpec & { familiar: Familiar },
  sim = false,
): Outfit {
  cleaverCheck();
  validateGarbageFoldable(spec);
  const outfit = Outfit.from(
    spec,
    new Error(`Failed to construct outfit from spec ${JSON.stringify(spec)}!`),
  );

  outfit.addBonuses(bonusGear(BonusEquipMode.BARF, !sim));
  applyCheeseBonus(outfit, BonusEquipMode.BARF);

  if (outfit.familiar === $familiar`Jill-of-All-Trades`) {
    outfit.equip($item`LED candle`);
    outfit.setModes({ jillcandle: "ultraviolet" });
  }

  if (
    outfit.familiar === $familiar`Chest Mimic` &&
    $familiar`Chest Mimic`.experience < 550
  ) {
    const famExpValue =
      (MEAT_TARGET_MULTIPLIER() * get("valueOfAdventure")) / 50;
    outfit.modifier.push(`${famExpValue} Familiar Experience`);
  }

  const bjornChoice = chooseBjorn(BonusEquipMode.BARF, spec.familiar, sim);

  outfit.modifier.push(
    `${modeValueOfMeat(BonusEquipMode.BARF)} Meat Drop`,
    `${modeValueOfItem(BonusEquipMode.BARF)} Item Drop`,
    "-tie",
  );

  if (myInebriety() > trueInebrietyLimit()) {
    if (!outfit.equip($item`Drunkula's wineglass`)) {
      throw new Error(
        "We're overdrunk but have found ourself unable to equip a wineglass!",
      );
    }
  } else {
    if (
      have($item`protonic accelerator pack`) &&
      get("questPAGhost") === "unstarted" &&
      get("nextParanormalActivity") <= totalTurnsPlayed()
    ) {
      outfit.equip($item`protonic accelerator pack`);
    }

    for (const spec of POINTER_RING_SPECS(outfit)) {
      const { available, items } = undelay(spec);
      if (available && outfit.tryEquip(items)) break;
    }
  }

  if (getKramcoWandererChance() > 0.05) {
    outfit.equip($item`Kramco Sausage-o-Matic™`);
  }

  if (!sim) {
    outfit.addBonuses(toyCupidBow(spec.familiar));
  }

  const bjornalike = bestBjornalike(outfit);
  if (bjornalike) {
    outfit.setBonus(bjornalike, bjornChoice.value);
    const other = $items`Buddy Bjorn, Crown of Thrones`.filter(
      (i) => i !== bjornalike,
    )[0];
    outfit.avoid.push(other);

    switch (bjornalike) {
      case $item`Buddy Bjorn`:
        outfit.bjornify(bjornChoice.familiar);
        break;
      case $item`Crown of Thrones`:
        outfit.enthrone(bjornChoice.familiar);
        break;
    }
  }

  outfit.setModes({
    snowsuit: "nose",
    parka: "kachungasaur",
  });

  return outfit;
}

export function barfOutfit(spec: OutfitSpec, sim = false): Outfit {
  const { familiar, extraValue } = barfFamiliar(
    Boolean(
      spec.famequip ||
        spec.equip?.some((equipment) => toSlot(equipment) === $slot`familiar`),
    ),
  );
  try {
    return computeBarfOutfit({ familiar, ...spec }, sim);
  } finally {
    trackMarginalTurnExtraValue(extraValue);
  }
}

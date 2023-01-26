import { Item, itemAmount, myClass, setLocation, toSlot } from "kolmafia";
import {
  $class,
  $item,
  $items,
  $location,
  $skill,
  $slot,
  get,
  getModifier,
  have,
  sumNumbers,
} from "libram";
import { nonNull, realmAvailable } from "../../lib";
import { garboAverageValue, garboValue } from "../../session";
import { BonusEquipMode, isFreeFight, meatValue, toBonus, VOA } from "../lib";

const mafiaThumbRing = {
  item: $item`mafia thumb ring`,
  value: (mode: BonusEquipMode) => (isFreeFight(mode) ? 0 : (1 / 0.96 - 1) * VOA),
};
const mrCheengsSpectacles = { item: $item`Mr. Cheeng's spectacles`, value: () => 220 };
const mrScreegesSpectacles = { item: $item`Mr. Screege's spectacles`, value: () => 180 };
const powerGlove = {
  item: $item`Powerful Glove`,
  // 23% proc rate, according to the wiki
  // Going ahead and calling it 25, which feels more likely
  // https://kol.coldfront.net/thekolwiki/index.php/Powerful_Glove
  value: () => 0.25 * garboAverageValue(...$items`blue pixel, green pixel, red pixel, white pixel`),
};

function valueLGR(mode: BonusEquipMode): number {
  if (mode === BonusEquipMode.DMT && realmAvailable("hot") && !get("_luckyGoldRingVolcoino")) {
    return 0;
  }

  const dropValues = [
    100, // 80 - 120 meat
    ...[
      itemAmount($item`hobo nickel`) > 0 ? 100 : 0, // This should be closeted
      itemAmount($item`sand dollar`) > 0 ? garboValue($item`sand dollar`) : 0, // This should be closeted
      itemAmount($item`Freddy Kruegerand`) > 0 ? garboValue($item`Freddy Kruegerand`) : 0,
      realmAvailable("sleaze") ? garboValue($item`Beach Buck`) : 0,
      realmAvailable("spooky") ? garboValue($item`Coinspiracy`) : 0,
      realmAvailable("stench") ? garboValue($item`FunFunds™`) : 0,
      realmAvailable("hot") && !get("_luckyGoldRingVolcoino") && mode !== BonusEquipMode.EMBEZZLER
        ? garboValue($item`Volcoino`)
        : 0,
      realmAvailable("cold") ? garboValue($item`Wal-Mart gift certificate`) : 0,
      realmAvailable("fantasy") ? garboValue($item`Rubee™`) : 0,
    ].filter((value) => value > 0),
  ];

  return sumNumbers(dropValues) / dropValues.length / 10;
}

const luckyGoldRing = {
  item: $item`lucky gold ring`,
  value: valueLGR,
};

export function bonusAccessories(
  mode: BonusEquipMode,
  valueCircumstantialBonus = true
): [Item, number][] {
  return nonNull(
    [mafiaThumbRing, mrCheengsSpectacles, mrScreegesSpectacles, powerGlove, luckyGoldRing].map(
      (x) => toBonus(x, mode, valueCircumstantialBonus)
    )
  );
}

let cachedUsingThumbRing: boolean | null = null;
export function usingThumbRing(): boolean {
  if (cachedUsingThumbRing === null) {
    if (!have($item`mafia thumb ring`)) {
      cachedUsingThumbRing = false;
    } else {
      const bonusAccs = bonusAccessories(BonusEquipMode.BARF);
      setLocation($location`Barf Mountain`);
      const meatAccessories = Item.all()
        .filter(
          (item) => have(item) && toSlot(item) === $slot`acc1` && getModifier("Meat Drop", item) > 0
        )
        .map(
          (item) =>
            [item, getModifier("Meat Drop", item) * meatValue(BonusEquipMode.BARF)] as [
              Item,
              number
            ]
        );

      const accessoryValues = new Map<Item, number>(bonusAccs);
      for (const [accessory, value] of meatAccessories) {
        accessoryValues.set(accessory, value + (accessoryValues.get(accessory) ?? 0));
      }
      for (const [accessory, value] of bonusAccs) {
        if (!accessoryValues.has(accessory)) accessoryValues.set(accessory, value);
      }

      if (
        have($item`mafia pointer finger ring`) &&
        ((myClass() === $class`Seal Clubber` && have($skill`Furious Wallop`)) ||
          have($item`haiku katana`) ||
          have($item`Operation Patriot Shield`) ||
          have($item`unwrapped knock-off retro superhero cape`))
      ) {
        accessoryValues.set($item`mafia pointer finger ring`, 500);
      }

      const bestAccessories = [...accessoryValues.entries()]
        .sort(([, aBonus], [, bBonus]) => bBonus - aBonus)
        .map(([item]) => item);
      cachedUsingThumbRing = bestAccessories.slice(0, 2).includes($item`mafia thumb ring`);
    }
  }
  return cachedUsingThumbRing;
}

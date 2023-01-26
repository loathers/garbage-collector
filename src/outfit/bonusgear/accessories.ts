import { Item, myClass, setLocation, toSlot } from "kolmafia";
import { $class, $item, $items, $location, $skill, $slot, getModifier, have } from "libram";
import { nonNull } from "../../lib";
import { garboAverageValue } from "../../session";
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

export function bonusAccessories(mode: BonusEquipMode): [Item, number][] {
  return nonNull(
    [mafiaThumbRing, mrCheengsSpectacles, mrScreegesSpectacles, powerGlove].map((x) =>
      toBonus(x, mode)
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

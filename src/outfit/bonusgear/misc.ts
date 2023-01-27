import { equippedItem, Item, mallPrice } from "kolmafia";
import { $item, $items, $slots, get, sum } from "libram";
import { globalOptions } from "../../config";
import { nonNull } from "../../lib";
import { garboAverageValue, garboValue } from "../../session";
import { BonusEquipMode, ignoreLimitedDrops, isFreeFight, toBonus } from "../lib";

// PANTS
const pantogramPants = {
  item: $item`pantogram pants`,
  value: () => (get("_pantogramModifier").includes("Drops Items") ? 100 : 0),
};

// FAMILIAR EQUIPS
const bagOfManyConfections = {
  item: $item`bag of many confections`,
  value: () => garboAverageValue(...$items`Polka Pop, BitterSweetTarts, Piddles`) / 6,
};
const snowSuit = {
  item: $item`Snow Suit`,
  value: (mode: BonusEquipMode) =>
    ignoreLimitedDrops(mode) || get("_carrotNoseDrops") >= 3
      ? 0
      : garboValue($item`carrot nose`) / 10,
  circumstantial: true,
};

// OFFHANDS
const magnifyingGlass = {
  item: $item`cursed magnifying glass`,
  value: (mode: BonusEquipMode) =>
    isFreeFight(mode) || get("cursedMagnifyingGlassCount") >= 13 || get("_voidFreeFights") >= 5
      ? 0
      : globalOptions.prefs.valueOfFreeFight / 13,
  circumstantial: true,
};

// WEIRD
function stickerValue(mode: BonusEquipMode): number {
  if (mode === BonusEquipMode.EMBEZZLER) return 0;
  return sum(
    $slots`sticker1, sticker2, sticker3`,
    (stickerSlot) => (-1 * mallPrice(equippedItem(stickerSlot))) / 20
  );
}
const stickerSword = { item: $item`scratch 'n' sniff sword`, value: stickerValue };
const stickerCrossbow = { item: $item`scratch 'n' sniff crossbow`, value: stickerValue };

export default (mode: BonusEquipMode, valueCircumstantialBonus: boolean): [Item, number][] =>
  nonNull(
    [
      pantogramPants,
      bagOfManyConfections,
      snowSuit,
      magnifyingGlass,
      stickerSword,
      stickerCrossbow,
    ].map((x) => toBonus(x, mode, valueCircumstantialBonus))
  );

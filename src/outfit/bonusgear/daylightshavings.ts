import { Item } from "kolmafia";
import { $effect, DaylightShavings, have } from "libram";
import { globalOptions } from "../../config";
import { estimatedTurns } from "../../turns";
import { BonusEquipMode, itemValue, meatValue, toBonus } from "../lib";

const daylightShavings = {
  item: DaylightShavings.helmet,
  value: (): number => {
    if (DaylightShavings.buffs.some((buff) => have(buff, 2))) return 0;
    const timeToMeatBuff = 11 * (DaylightShavings.buffsUntil($effect`Friendly Chops`) ?? Infinity);
    if (globalOptions.ascend && timeToMeatBuff > estimatedTurns()) return 0;
    return meatValue(BonusEquipMode.BARF) * 100 + itemValue(BonusEquipMode.BARF) * 50;
  },
  circumstantial: true,
};

export default (mode: BonusEquipMode, valueCircumstantialBonus: boolean): [Item, number] | null =>
  toBonus(daylightShavings, mode, valueCircumstantialBonus);

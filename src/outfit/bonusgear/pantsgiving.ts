import { fullnessLimit, getWorkshed, haveEffect, Item, mallPrice, myFullness } from "kolmafia";
import { $effect, $item, clamp, get } from "libram";
import { globalOptions } from "../../config";
import { baseMeat } from "../../lib";
import { estimatedTurns } from "../../turns";
import { BonusEquipMode, toBonus, VOA } from "../lib";

const pantsgivingBonuses = new Map<number, number>();
function pantsgivingValue(): number {
  const count = get("_pantsgivingCount");
  const turnArray = [5, 50, 500, 5000];
  const index =
    myFullness() === fullnessLimit()
      ? get("_pantsgivingFullness")
      : turnArray.findIndex((x) => count < x);
  const turns = turnArray[index] || 50000;

  if (turns - count > estimatedTurns()) 0;

  const cachedBonus = pantsgivingBonuses.get(turns);
  if (cachedBonus) return cachedBonus;

  const expectedSinusTurns = getWorkshed() === $item`portable Mayo Clinic` ? 100 : 50;
  const expectedUseableSinusTurns = globalOptions.ascend
    ? clamp(
        estimatedTurns() - (turns - count) - haveEffect($effect`Kicked in the Sinuses`),
        0,
        expectedSinusTurns
      )
    : expectedSinusTurns;
  const sinusVal = expectedUseableSinusTurns * 1.0 * baseMeat;
  const fullnessValue =
    sinusVal +
    VOA * 6.5 -
    (mallPrice($item`jumping horseradish`) + mallPrice($item`Special Seasoning`));
  const pantsgivingBonus = fullnessValue / (turns * 0.9);
  pantsgivingBonuses.set(turns, pantsgivingBonus);
  return pantsgivingBonus;
}

const pantsgiving = { item: $item`Pantsgiving`, value: pantsgivingValue };
export default (mode: BonusEquipMode): [Item, number] | null => toBonus(pantsgiving, mode);

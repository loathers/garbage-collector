import { Item } from "kolmafia";
import { BonusEquipMode } from "../lib";
import { bonusAccessories, usingThumbRing } from "./accessories";
import cheeses from "./stinkycheeses";
import cleaver from "./cleaver";
import mayflower from "./mayflower";
import misc from "./misc";
import pantsgiving from "./pantsgiving";
import sweatpants from "./sweatpants";
import { nonNull } from "../../lib";

function bonusGear(mode: BonusEquipMode, valueCircumstantialBonus = true): [Item, number][] {
  return [
    ...nonNull(
      [cleaver, mayflower, pantsgiving, sweatpants].map((bonus) =>
        bonus(mode, valueCircumstantialBonus)
      )
    ),
    ...cheeses(mode),
    ...bonusAccessories(mode, valueCircumstantialBonus),
    ...misc(mode, valueCircumstantialBonus),
  ];
}

export { bonusGear, usingThumbRing };

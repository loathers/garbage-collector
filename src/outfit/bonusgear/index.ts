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

function bonusGear(mode: BonusEquipMode): [Item, number][] {
  return [
    ...nonNull([cleaver, mayflower, pantsgiving, sweatpants].map((bonus) => bonus(mode))),
    ...cheeses(mode),
    ...bonusAccessories(mode),
    ...misc(mode),
  ];
}

export { bonusGear, usingThumbRing };

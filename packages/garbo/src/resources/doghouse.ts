import { $item, get, haveInCampground, realmAvailable } from "libram";
import { globalOptions } from "../config";
import { garboValue } from "../garboValue";
import { mallPrice } from "kolmafia";
import { hotTubAvailable } from "./clanVIP";

export function shouldLavaDogs(): boolean {
  return (
    globalOptions.ascend &&
    haveInCampground($item`haunted doghouse`) &&
    !get("doghouseBoarded") &&
    realmAvailable("hot") &&
    garboValue($item`Volcoino`) >
      7 * get("valueOfAdventure") +
        (hotTubAvailable()
          ? 0
          : mallPrice($item`soft green echo eyedrop antidote`))
  );
}

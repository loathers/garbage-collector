import {
  $item,
  $location,
  get,
  haveInCampground,
  realmAvailable,
} from "libram";
import { globalOptions } from "../config";
import { garboValue } from "../garboValue";
import { mallPrice } from "kolmafia";
import { hotTubAvailable } from "./clanVIP";

export function lavaDogsAccessible(): boolean {
  return (
    haveInCampground($item`haunted doghouse`) &&
    !get("doghouseBoarded") &&
    realmAvailable("hot")
  );
}

export function lavaDogsComplete(): boolean {
  return (
    get("hallowienerVolcoino") ||
    $location`The Bubblin' Caldera`.turnsSpent >= 7 ||
    $location`The Bubblin' Caldera`.noncombatQueue.includes("Lava Dogs")
  );
}

export function shouldLavaDogs(): boolean {
  return (
    globalOptions.ascend &&
    lavaDogsAccessible() &&
    garboValue($item`Volcoino`) >
      7 * get("valueOfAdventure") +
        (hotTubAvailable()
          ? 0
          : mallPrice($item`soft green echo eyedrop antidote`))
  );
}

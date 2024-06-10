import {
  $item,
  $location,
  get,
  haveInCampground,
  realmAvailable,
} from "libram";

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
    $location`The Bubblin' Caldera`.turnsSpent > 7 ||
    $location`The Bubblin' Caldera`.noncombatQueue.includes("Lava Dogs")
  );
}

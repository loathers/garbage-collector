import { Location, Monster } from "kolmafia";
import { $location, $monster, get } from "libram";
import { AdventureArgument } from "../garboWanderer";

export const ghostLocations: Map<Location, Monster> = new Map([
  [$location`Cobb's Knob Treasury`, $monster`The ghost of Ebenoozer Screege`],
  [
    $location`The Haunted Conservatory`,
    $monster`The ghost of Lord Montague Spookyraven`,
  ],
  [$location`The Haunted Gallery`, $monster`The ghost of Waldo the Carpathian`],
  [$location`The Haunted Kitchen`, $monster`The Icewoman`],
  [$location`The Haunted Wine Cellar`, $monster`The ghost of Jim Unfortunato`],
  [$location`The Icy Peak`, $monster`The ghost of Sam McGee`],
  [$location`Inside the Palindome`, $monster`Emily Koops, a spooky lime`],
  [$location`Madness Bakery`, $monster`the ghost of Monsieur Baguelle`],
  [
    $location`The Old Landfill`,
    $monster`The ghost of Vanillica "Trashblossom" Gorton`,
  ],
  [$location`The Overgrown Lot`, $monster`the ghost of Oily McBindle`],
  [$location`The Skeleton Store`, $monster`boneless blobghost`],
  [
    $location`The Smut Orc Logging Camp`,
    $monster`The ghost of Richard Cockingham`,
  ],
  [$location`The Spooky Forest`, $monster`The Headless Horseman`],
]);

export function getGhost(): Monster | null {
  return ghostLocations.get(get("ghostLocation") ?? $location.none) ?? null;
}

export function ghostAdventure(): AdventureArgument {
  return {
    location: get("ghostLocation") ?? $location.none,
    target: getGhost() ?? $monster.none,
  };
}

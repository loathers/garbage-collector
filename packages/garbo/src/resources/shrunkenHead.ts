import { canAdventure, Location, Monster, myPath, Path } from "kolmafia";
import { $item, $location, $monster, have, PeridotOfPeril } from "libram";
import { baseMeat } from "../lib";

export function shrunkenHeadValue(): number {
  // eslint-disable-next-line libram/verify-constants
  if (!have($item`shrunken head`) || shrunkenHeadLocation() === Location.none) {
    return 0;
  }
  return baseMeat() * shrunkenHeadMonsterValue() * 200;
}

export function shrunkenHeadLocation(): Location {
  if (myPath() !== Path.none || !have($item`Peridot of Peril`)) {
    return Location.none;
  }
  if (
    canAdventure($location`The Penultimate Fantasy Airship`) &&
    !PeridotOfPeril.zonesToday().includes(
      $location`The Penultimate Fantasy Airship`,
    )
  ) {
    return $location`The Penultimate Fantasy Airship`;
  }
  if (
    canAdventure($location`The Castle in the Clouds in the Sky (Top Floor)`) &&
    !PeridotOfPeril.zonesToday().includes(
      $location`The Castle in the Clouds in the Sky (Top Floor)`,
    )
  ) {
    return $location`The Castle in the Clouds in the Sky (Top Floor)`;
  }

  return Location.none;
}

export function shrunkenHeadMonster(): Monster {
  if (shrunkenHeadLocation() === $location`The Penultimate Fantasy Airship`) {
    return $monster`MagiMechTech MechaMech`;
  }

  if (
    shrunkenHeadLocation() ===
    $location`The Castle in the Clouds in the Sky (Top Floor)`
  ) {
    return $monster`Goth Giant`;
  }

  return Monster.none;
}

function shrunkenHeadMonsterValue(): number {
  if (shrunkenHeadMonster() === $monster`MagiMechTech MechaMech`) return 0.52;
  if (shrunkenHeadMonster() === $monster`Goth Giant`) return 0.44;

  return 0;
}

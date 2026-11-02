import { getCampground, myGardenType, use, visitUrl } from "kolmafia";
import {
  $item,
  $items,
  BlackRoseGarden,
  GARDEN_ITEMS,
  get,
  have,
  haveInCampground,
} from "libram";
import { globalOptions } from "../config";

// Capture this before any tasks run: temporarily planting roses must not lock us in.
const startingGarden = Object.values(GARDEN_ITEMS).find((garden) =>
  haveInCampground(garden),
);

export function canSwapGarden(): boolean {
  if (get("_blackRoseGardenToday")) return true;
  if (globalOptions.ascend) return true;
  if (BlackRoseGarden.swappedToday()) return true;
  return startingGarden !== $item`black garden rose`;
}

export function setupGarden(): void {
  if (!canSwapGarden()) return;

  if (
    startingGarden &&
    !$items`packet of tall grass seeds, packet of mushroom spores`.includes(
      startingGarden,
    ) &&
    getCampground()[startingGarden.name] &&
    $items`packet of tall grass seeds, packet of mushroom spores`.some(
      (gardenSeed) => have(gardenSeed),
    )
  ) {
    if (startingGarden === $item`packet of rock seeds`) {
      visitUrl("campground.php?action=rgarden1&pwd");
      visitUrl("campground.php?action=rgarden2&pwd");
      visitUrl("campground.php?action=rgarden3&pwd");
    } else {
      visitUrl("campground.php?action=garden&pwd");
    }
  }

  if (
    have($item`packet of tall grass seeds`) &&
    myGardenType() !== "grass" &&
    myGardenType() !== "mushroom"
  ) {
    use($item`packet of tall grass seeds`);
  }
}

function blackRoseWillGrow(): boolean {
  return myGardenType() === "black_rose" && !BlackRoseGarden.swappedToday();
}

export function restoreGarden(): void {
  if (
    canSwapGarden() &&
    startingGarden &&
    have(startingGarden) &&
    !blackRoseWillGrow()
  ) {
    use(startingGarden);
  }
}

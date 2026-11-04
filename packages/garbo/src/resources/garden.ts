import { getCampground, Item, myGardenType, use, visitUrl } from "kolmafia";
import {
  $item,
  $items,
  BlackRoseGarden,
  GARDEN_ITEMS,
  get,
  have,
  haveInCampground,
  maxBy,
  sum,
} from "libram";
import { globalOptions } from "../config";
import { garboValue } from "../garboValue";

export type HarvestableGarden = {
  seedPacket: Item;
  harvestables: Item[];
};

// These are only for day 1 swapping after doing black rose (or any other similar garden)
const harvestableGardens: HarvestableGarden[] = [
  {
    seedPacket: $item`packet of rock seeds`,
    harvestables: $items`groveling gravel, milestone, whet stone`,
  },
  {
    seedPacket: $item`packet of pumpkin seeds`,
    harvestables: $items`pumpkin`,
  },
];

function currentGarden(): Item | undefined {
  return Object.values(GARDEN_ITEMS).find((garden) => haveInCampground(garden));
}

// Capture this before any tasks run: temporarily planting roses must not lock us in.
const startingGarden = currentGarden();

export function canSwapGarden(): boolean {
  if (get("_blackRoseGardenToday")) return true;
  if (globalOptions.ascend) return true;
  if (BlackRoseGarden.swappedToday()) return true;
  return startingGarden !== $item`black garden rose`;
}

export function harvestGarden(): void {
  if (currentGarden() === $item`packet of rock seeds`) {
    visitUrl("campground.php?action=rgarden1&pwd");
    visitUrl("campground.php?action=rgarden2&pwd");
    visitUrl("campground.php?action=rgarden3&pwd");
  } else {
    visitUrl("campground.php?action=garden&pwd");
  }
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
    harvestGarden();
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

let cachedbestHarvestSwap: Item | null = null;
export function bestHarvestSwap(): Item {
  if (cachedbestHarvestSwap === null) {
    const ownedGardens = harvestableGardens.filter((garden) =>
      have(garden.seedPacket),
    );
    if (ownedGardens.length <= 0) {
      cachedbestHarvestSwap = Item.none;
    } else {
      cachedbestHarvestSwap = maxBy(ownedGardens, (garden) => {
        const value = sum(garden.harvestables, garboValue);
        return value;
      }).seedPacket;
    }
  }
  return cachedbestHarvestSwap;
}

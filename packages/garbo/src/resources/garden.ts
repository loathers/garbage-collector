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
  harvestables: [Item, number][];
};

// These are only for day 1 swapping after doing black rose (or any other similar garden)
const harvestableGardens: HarvestableGarden[] = [
  {
    seedPacket: $item`packet of rock seeds`,
    harvestables: [
      [$item`groveling gravel`, 1],
      [$item`milestone`, 1],
      [$item`whet stone`, 1],
    ],
  },
  {
    seedPacket: $item`packet of pumpkin seeds`,
    harvestables: [[$item`pumpkin`, 1]],
  },
  {
    seedPacket: $item`Peppermint Pip Packet`,
    harvestables: [[$item`peppermint sprout`, 3]],
  },
  {
    seedPacket: $item`packet of dragon's teeth`,
    harvestables: [[$item`skeleton`, 5]],
  },
  {
    seedPacket: $item`packet of beer seeds`,
    harvestables: [
      [$item`handful of barley`, 3],
      [$item`cluster of hops`, 3],
    ],
  },
  {
    seedPacket: $item`packet of winter seeds`,
    harvestables: [
      [$item`snow berries`, 3],
      [$item`ice harvest`, 3],
    ],
  },
  {
    seedPacket: $item`packet of thanksgarden seeds`,
    harvestables: [[$item`cornucopia`, 1]],
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

export function blackRoseWillGrow(): boolean {
  return (
    myGardenType() === "black_rose" &&
    !BlackRoseGarden.swappedToday() &&
    !globalOptions.ascend
  );
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
      cachedbestHarvestSwap = maxBy(ownedGardens, (garden) =>
        sum(
          garden.harvestables,
          ([item, quantity]) => quantity * garboValue(item),
        ),
      ).seedPacket;
    }
  }
  return cachedbestHarvestSwap;
}

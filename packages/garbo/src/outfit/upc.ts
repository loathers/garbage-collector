import { Outfit } from "grimoire-kolmafia";
import { equippedItem, mallPrice, toInt, toSlot, visitUrl } from "kolmafia";
import { $item, $items, $slots, findLeprechaunMultiplier, have } from "libram";
import { acquire } from "../acquire";
import { globalOptions } from "../config";
import { targetMeat } from "../lib";
import { highMeatMonsterCount, wanderingCopytargetsRemaining } from "../turns";

function useUPCs(): void {
  const UPC = $item`scratch 'n' sniff UPC sticker`;
  if (
    $items`scratch 'n' sniff sword, scratch 'n' sniff crossbow`.every(
      (i) => !have(i),
    )
  ) {
    visitUrl(`bedazzle.php?action=juststick&sticker=${toInt(UPC)}&pwd`);
  }
  for (let slotNumber = 1; slotNumber <= 3; slotNumber++) {
    const slot = toSlot(`sticker${slotNumber}`);
    const sticker = equippedItem(slot);
    if (sticker === UPC) continue;
    visitUrl("bedazzle.php");
    if (sticker !== $item.none) {
      visitUrl(`bedazzle.php?action=peel&pwd&slot=${slotNumber}`);
    }
    visitUrl(
      `bedazzle.php?action=stick&pwd&slot=${slotNumber}&sticker=${toInt(UPC)}`,
    );
  }
}

const stickerSlots = $slots`sticker1, sticker2, sticker3`;
const UPC = $item`scratch 'n' sniff UPC sticker`;
export function useUPCsIfNeeded({ familiar }: Outfit): void {
  const currentWeapon =
    25 * (familiar ? findLeprechaunMultiplier(familiar) : 0);
  const targets = globalOptions.ascend
    ? Math.min(20, highMeatMonsterCount() || wanderingCopytargetsRemaining())
    : 20;

  const addedValueOfFullSword =
    (targets * ((75 - currentWeapon) * targetMeat())) / 100;
  if (addedValueOfFullSword > 3 * mallPrice(UPC)) {
    const needed =
      3 -
      stickerSlots.filter((sticker) => equippedItem(sticker) === UPC).length;
    if (needed) acquire(needed, UPC, addedValueOfFullSword / 3, false);
    useUPCs();
  }
}

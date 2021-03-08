import { $items, maximizeCached } from "libram";

export function freeFightOutfit() {
  maximizeCached(["Familiar Weight"], {
    forceEquip: $items`pantogram pants, lucky gold ring, Mr. Cheeng's spectacles`,
  });
}

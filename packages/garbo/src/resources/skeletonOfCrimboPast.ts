import { $phylum, get, sum } from "libram";
import { Location } from "kolmafia";
import { AdventureTarget, adventureTargetToWeightedMap } from "../lib";

const BONE_PHYLA = new Map([
  [$phylum`beast`, 0.3],
  [$phylum`bug`, 0.1],
  [$phylum`construct`, 0.1],
  [$phylum`demon`, 0.4],
  [$phylum`elf`, 0.5],
  [$phylum`fish`, 0.2],
  [$phylum`goblin`, 0.4],
  [$phylum`hobo`, 0.5],
  [$phylum`humanoid`, 0.4],
  [$phylum`orc`, 0.8],
  [$phylum`penguin`, 0.2],
  [$phylum`pirate`, 0.65],
]);

export function expectedBones(target: AdventureTarget): number {
  if (get("_knuckleboneDrops", 0) >= 100) return 0;
  if (target instanceof Location) {
    return expectedBones(adventureTargetToWeightedMap(target));
  }
  if (target instanceof Map) {
    return sum(
      [...target.entries()],
      ([monster, rate]) => rate * expectedBones(monster),
    );
  }

  if (target.attributes.includes("SKELETON")) return 0.9;

  return BONE_PHYLA.get(target.phylum) ?? 0;
}

import { $item, get, maxBy } from "libram";
import { garboValue } from "../../garboValue";

export function dessertIslandWorthIt(): boolean {
  // estimating value of giant giant crab at 5*VOA, it has 2000 base meat
  return garboValue($item`cocoa of youth`) > 5 * get("valueOfAdventure");
}

function crewRoleValue(crewmate: string): number {
  // Cuisinier is highest value if cocoa of youth is more meat than expected from giant crab
  if (dessertIslandWorthIt() && crewmate.includes("Cuisinier")) {
    return 50;
  }
  // Coxswain helps save turns if we run from storms
  if (crewmate.includes("Coxswain")) return 40;
  // Harquebusier gives us extra fun from combats
  if (crewmate.includes("Harquebusier")) return 30;
  // Crypto, Cuisinier (if cocoa not worth it), and Mixologist have small bonuses we care about less
  return 0;
}

function crewAdjectiveValue(crewmate: string): number {
  // Wide-Eyed give us bonus fun when counting birds in smooth sailing, and we'll mostly be doing that rather than spending limited grub/grog
  if (crewmate.includes("Wide-Eyed")) return 5;
  // Gluttonous can help when running out of grub, even though we usually shouldn't?
  if (crewmate.includes("Gluttonous")) return 4;
  // Beligerent, Dipsomaniacal, and Pinch-Fisted don't make much difference
  return 0;
}

export function bestCrewmate(): 1 | 2 | 3 {
  return maxBy([1, 2, 3], (choiceOption) => {
    const crewmatePref = `_pirateRealmCrewmate${choiceOption}`;
    const crewmate = get(crewmatePref);
    const roleValue = crewRoleValue(crewmate);
    const adjectiveValue = crewAdjectiveValue(crewmate);
    return roleValue + adjectiveValue;
  });
}

export function outfitBonuses() {
  const funPointValue = garboValue($item`PirateRealm guest pass`) / 600;
  return new Map([
    [
      $item`carnivorous potted plant`,
      get("valueOfAdventure") / (20 + get("_carnivorousPottedPlantWins")),
    ],
    [$item`Red Roger's red left foot`, funPointValue],
    [$item`PirateRealm party hat`, funPointValue],
  ]);
}

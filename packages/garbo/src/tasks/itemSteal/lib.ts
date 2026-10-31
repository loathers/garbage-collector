import {
  canAdventure,
  isBanished,
  Item,
  Location,
  mallPrice,
  Monster,
  myAscensions,
  myLevel,
  use,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $location,
  $locations,
  $monster,
  $monsters,
  BatWings,
  Cartography,
  clamp,
  get,
  have,
  maxBy,
} from "libram";
import { acquire } from "../../acquire";
import { garboValue } from "../../garboValue";
import { asArray } from "../../lib";

export type ItemStealZone = {
  item: Item;
  location: Location;
  monster: Monster | Monster[];
  dropRate: number;
  maximize: string[];
  requireMapTheMonsters: boolean; // When a zone has a choice we want to avoid
  isOpen: () => boolean;
  openCost: () => number;
  preReq: () => void;
};
export const itemStealZones = [
  {
    location: $location`The Deep Dark Jungle`,
    monster: $monster`smoke monster`,
    item: $item`transdermal smoke patch`,
    dropRate: 1,
    maximize: [],
    requireMapTheMonsters: false,
    isOpen: () => get("_spookyAirportToday") || get("spookyAirportAlways"),
    openCost: () => 0,
    preReq: null,
  },
  {
    location: $location`The Ice Hotel`,
    monster: $monster`ice bartender`,
    item: $item`perfect ice cube`,
    dropRate: 1,
    maximize: [],
    requireMapTheMonsters: false,
    isOpen: () => get("_coldAirportToday") || get("coldAirportAlways"),
    openCost: () => 0,
    preReq: null,
  },
  {
    location: $location`The Haunted Library`,
    monster: $monster`bookbat`,
    item: $item`tattered scrap of paper`,
    dropRate: 1,
    maximize: ["99 monster level 100 max"], // Bookbats need up to +100 ML to survive the polar vortices
    requireMapTheMonsters: false,
    isOpen: () => have($item`[7302]Spookyraven library key`),
    openCost: () => 0,
    preReq: null,
  },
  {
    location: $location`The Stately Pleasure Dome`,
    monster: $monster`toothless mastiff bitch`,
    item: $item`disintegrating spiky collar`,
    dropRate: 1,
    maximize: ["99 muscle 100 max"], // Ensure mastiff is at least 100 hp
    requireMapTheMonsters: false,
    isOpen: () => true,
    openCost: () =>
      !have($effect`Absinthe-Minded`)
        ? mallPrice($item`tiny bottle of absinthe`)
        : 0,
    preReq: () => {
      if (!have($effect`Absinthe-Minded`)) {
        acquire(
          1,
          $item`tiny bottle of absinthe`,
          mallPrice($item`tiny bottle of absinthe`) * 2,
          true,
        );
        use($item`tiny bottle of absinthe`);
      }
    },
  },
  {
    location: $location`Twin Peak`,
    monster: $monsters`bearpig topiary animal, elephant (meatcar?) topiary animal, spider (duck?) topiary animal`,
    item: $item`rusty hedge trimmers`,
    dropRate: 0.5,
    maximize: ["99 monster level 11 max"], // Topiary animals need an extra 11 HP to survive polar vortices
    requireMapTheMonsters: false,
    isOpen: () =>
      myLevel() >= 9 &&
      get("chasmBridgeProgress") >= 30 &&
      get("twinPeakProgress") >= 15,
    openCost: () => 0,
    preReq: null,
  },
  {
    location: $location`The Hidden Temple`,
    monster: $monster`baa-relief sheep`,
    item: $item`stone wool`,
    requireMapTheMonsters: true,
    dropRate: 1,
    maximize: ["99 monster level 100 max"], // Sheeps need up to +100 ML to survive the polar vortices
    isOpen: () => get("lastTempleUnlock") === myAscensions(),
    openCost: () => 0,
    preReq: null,
  },
  ...$locations`Shadow Rift (The Ancient Buried Pyramid), Shadow Rift (The Hidden City), Shadow Rift (The Misspelled Cemetary)`.map(
    (location) => ({
      location,
      monster: $monster`shadow slab`,
      item: $item`shadow brick`,
      requireMapTheMonsters: false,
      dropRate: 1,
      isOpen: () => canAdventure(location),
      openCost: () => 0,
      preReq: null,
    }),
  ),
] as ItemStealZone[];

export function getBestItemStealZone(
  canMapMonster = Cartography.availableMaps() > 0 ||
    Cartography.currentlyMapping(),
): ItemStealZone | null {
  const targets = itemStealZones.filter(
    (zone) =>
      zone.isOpen() &&
      (canMapMonster ||
        (!zone.requireMapTheMonsters &&
          asArray(zone.monster).some((m) => !isBanished(m)))),
  );
  const vorticesAvail = have($item`industrial fire extinguisher`)
    ? Math.floor(get("_fireExtinguisherCharge") / 10)
    : 0;
  const hugsAvail = have($familiar`XO Skeleton`)
    ? clamp(11 - get("_xoHugsUsed"), 0, 11)
    : 0;
  const swoopsAvail = BatWings.swoopsRemaining();
  const value = (zone: ItemStealZone): number => {
    // We have to divide hugs by 2 - will likely use a banish as a free run so we will be alternating zones.
    return (
      zone.dropRate *
        garboValue(zone.item) *
        (vorticesAvail + swoopsAvail + hugsAvail / 2) -
      zone.openCost()
    );
  };
  return targets.length ? maxBy(targets, value) : null;
}

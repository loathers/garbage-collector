import { OutfitSpec } from "grimoire-kolmafia";
import { Macro } from "../../combat";
import { Item, Location, Monster } from "kolmafia";
import {
  $familiar,
  $item,
  $items,
  $location,
  $locations,
  $monster,
  $skill,
  clamp,
  get,
  have,
} from "libram";

type ItemStealSource = {
  name: string;
  have: boolean;
  remaining: () => number;
  macro: Macro;
  perFight: number;
  spec: OutfitSpec;
};

type ItemStealTarget = {
  location: Location;
  monster: Monster;
  item: Item;
  requireML?: boolean;
};

const ItemStealSources: ItemStealSource[] = [
  {
    name: "Extinguisher",
    have: have($item`industrial fire extinguisher`),
    remaining: () => Math.floor(get("_fireExtinguisherCharge") / 10),
    macro: Macro.trySkillRepeat($skill`Fire Extinguisher: Polar Vortex`),
    perFight: 10,
    spec: { equip: $items`industrial fire extinguisher` },
  },
  {
    name: "Bat Swoop",
    have: have($item`bat wings`),
    remaining: () => $skill`Swoop like a Bat`.dailylimit,
    macro: Macro.skill($skill`Swoop like a Bat`),
    perFight: 1,
    spec: { back: $item`bat wings` },
  },
  {
    name: "Mild Evil",
    have: have($skill`Perpetrate Mild Evil`),
    remaining: () => $skill`Perpetrate Mild Evil`.dailylimit,
    macro: Macro.skill($skill`Perpetrate Mild Evil`),
    perFight: 1,
    spec: {},
  },
  {
    name: "XO Hug",
    have: have($familiar`XO Skeleton`),
    remaining: () => clamp(11 - get("_xoHugsUsed"), 0, 11),
    macro: Macro.skill($skill`Hugs and Kisses!`),
    perFight: 1,
    spec: { familiar: $familiar`XO Skeleton` },
  },
];

export const ItemStealTargets: ItemStealTarget[] = [
  {
    location: $location`The Deep Dark Jungle`,
    monster: $monster`smoke monster`,
    item: $item`transdermal smoke patch`,
  },
  {
    location: $location`The Ice Hotel`,
    monster: $monster`ice bartender`,
    item: $item`perfect ice cube`,
  },
  {
    location: $location`The Haunted Library`,
    monster: $monster`bookbat`,
    item: $item`tattered scrap of paper`,
    requireML: true,
  },
  {
    location: $location`Twin Peak`,
    monster: $monster`bearpig topiary animal`, // TODO: this location specifically has multiple targets
    item: $item`rusty hedge trimmers`,
    requireML: true,
  },
  {
    location: $location`The Hidden Temple`,
    monster: $monster`baa-relief sheep`,
    item: $item`stone wool`,
    requireML: true,
  },
  ...$locations`Shadow Rift (The Ancient Buried Pyramid), Shadow Rift (The Hidden City), Shadow Rift (The Misspelled Cemetary)`.map(
    (location) => ({
      location,
      monster: $monster`shadow slab`,
      item: $item`shadow brick`,
    }),
  ),
];

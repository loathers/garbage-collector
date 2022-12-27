import { Task } from "grimoire-kolmafia";
import {
  equip,
  familiarEquippedEquipment,
  hippyStoneBroken,
  myPrimestat,
  use,
  useFamiliar,
} from "kolmafia";
import { $familiar, $familiars, $item, $items, CrimboShrub, get, have } from "libram";
import { withStash } from "../clan";
import { meatFamiliar } from "../familiar";
import { tryFeast } from "../lib";

export const DailyFamiliarTasks: Task[] = [
  {
    name: "Prepare Shorter-Order Cook",
    ready: () => have($familiar`Shorter-Order Cook`) && have($item`blue plate`),
    completed: () => familiarEquippedEquipment($familiar`Shorter-Order Cook`) === $item`blue plate`,
    do: () => equip($familiar`Shorter-Order Cook`, $item`blue plate`),
  },
  {
    name: "Acquire amulet coin",
    ready: () => have($familiar`Cornbeefadon`),
    completed: () => have($item`amulet coin`),
    do: () => use($item`box of Familiar Jacks`),
    acquire: [{ item: $item`box of Familiar Jacks` }],
    outfit: { familiar: $familiar`Cornbeefadon` },
  },
  {
    // TODO: Consider other familiars?
    name: "Equip tiny stillsuit",
    ready: () => have($item`tiny stillsuit`) && have($familiar`Cornbeefadon`),
    completed: () => familiarEquippedEquipment($familiar`Cornbeefadon`) === $item`tiny stillsuit`,
    do: () => equip($familiar`Cornbeefadon`, $item`tiny stillsuit`),
  },
  {
    name: "Acquire box of old Crimbo decorations",
    ready: () => have($familiar`Crimbo Shrub`),
    completed: () => have($item`box of old Crimbo decorations`),
    do: (): void => {
      useFamiliar($familiar`Crimbo Shrub`);
    },
    outfit: { familiar: $familiar`Crimbo Shrub` },
  },
  {
    name: "Decorate Crimbo Shrub",
    ready: () => have($item`box of old Crimbo decorations`),
    completed: () => have($item`box of old Crimbo decorations`),
    do: () =>
      CrimboShrub.decorate(
        myPrimestat().toString(),
        "Stench Damage",
        hippyStoneBroken() ? "PvP Fights" : "HP Regen",
        "Red Ray"
      ),
    outfit: { familiar: $familiar`Crimbo Shrub` },
  },
  {
    name: "Moveable feast",
    ready: () => have($item`moveable feast`) || get("garbo_stashClan", "none") !== "none",
    completed: () => get("_feastUsed") > 0,
    do: (): void => {
      withStash($items`moveable feast`, () => {
        if (have($item`moveable feast`)) {
          [
            ...$familiars`Pocket Professor, Frumious Bandersnatch, Pair of Stomping Boots`,
            meatFamiliar(),
          ].forEach(tryFeast);
        }
      });
    },
  },
];

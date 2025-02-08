import { OutfitSpec } from "grimoire-kolmafia";
import { Macro } from "../../combat";
import { Location, Monster } from "kolmafia";

type ItemStealSource = {
  have: boolean;
  remaining: () => number;
  macro: Macro;
  perFight: () => number;
  spec: OutfitSpec;
};

type ItemStealTarget = {
  location: Location;
  monster: Monster;
};

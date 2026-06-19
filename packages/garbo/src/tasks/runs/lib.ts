import { OutfitSpec } from "grimoire-kolmafia";
import { Item, Skill } from "kolmafia";
import { Macro } from "../../combat";

export type FreeRunSource = {
  name: string;
  spec: OutfitSpec;
  available: (task: string) => boolean;
  have: () => boolean;
  macro: Macro;
};

export type FreeRunBanishSource = FreeRunSource & {
  banish: Item | Skill;
  remaining: () => number;
};

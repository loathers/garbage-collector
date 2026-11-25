import { BanishMethod } from "../resources/banish";
import {
  Adventure,
  AdventureArgument,
  toAdventure,
  wanderer,
} from "../garboWanderer";

export type AdventureContext = {
  readonly adventure: Adventure & {
    choices: Record<number, string | number>;
  };
};

export type FarmingContext = AdventureContext & {
  readonly banish: BanishMethod | null;
};

export function adventureContext(
  resolve: () => AdventureArgument,
): AdventureContext {
  let adventure: AdventureContext["adventure"] | null = null;
  return {
    get adventure() {
      if (adventure) return adventure;
      const resolved = toAdventure(resolve(), false);
      adventure = {
        ...resolved,
        choices: wanderer().getChoices(
          resolved.wanderTarget ?? resolved.location,
        ),
      };
      return adventure;
    },
  };
}

export const EMPTY_CONTEXT: FarmingContext = {
  banish: null,
  get adventure(): FarmingContext["adventure"] {
    throw new Error("No adventure is available outside task execution");
  },
};

import { getTasks, Quest, Task } from "grimoire-kolmafia";
import { Location, Monster } from "kolmafia";
import { Delayed, undelay } from "libram";
import { GarboStrategy } from "../combatStrategy";
import { AdventureArgument } from "../garboWanderer";
import { AdventureContext, FarmingContext } from "./context";

type Action<Context> = Task<never, Context>["do"];
type LocationAdventure = Exclude<AdventureArgument, Monster>;

export type GarboTask<Context = unknown> = Omit<
  Task<never, Context>,
  "do" | "combat" | "outfit"
> & {
  sobriety?: Delayed<"drunk" | "sober" | undefined, [Context]>;
  spendsTurn: Delayed<boolean, [Context]>;
  duplicate?: Delayed<boolean, [Context]>;
} & (
    | ({
        combat: GarboStrategy<Context>;
        outfit: NonNullable<Task<never, Context>["outfit"]>;
      } & (
        | {
            adventure: Delayed<LocationAdventure, [Context]>;
            do?: Action<Context>;
          }
        | {
            adventure: Delayed<AdventureArgument, [Context]>;
            do: Action<Context>;
          }
      ))
    | {
        combat?: never;
        adventure?: never;
        outfit?: Task<never, Context>["outfit"];
        do: () => void;
      }
  );

export type AlternateTask<Context = unknown> = GarboTask<Context> & {
  turns: Delayed<number>;
};

export type MappingTask<Context = unknown> = GarboTask<Context> & {
  // Can this task safely be executed while Map the Monsters is active?
  mapSafe?: Delayed<boolean, [Context]>;
};

export type FarmingTask = GarboTask<FarmingContext>;

// Wrap grimoire's getTasks because GarboTask isn't actually a task
export const getGarboTasks = getTasks as <
  Context,
  Definition extends GarboTask<Context>,
>(
  quests: Quest<Definition, Context>[],
  implicitAfter?: boolean,
  verifyTaskDependencies?: boolean,
) => Definition[];

export type AdaptedTask<
  Context extends AdventureContext,
  Definition extends GarboTask<Context> = GarboTask<Context>,
> = Definition extends { adventure: unknown }
  ? Omit<Definition, "do" | "choices"> & {
      do: Definition extends { do: Action<Context> }
        ? Definition["do"]
        : Action<Context>;
      choices: NonNullable<Task<never, Context>["choices"]>;
    }
  : Definition;

function staticLocation(adventure: AdventureArgument): Location | null {
  if (adventure instanceof Location) return adventure;
  if (typeof adventure === "object" && "location" in adventure) {
    return staticLocation(adventure.location);
  }
  return null;
}

export function adaptTask<
  Context extends AdventureContext,
  Definition extends GarboTask<Context>,
>(task: Definition & GarboTask<Context>): AdaptedTask<Context, Definition>;
export function adaptTask<Context extends AdventureContext>(
  task: GarboTask<Context>,
) {
  if (task.adventure === undefined) return task;

  const location =
    typeof task.adventure === "function"
      ? null
      : staticLocation(task.adventure);
  return {
    ...task,
    do:
      task.do ?? location ?? ((context: Context) => context.adventure.location),
    choices: (context: Context) => ({
      ...context.adventure.choices,
      ...undelay(task.choices, context),
    }),
  };
}

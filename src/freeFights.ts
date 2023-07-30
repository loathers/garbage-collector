import { CombatStrategy, Quest } from "grimoire-kolmafia";
import { GarboTask } from "./tasks/engine";
import { $familiar, $item, $phyla, ChateauMantegna, get, have, TunnelOfLove } from "libram";
import { Macro } from "./combat";
import { freeFightOutfit } from "./outfit";
import { use } from "kolmafia";

function molemanReady() {
  return have($item`molehill mountain`) && !get("_molehillMountainUsed");
}

type GarboFreeFightTask = GarboTask & { combatCount?: number; tentacle?: boolean };

const FreeFightTasks: GarboFreeFightTask[] = [
  {
    name: $item`protonic accelerator pack`.name,
    ready: () =>
      have($item`protonic accelerator pack`) &&
      get("questPAGhost") !== "unstarted" &&
      get("ghostLocation") !== null,
    completed: () => get("questPAGhost") === "unstarted",
    do: () => get("ghostLocation"),
    combat: new CombatStrategy().autoattack(Macro.ghostBustin()),
    outfit: freeFightOutfit({ back: $item`protonic accelerator pack` }),
    tentacle: true,
  },
  {
    name: $item`molehill mountain`.name,
    ready: () => molemanReady() && (get("_thesisDelivered") || !have($familiar`Pocket Professor`)),
    completed: () => !molemanReady(),
    do: () => use($item`molehill mountain`),
    combat: new CombatStrategy().autoattack(Macro.basicCombat()),
    outfit: freeFightOutfit(),
    tentacle: true,
  },
  {
    name: "Tunnel of Love",
    ready: TunnelOfLove.have,
    completed: TunnelOfLove.isUsed,
    do: () =>
      TunnelOfLove.fightAll(
        "LOV Epaulettes",
        "Open Heart Surgery",
        "LOV Extraterrestrial Chocolate",
      ),
    // TODO: Get drops
    combat: new CombatStrategy().autoattack(Macro.basicCombat()),
    outfit: freeFightOutfit(),
    combatCount: 3,
  },
  {
    name: "Chateau Mantegna",
    ready: () =>
      ChateauMantegna.have() &&
      (ChateauMantegna.paintingMonster()?.attributes?.includes("FREE") ?? false),
    completed: ChateauMantegna.paintingFought,
    do: ChateauMantegna.fightPainting,
    tentacle: true,
    combat: new CombatStrategy().autoattack(Macro.basicCombat()),
    outfit: freeFightOutfit(
      have($familiar`Robortender`) &&
        $phyla`elf, fish, hobo, penguin, constellation`.some(
          (phylum) => phylum === ChateauMantegna.paintingMonster()?.phylum,
        )
        ? { familiar: $familiar`Robortender` }
        : {},
    ),
  },
];

export function expectedFights(): number {
  return FreeFightTasks.filter((obj) => (obj.ready?.() ?? true) && !obj.completed()).reduce(
    (acc, obj) => {
      return acc + (obj.combatCount ?? 1);
    },
    0,
  );
}

export const DailyItemsQuest: Quest<GarboTask> = {
  name: "Free Fight",
  tasks: FreeFightTasks,
};

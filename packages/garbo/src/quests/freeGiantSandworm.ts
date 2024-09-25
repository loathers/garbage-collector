import { Outfit, OutfitSpec, Quest } from "grimoire-kolmafia";
import {
  cliExecute,
  create,
  floor,
  getWorkshed,
  mallPrice,
  myAscensions,
  myLightning,
  myPath,
  runCombat,
  use,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $effects,
  $familiar,
  $item,
  $items,
  $path,
  $skill,
  AprilingBandHelmet,
  AsdonMartin,
  clamp,
  get,
  have,
  sum,
} from "libram";
import { GarboStrategy, Macro } from "../combat";
import { globalOptions } from "../config";
import { garboValue } from "../garboValue";
import { freeFightOutfit } from "../outfit";
import { GarboTask } from "../tasks/engine";
import { GarboFreeFightTask } from "../tasks/freeFight";
import { bestFairy } from "../familiar";
import { sober } from "../lib";

function sandwormSpec(spec: OutfitSpec = {}): OutfitSpec {
  const copy = { ...spec, equip: [...(spec.equip ?? [])] };
  // Effective drop rate of spice melange is 0.1, each 1% item drop increases the chance by 0.1/10000
  const itemDropBonus = (0.1 / 10000) * garboValue($item`spice melange`);
  copy.modifier = [`${itemDropBonus.toFixed(2)} Item Drop 10000 max`];
  if (
    have($item`January's Garbage Tote`) &&
    have($item`broken champagne bottle`) &&
    get("garbageChampagneCharge") > 0
  ) {
    copy.equip?.push($item`broken champagne bottle`);
  }
  if (have($item`Lil' Doctor™ bag`) && get("_otoscopeUsed") < 3) {
    copy.equip?.push($item`Lil' Doctor™ bag`);
  }
  const familiar = bestFairy();
  copy.familiar = familiar;
  if (familiar === $familiar`Reagnimated Gnome`) {
    copy.equip?.push($item`gnomish housemaid's kgnee`);
  }
  if (familiar === $familiar`Jill-of-All-Trades`) {
    copy.equip?.push($item`LED candle`);
    copy.modes = { ...copy.modes, jillcandle: "disco" };
  }
  copy.equip = [...new Set(copy.equip)]; // Prune doubled-up stuff
  return copy;
}

function sandwormOutfit(spec: OutfitSpec = {}): Outfit {
  return freeFightOutfit(sandwormSpec(spec));
}

const DEFAULT_SANDWORM_TASK = {
  // GarboTask
  combat: new GarboStrategy(() => Macro.abort()),
  effects: () => [
    ...(have($skill`Emotionally Chipped`) && get("_feelLostUsed") < 3
      ? $effects`Feeling Lost`
      : []),
    ...(have($skill`Steely-Eyed Squint`) && !get("_steelyEyedSquintUsed")
      ? $effects`Steely-Eyed Squint`
      : []),
  ],
  do: () => use($item`drum machine`),
  outfit: sandwormOutfit,
  spendsTurn: false,
  // GarboFreeFightTask
  tentacle: true,
};

function sandwormTask(
  fragment: Omit<GarboFreeFightTask, keyof typeof DEFAULT_SANDWORM_TASK> &
    Partial<Pick<GarboFreeFightTask, keyof typeof DEFAULT_SANDWORM_TASK>>,
) {
  const fullTask = { ...DEFAULT_SANDWORM_TASK, ...fragment };
  return { ...fullTask, limit: { skip: 5 + fullTask.combatCount() } };
}

const NON_SANDWORM_TASK = {
  // GarboTask
  combat: new GarboStrategy(() => Macro.abort()),
  outfit: () => new Outfit(),
  spendsTurn: false,
  // GarboFreeFightTask
  combatCount: () => 0,
  tentacle: false,
};

function nonSandwormTask(
  fragment: Omit<GarboFreeFightTask, keyof typeof NON_SANDWORM_TASK> &
    Partial<Pick<GarboFreeFightTask, keyof typeof NON_SANDWORM_TASK>>,
) {
  const fullTask = { ...NON_SANDWORM_TASK, ...fragment };
  return { ...fullTask, limit: { skip: 1 } };
}

const sandwormMacro = () => Macro.trySingAlong().tryHaveSkill($skill`Otoscope`);

const SandwormTasks: GarboFreeFightTask[] = [
  ...[
    {
      name: "Ensure Beach Access",
      ready: () => get("lastDesertUnlock") !== myAscensions(),
      completed: () =>
        have($item`bitchin' meatcar`) ||
        have($item`Desert Bus pass`) ||
        myPath() === $path`Actually Ed the Undying`,
      do: () => create($item`bitchin' meatcar`),
    },
    {
      name: "Fold broken champagne bottle",
      ready: () =>
        have($item`January's Garbage Tote`) &&
        !have($item`broken champagne bottle`) &&
        get("garbageChampagneCharge") > 0,
      completed: () => have($item`broken champagne bottle`),
      do: () => cliExecute("fold broken champagne bottle"),
    },
  ].map(nonSandwormTask),
  ...[
    {
      name: $skill`Chest X-Ray`.name,
      ready: () => have($item`Lil' Doctor™ bag`),
      completed: () => get("_chestXRayUsed") >= 3,
      combat: new GarboStrategy(() =>
        sandwormMacro().trySkill($skill`Chest X-Ray`),
      ),
      outfit: () => sandwormOutfit({ equip: $items`Lil' Doctor™ bag` }),
      combatCount: () => clamp(3 - get("_chestXRayUsed"), 0, 3),
    },
    {
      name: $item`Apriling band quad tom`.name,
      ready: () => have($item`Apriling band quad tom`),
      completed: () => $item`Apriling band quad tom`.dailyusesleft === 0,
      do: () => {
        AprilingBandHelmet.play("Apriling band quad tom");
        visitUrl("main.php");
        return runCombat();
      },
      combat: new GarboStrategy(() => sandwormMacro().basicCombat()),
      combatCount: () => $item`Apriling band quad tom`.dailyusesleft,
    },
    {
      name: $skill`Asdon Martin: Missile Launcher`.name,
      ready: () => getWorkshed() === $item`Asdon Martin keyfob (on ring)`,
      completed: () => get("_missileLauncherUsed"),
      prepare: () => AsdonMartin.fillTo(100),
      combat: new GarboStrategy(() =>
        sandwormMacro().trySkill($skill`Asdon Martin: Missile Launcher`),
      ),
      combatCount: () => (!get("_missileLauncherUsed") ? 1 : 0),
    },
    {
      name: $skill`Gingerbread Mob Hit`.name,
      ready: () => have($skill`Gingerbread Mob Hit`),
      completed: () => get("_gingerbreadMobHitUsed"),
      combat: new GarboStrategy(() =>
        sandwormMacro().trySkill($skill`Gingerbread Mob Hit`),
      ),
      combatCount: () => (!get("_gingerbreadMobHitUsed") ? 1 : 0),
    },
    {
      name: $skill`Shattering Punch`.name,
      ready: () => have($skill`Shattering Punch`),
      completed: () => get("_shatteringPunchUsed") >= 3,
      combat: new GarboStrategy(() =>
        sandwormMacro().trySkill($skill`Shattering Punch`),
      ),
      combatCount: () => clamp(3 - get("_shatteringPunchUsed"), 0, 3),
    },
    {
      name: $item`replica bat-oomerang`.name,
      ready: () => have($item`replica bat-oomerang`),
      completed: () => get("_usedReplicaBatoomerang") >= 3,
      combat: new GarboStrategy(() =>
        sandwormMacro().tryItem($item`replica bat-oomerang`),
      ),
      combatCount: () => clamp(3 - get("_usedReplicaBatoomerang"), 0, 3),
    },
    {
      name: $skill`Shocking Lick`.name,
      ready: () => globalOptions.ascend && get("shockingLickCharges") > 0,
      completed: () => get("shockingLickCharges") === 0,
      combat: new GarboStrategy(() =>
        sandwormMacro().trySkill($skill`Shocking Lick`),
      ),
      combatCount: () => get("shockingLickCharges"),
    },
    {
      name: $skill`Lightning Strike`.name,
      ready: () => have($skill`Lightning Strike`) && myLightning() >= 20,
      completed: () => myLightning() < 20,
      combat: new GarboStrategy(() =>
        sandwormMacro().trySkill($skill`Lightning Strike`),
      ),
      combatCount: () => floor(myLightning() / 20),
    },
    {
      name: $skill`Free-For-All`.name,
      ready: () => have($skill`Free-For-All`),
      completed: () => have($effect`Everything Looks Red`),
      combat: new GarboStrategy(() =>
        sandwormMacro().trySkill($skill`Free-For-All`),
      ),
      combatCount: () => (!have($effect`Everything Looks Red`) ? 1 : 0),
    },
    {
      name: "Yellow Ray",
      ready: () => have($skill`Fondeluge`) || have($item`Jurassic Parka`),
      completed: () => have($effect`Everything Looks Yellow`),
      combat: new GarboStrategy(() =>
        sandwormMacro()
          .tryHaveSkill($skill`Fondeluge`)
          .trySkill($skill`Spit jurassic acid`),
      ),
      outfit: () =>
        sandwormOutfit(
          have($skill`Fondeluge`)
            ? {}
            : have($item`Jurassic Parka`)
              ? {
                  shirt: $items`Jurassic Parka`,
                  modes: { parka: "dilophosaur" },
                }
              : {},
        ),
      combatCount: () => (!have($effect`Everything Looks Yellow`) ? 1 : 0),
    },
  ].map(sandwormTask),
  ...[
    {
      name: "Fold wad of used tape",
      ready: () => have($item`January's Garbage Tote`),
      completed: () => have($item`wad of used tape`),
      do: () => cliExecute("fold wad of used tape"),
    },
  ].map(nonSandwormTask),
];

// Expected free sandworm fights, not including tentacles
export function expectedFreeGiantSandwormQuestFights(): number {
  const availableFights = SandwormTasks.filter(
    (task) => (task.ready?.() ?? true) && !task.completed(),
  );
  return sum(availableFights, ({ combatCount }) => combatCount());
}

// Possible additional free fights from tentacles
export function possibleFreeGiantSandwormQuestTentacleFights(): number {
  const availableFights = SandwormTasks.filter(
    (task) => (task.ready?.() ?? true) && !task.completed(),
  );
  return sum(
    availableFights,
    ({ combatCount, tentacle }) => combatCount() * (tentacle ? 1 : 0),
  );
}

//  Use free fights on melanges if prices are reasonable
export const FreeGiantSandwormQuest: Quest<GarboTask> = {
  name: "Free Giant Sandworm",
  tasks: SandwormTasks,
  ready: () =>
    sober() &&
    expectedFreeGiantSandwormQuestFights() > 0 &&
    mallPrice($item`drum machine`) < 0.01 * mallPrice($item`spice melange`),
};

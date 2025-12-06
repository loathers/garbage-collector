import { Outfit, OutfitSpec, Quest } from "grimoire-kolmafia";
import {
  cliExecute,
  create,
  familiarWeight,
  floor,
  getWorkshed,
  haveEquipped,
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
  getModifier,
  have,
  set,
  sum,
  uneffect,
} from "libram";
import { Macro } from "../combat";
import { GarboStrategy } from "../combatStrategy";
import { globalOptions } from "../config";
import { garboValue } from "../garboValue";
import { freeFightOutfit } from "../outfit";
import { GarboTask } from "./engine";
import { GarboFreeFightTask } from "./freeFight";
import { sandwormFamiliar } from "../familiar";
import { sober } from "../lib";
import { safeSweatBulletCasts } from "../resources";

function sandwormSpec(spec: OutfitSpec = {}): OutfitSpec {
  const outfit = Outfit.from(
    spec,
    new Error(`Failed to construct outfit from spec ${JSON.stringify(spec)}`),
  );

  const itemDropBonus = (0.1 / 10000) * garboValue($item`spice melange`);
  outfit.modifier.push(`${itemDropBonus.toFixed(2)} Item Drop 10000 max`);

  if (
    have($item`January's Garbage Tote`) &&
    have($item`broken champagne bottle`) &&
    get("garbageChampagneCharge") > 0
  ) {
    outfit.equip($item`broken champagne bottle`);
  }
  if (have($item`Lil' Doctor™ bag`) && get("_otoscopeUsed") < 3) {
    outfit.equip($item`Lil' Doctor™ bag`);
  }

  outfit.equip(sandwormFamiliar());
  if (outfit.familiar === $familiar`Reagnimated Gnome`) {
    outfit.addBonus(
      $item`gnomish housemaid's kgnee`,
      (familiarWeight($familiar`Reagnimated Gnome`) * get("valueOfAdventure")) /
        1000,
    );
  }

  if (outfit.familiar === $familiar`Jill-of-All-Trades`) {
    outfit.setModes({ jillcandle: "disco" });
  }

  if (outfit.familiar === $familiar`Skeleton of Crimbo Past`) {
    outfit.equip($item`small peppermint-flavored sugar walking crook`);
  }

  outfit.equip($item`toy Cupid bow`);

  return outfit.spec();
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
  return { ...fullTask, limit: { skip: 20 } };
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
      do: () => {
        set("_garbageItemChanged", true);
        return cliExecute("fold broken champagne bottle");
      },
    },
  ].map(nonSandwormTask),
  ...[
    {
      name: $skill`Chest X-Ray`.name,
      ready: () => drumMachineWorthIt() && have($item`Lil' Doctor™ bag`),
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
      ready: () =>
        drumMachineWorthIt() &&
        getWorkshed() === $item`Asdon Martin keyfob (on ring)`,
      completed: () => get("_missileLauncherUsed"),
      prepare: () => AsdonMartin.fillTo(100),
      combat: new GarboStrategy(() =>
        sandwormMacro().trySkill($skill`Asdon Martin: Missile Launcher`),
      ),
      combatCount: () => (!get("_missileLauncherUsed") ? 1 : 0),
    },
    {
      name: $skill`Gingerbread Mob Hit`.name,
      ready: () => drumMachineWorthIt() && have($skill`Gingerbread Mob Hit`),
      completed: () => get("_gingerbreadMobHitUsed"),
      combat: new GarboStrategy(() =>
        sandwormMacro().trySkill($skill`Gingerbread Mob Hit`),
      ),
      combatCount: () => (!get("_gingerbreadMobHitUsed") ? 1 : 0),
    },
    {
      name: $skill`Shattering Punch`.name,
      ready: () => drumMachineWorthIt() && have($skill`Shattering Punch`),
      completed: () => get("_shatteringPunchUsed") >= 3,
      combat: new GarboStrategy(() =>
        sandwormMacro().trySkill($skill`Shattering Punch`),
      ),
      combatCount: () => clamp(3 - get("_shatteringPunchUsed"), 0, 3),
    },
    {
      name: $item`replica bat-oomerang`.name,
      ready: () => drumMachineWorthIt() && have($item`replica bat-oomerang`),
      completed: () => get("_usedReplicaBatoomerang") >= 3,
      combat: new GarboStrategy(() =>
        sandwormMacro().tryItem($item`replica bat-oomerang`),
      ),
      combatCount: () => clamp(3 - get("_usedReplicaBatoomerang"), 0, 3),
    },
    {
      name: $skill`Shocking Lick`.name,
      ready: () =>
        drumMachineWorthIt() &&
        globalOptions.ascend &&
        get("shockingLickCharges") > 0,
      completed: () => get("shockingLickCharges") === 0,
      combat: new GarboStrategy(() =>
        sandwormMacro().trySkill($skill`Shocking Lick`),
      ),
      combatCount: () => get("shockingLickCharges"),
    },
    {
      name: $skill`Lightning Strike`.name,
      ready: () =>
        drumMachineWorthIt() &&
        have($skill`Lightning Strike`) &&
        myLightning() >= 20,
      completed: () => myLightning() < 20,
      combat: new GarboStrategy(() =>
        sandwormMacro().trySkill($skill`Lightning Strike`),
      ),
      combatCount: () => floor(myLightning() / 20),
    },
    {
      name: $skill`Free-For-All`.name,
      ready: () => drumMachineWorthIt() && have($skill`Free-For-All`),
      completed: () => have($effect`Everything Looks Red`),
      combat: new GarboStrategy(() =>
        sandwormMacro().trySkill($skill`Free-For-All`),
      ),
      combatCount: () => (!have($effect`Everything Looks Red`) ? 1 : 0),
    },
    {
      name: $item`shadow brick`.name,
      ready: () => drumMachineROI() > mallPrice($item`shadow brick`),
      completed: () => get("_shadowBricksUsed") >= 13,
      combat: new GarboStrategy(() =>
        sandwormMacro().tryItem($item`shadow brick`),
      ),
      combatCount: () =>
        drumMachineROI() > mallPrice($item`shadow brick`)
          ? clamp(13 - get("_shadowBricksUsed"), 0, 13)
          : 0,
      acquire: () => [{ item: $item`shadow brick`, price: drumMachineROI() }],
    },
    {
      name: $skill`BCZ: Sweat Bullets`.name,
      ready: () =>
        have($item`blood cubic zirconia`) &&
        safeSweatBulletCasts(drumMachineROI()) >= 0,
      completed: () => safeSweatBulletCasts(drumMachineROI()) <= 0,
      combat: new GarboStrategy(() =>
        sandwormMacro().trySkill($skill`BCZ: Sweat Bullets`),
      ),
      outfit: () => sandwormOutfit({ equip: $items`blood cubic zirconia` }),
      combatCount: () => safeSweatBulletCasts(drumMachineROI()),
    },
    {
      name: "Yellow Ray",
      ready: () =>
        drumMachineWorthIt() &&
        (have($skill`Fondeluge`) || have($item`Jurassic Parka`)),
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
      do: () => {
        set("_garbageItemChanged", true);
        return cliExecute("fold wad of used tape");
      },
    },
    {
      name: "Uneffect Feeling Lost",
      ready: () => have($effect`Feeling Lost`),
      completed: () => !have($effect`Feeling Lost`),
      do: () => uneffect($effect`Feeling Lost`),
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

let _hasWorms: boolean;
function hasWorms(): boolean {
  return (_hasWorms ??= expectedFreeGiantSandwormQuestFights() > 0);
}

const REJECTION = 1 / 10;
const BASE_RATE = 1 / 100;
let _drumMachineROI: number;
function drumMachineROI(): number {
  if (_drumMachineROI === undefined) {
    sandwormOutfit().dress();
    const squint =
      have($skill`Steely-Eyed Squint`) && !have($effect`Steely-Eyed Squint`)
        ? 2
        : 1;
    const dropRate = clamp(
      BASE_RATE * (1 + (getModifier("Item Drop") * squint) / 100),
      0,
      1,
    );

    const rate =
      REJECTION *
      (1 - (1 - dropRate) ** (haveEquipped($item`toy Cupid bow`) ? 2 : 1));

    _drumMachineROI =
      rate * garboValue($item`spice melange`) +
      globalOptions.prefs.valueOfFreeFight -
      mallPrice($item`drum machine`);
  }
  return _drumMachineROI;
}

function drumMachineWorthIt(): boolean {
  return drumMachineROI() > 0;
}

//  Use free fights on melanges if prices are reasonable
export const FreeGiantSandwormQuest: Quest<GarboTask> = {
  name: "Free Giant Sandworm",
  tasks: SandwormTasks,
  ready: () => sober() && hasWorms(),
};

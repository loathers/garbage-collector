import {
  availableAmount,
  canEquip,
  haveEquipped,
  Item,
  itemAmount,
  Location,
  mallPrice,
  myAdventures,
  myAscensions,
  retrieveItem,
  runChoice,
  use,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $location,
  ChestMimic,
  clamp,
  ensureEffect,
  get,
  have,
  maxBy,
  PeridotOfPeril,
  realmAvailable,
  set,
  sum,
  undelay,
  withProperty,
} from "libram";
import { getTasks, OutfitSpec, Quest } from "grimoire-kolmafia";
import { getAvailableUltraRareZones, unperidotableZones } from "garbo-lib";

import { Macro } from "../../combat";
import { GarboStrategy } from "../../combatStrategy";
import { globalOptions } from "../../config";
import { wanderer } from "../../garboWanderer";
import { getBestLuckyAdventure, sober, willDrunkAdventure } from "../../lib";
import { freeFightOutfit, meatTargetOutfit } from "../../outfit";
import { wanderingCopytargetsRemaining } from "../../turns";

import { AlternateTask, GarboTask } from "../engine";
import { canContinue } from "./lib";
import { garboValue } from "../../garboValue";
import { minimumMimicExperience } from "../../resources";
import { acquire } from "../../acquire";
import {
  hotTubAvailable,
  lavaDogsAccessible,
  lavaDogsComplete,
  luckySourceTasks,
} from "../../resources";
import { yachtzeeQuest } from "../yachtzee";
import { embezzlerFightTask } from "../embezzler";

function dailyDungeon(additionalReady: () => boolean) {
  return {
    completed: () => get("dailyDungeonDone"),
    ready: () =>
      additionalReady() &&
      garboValue($item`fat loot token`) >
        get("valueOfAdventure") *
          clamp(15 - get("_lastDailyDungeonRoom"), 0, 3),
    choices: () => ({
      689: 1,
      690: 2,
      691:
        haveEquipped($item`candy cane sword cane`) &&
        !get("candyCaneSwordDailyDungeon")
          ? 4
          : 2,
      692: 3,
      693: 2,
    }),
    acquire:
      $items`ring of Detect Boring Doors, eleven-foot pole, Pick-O-Matic lockpicks`.map(
        (i) => ({ item: i }),
      ),
    do: $location`The Daily Dungeon`,
    combat: new GarboStrategy(() => Macro.kill()),
    turns: () => clamp(15 - get("_lastDailyDungeonRoom"), 0, 3),
    outfit: { equip: $items`candy cane sword cane` },
    spendsTurn: true,
  };
}

function lavaDogs(additionalReady: () => boolean, baseSpec: OutfitSpec) {
  return {
    completed: () => lavaDogsComplete(),
    ready: () =>
      additionalReady() &&
      globalOptions.ascend &&
      lavaDogsAccessible() &&
      garboValue($item`Volcoino`) >
        6 * get("valueOfAdventure") +
          (hotTubAvailable()
            ? 0
            : mallPrice($item`soft green echo eyedrop antidote`)) &&
      $items`June cleaver, Space Trip safety headphones`.some(
        (i) => have(i) && canEquip(i),
      ),
    prepare: () => {
      const metalValue = get("_volcanoSuperduperheatedMetal")
        ? garboValue($item`superheated metal`)
        : sum(
            [
              [$item`superheated metal`, 0.95],
              [$item`superduperheated metal`, 0.05],
            ] as const,
            ([item, rate]) => rate * garboValue(item),
          );
      if (metalValue > mallPrice($item`heat-resistant sheet metal`)) {
        acquire(1, $item`heat-resistant sheet metal`, metalValue);
      }
    },
    do: $location`The Bubblin' Caldera`,
    outfit: () => {
      const avoid = $items`carnivorous potted plant, mutant crown, mutant arm, mutant legs, shield of the Skeleton Lord`;
      if (!have($effect`Drenched in Lava`)) return baseSpec;
      const weapon = have($item`June cleaver`) ? $item`June cleaver` : [];
      const modifier = ["Muscle"];
      if (!have($item`June cleaver`)) modifier.push(`-7 Monster Level`);

      return freeFightOutfit(
        { ...baseSpec, modifier, weapon, avoid },
        $location`The Bubblin' Caldera`,
      );
    },
    combat: new GarboStrategy(() => Macro.kill()),
    turns: () => clamp(7 - $location`The Bubblin' Caldera`.turnsSpent, 0, 7),
    spendsTurn: true,
  };
}

function luckyTasks(
  sobriety: "sober" | "drunk",
  additionalReady: () => boolean,
): AlternateTask[] {
  return [
    {
      name: `Lucky Adventure (${sobriety})`,
      completed: () => !have($effect`Lucky!`),
      ready: () => additionalReady(),
      do: () => getBestLuckyAdventure().location,
      outfit: () =>
        sobriety === "drunk" ? { offhand: $item`Drunkula's wineglass` } : {},
      combat: new GarboStrategy(() =>
        Macro.abortWithMsg(
          "Unexpected combat while attempting Lucky! adventure",
        ),
      ),
      sobriety,
      spendsTurn: true,
      turns: 0, // Turns spent is handled by Lucky Sources
    },
    {
      ...embezzlerFightTask,
      name: `Lucky Embezzler (${sobriety})`,
      ready: () => additionalReady() && embezzlerFightTask.ready(),
    },
    ...luckySourceTasks.map((task) => ({
      ...task,
      ready: () =>
        additionalReady() &&
        getBestLuckyAdventure().phase === "barf" &&
        getBestLuckyAdventure().value() > get("valueOfAdventure") &&
        task.ready(),
    })),
  ];
}

function vampOut(additionalReady: () => boolean) {
  return {
    ready: () =>
      additionalReady() &&
      have($item`plastic vampire fangs`) &&
      garboValue($item`Interview With You (a Vampire)`) >
        get("valueOfAdventure"),
    completed: () => get("_interviewMasquerade"),
    choices: () => ({
      546: 12,
    }),
    do: () => {
      visitUrl("place.php?whichplace=town&action=town_vampout");
      runChoice(-1);
    },
    outfit: () =>
      freeFightOutfit(
        {
          equip: $items`plastic vampire fangs`,
        },
        Location.none,
      ),
    spendsTurn: true,
    turns: () => 1,
  };
}

let bestDupeItem: Item | null = null;
function getBestDupeItem(): Item {
  if (bestDupeItem === null || !have(bestDupeItem)) {
    // Machine elf can dupe PVPable food, booze, spleen item or potion
    const validItems = Item.all().filter(
      (i) =>
        i.tradeable &&
        i.discardable &&
        (i.inebriety || i.fullness || i.potion || i.spleen) &&
        have(i),
    );
    if (
      globalOptions.prefs.dmtDupeItem &&
      validItems.includes(globalOptions.prefs.dmtDupeItem)
    ) {
      bestDupeItem = globalOptions.prefs.dmtDupeItem;
    } else {
      bestDupeItem = maxBy(validItems, garboValue);
    }
  }
  return bestDupeItem;
}

function canForceNoncombat() {
  return (
    get("noncombatForcerActive") ||
    (!get("_claraBellUsed") && have($item`Clara's bell`))
  );
}

function canGetFusedFuse() {
  return (
    realmAvailable("hot") &&
    ([1, 2, 3] as const).some(
      (it) => get(`_volcanoItem${it}`) === $item`fused fuse`.id,
    ) &&
    canForceNoncombat()
  );
}

const peridotZone = () =>
  getAvailableUltraRareZones().find(
    (l) => PeridotOfPeril.canImperil(l) && !unperidotableZones.includes(l),
  );

const NonBarfTurnTasks: AlternateTask[] = [
  {
    name: "Make Mimic Eggs (whatever we can)",
    ready: () => have($familiar`Chest Mimic`),
    completed: () =>
      get("_mimicEggsObtained") >= 11 ||
      $familiar`Chest Mimic`.experience < minimumMimicExperience(),
    do: () => {
      if (!ChestMimic.differentiableQuantity(globalOptions.target)) {
        ChestMimic.receive(globalOptions.target);
      }
      ChestMimic.differentiate(globalOptions.target);
    },
    outfit: () => meatTargetOutfit({ familiar: $familiar`Chest Mimic` }),
    combat: new GarboStrategy(() => Macro.meatKill()),
    turns: () =>
      globalOptions.ascend
        ? clamp(
            Math.floor($familiar`Chest Mimic`.experience / 50) - 1,
            1,
            11 - get("_mimicEggsObtained"),
          )
        : 0,
    spendsTurn: () => !globalOptions.target.attributes.includes("FREE"),
  },
  {
    name: "Machine Elf Dupe",
    ready: () =>
      have($familiar`Machine Elf`) &&
      // Dupe at end of day even if not ascending, encountersUntilDMTChoice does not reset on rollover
      willDrunkAdventure() === !sober() &&
      get("encountersUntilDMTChoice") === 0 &&
      garboValue(getBestDupeItem()) > get("valueOfAdventure"),
    completed: () => get("lastDMTDuplication") === myAscensions(),
    do: $location`The Deep Machine Tunnels`,
    prepare: () => {
      if (itemAmount(getBestDupeItem()) === 0) {
        withProperty("autoSatisfyWithMall", false, () =>
          retrieveItem(getBestDupeItem()),
        );
      }
    },
    outfit: () =>
      sober()
        ? {
            avoid: $items`Kramco Sausage-o-Matic™`,
            familiar: $familiar`Machine Elf`,
          }
        : {
            offhand: $item`Drunkula's wineglass`,
            familiar: $familiar`Machine Elf`,
          },
    combat: new GarboStrategy(() =>
      Macro.abortWithMsg("Hit unexpected combat!"),
    ),
    turns: () => 1,
    spendsTurn: true,
    choices: () => ({ 1119: 4, 1125: `1&iid=${getBestDupeItem().id}` }),
  },
  {
    name: "Lava Dogs (drunk)",
    ...lavaDogs(() => willDrunkAdventure(), {
      offhand: $item`Drunkula's wineglass`,
    }),
    sobriety: "drunk",
  },
  {
    name: "Lava Dogs (sober)",
    ...lavaDogs(() => !willDrunkAdventure(), {}),
    sobriety: "sober",
  },
  ...getTasks(yachtzeeQuest), // Use NC forces and adventure to get the Yachtzee NC
  {
    name: "Daily Dungeon (drunk)",
    ...dailyDungeon(() => willDrunkAdventure()),
    outfit: () =>
      freeFightOutfit(
        {
          offhand: $item`Drunkula's wineglass`,
          equip: $items`ring of Detect Boring Doors`,
        },
        $location`The Daily Dungeon`,
      ),
    sobriety: "drunk",
  },
  {
    name: "Daily Dungeon (sober)",
    ...dailyDungeon(() => !willDrunkAdventure()),
    outfit: () =>
      freeFightOutfit(
        {
          equip: $items`ring of Detect Boring Doors`,
        },
        $location`The Daily Dungeon`,
      ),
    sobriety: "sober",
  },
  {
    name: "Vamp Out (drunk)",
    ...vampOut(() => willDrunkAdventure()),
    sobriety: "drunk",
  },
  {
    name: "Vamp Out (sober)",
    ...vampOut(() => !willDrunkAdventure()),
    sobriety: "sober",
  },
  {
    name: "Fused Fuse",
    completed: () => get("_volcanoItemRedeemed"),
    ready: canGetFusedFuse,
    do: $location`LavaCo™ Lamp Factory`,
    prepare: () => get("noncombatForcerActive") || use($item`Clara's bell`),
    post: () => {
      visitUrl("place.php?whichplace=airport_hot&action=airport4_questhub");
      const option = ([1, 2, 3] as const).find(
        (it) => get(`_volcanoItem${it}`) === $item`fused fuse`.id,
      );
      if (option) runChoice(option);
      visitUrl("main.php");
    },
    outfit: () =>
      sober()
        ? { avoid: $items`Kramco Sausage-o-Matic™` }
        : { offhand: $item`Drunkula's wineglass` },
    combat: new GarboStrategy(() =>
      Macro.abortWithMsg("Hit unexpected combat!"),
    ),
    turns: () => 1,
    spendsTurn: true,
    choices: { 1091: 7 },
  },
  ...luckyTasks("sober", () => !willDrunkAdventure()),
  ...luckyTasks("drunk", () => willDrunkAdventure()),
  {
    name: "Map for Pills",
    completed: () =>
      availableAmount($item`Map to Safety Shelter Grimace Prime`) === 0,
    choices: () => ({
      536:
        availableAmount($item`distention pill`) <
        availableAmount($item`synthetic dog hair pill`) +
          availableAmount($item`Map to Safety Shelter Grimace Prime`)
          ? 1
          : 2,
    }),
    do: () =>
      withProperty("choiceAdventureScript", "", () => {
        ensureEffect($effect`Transpondent`);
        use($item`Map to Safety Shelter Grimace Prime`);
        return true;
      }),
    spendsTurn: true,
    sobriety: "drunk",
    turns: () => availableAmount($item`Map to Safety Shelter Grimace Prime`),
  },
  {
    name: "Peridot Fish for UR",
    ready: () =>
      have($item`Peridot of Peril`) && !(willDrunkAdventure() && sober()),
    completed: () => !peridotZone(),
    do: peridotZone,
    outfit: () =>
      freeFightOutfit(
        sober()
          ? { acc1: $item`Peridot of Peril` }
          : {
              acc1: $item`Peridot of Peril`,
              offhand: $item`Drunkula's wineglass`,
            },
        peridotZone() ?? Location.none,
      ),
    turns: () => (peridotZone() ? 1 : 0),
    spendsTurn: false,
    combat: new GarboStrategy(() => Macro.kill()),
    choices: () => ({
      ...wanderer().getChoices(peridotZone() ?? $location.none),
      1557: 2,
    }),
  },
  {
    name: "Use Day Shorteners (drunk)",
    ready: () =>
      globalOptions.ascend &&
      garboValue($item`extra time`) >
        mallPrice($item`day shortener`) + 5 * get("valueOfAdventure"),
    completed: () => get(`_garboDayShortenersUsed`, 0) >= 3, // Arbitrary cap at 3, since using 3 results in only 1 adventure
    do: () => {
      if (
        acquire(
          1,
          $item`day shortener`,
          garboValue($item`extra time`) - 5 * get("valueOfAdventure"),
          false,
        )
      ) {
        use($item`day shortener`);
      }
      set(`_garboDayShortenersUsed`, get(`_garboDayShortenersUsed`, 0) + 1);
    },
    spendsTurn: true,
    sobriety: "drunk",
    turns: () => 5 * (3 - get(`_garboDayShortenersUsed`, 0)),
  },
  {
    name: "Use Day Shorteners (sober)",
    ready: () =>
      !globalOptions.ascend &&
      garboValue($item`extra time`) >
        mallPrice($item`day shortener`) + 5 * get("valueOfAdventure"),
    completed: () => get(`_garboDayShortenersUsed`, 0) >= 3, // Arbitrary cap at 3, since using 3 results in only 1 adventure
    do: () => {
      if (
        acquire(
          1,
          $item`day shortener`,
          garboValue($item`extra time`) - 5 * get("valueOfAdventure"),
          false,
        )
      ) {
        use($item`day shortener`);
      }
      set(`_garboDayShortenersUsed`, get(`_garboDayShortenersUsed`, 0) + 1);
    },
    spendsTurn: true,
    sobriety: "sober",
    turns: () => 5 * (3 - get(`_garboDayShortenersUsed`, 0)),
  },
];

function nonBarfTurns(): number {
  return sum(
    NonBarfTurnTasks.filter((t) => (t.ready?.() ?? true) && !t.completed()),
    (t) => undelay(t.turns),
  );
}

let startedNonBarf: boolean = false;
export const NonBarfTurnQuest: Quest<GarboTask> = {
  name: "Non Barf Turn",
  tasks: NonBarfTurnTasks,
  ready: () => {
    if (!startedNonBarf) {
      startedNonBarf =
        clamp(
          myAdventures() - wanderingCopytargetsRemaining(),
          1,
          myAdventures(),
        ) <=
        nonBarfTurns() + globalOptions.saveTurns;
    }
    return startedNonBarf;
  },

  completed: () => !canContinue(),
};

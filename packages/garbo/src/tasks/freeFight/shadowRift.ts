import { OutfitSpec, Quest } from "grimoire-kolmafia";
import {
  getMonsters,
  haveEffect,
  Item,
  itemAmount,
  myAdventures,
  setLocation,
  use,
  useSkill,
} from "kolmafia";
import {
  $effect,
  $item,
  $items,
  $location,
  $skill,
  CinchoDeMayo,
  ClosedCircuitPayphone,
  get,
  getAcquirePrice,
  have,
  maxBy,
  sum,
} from "libram";
import { acquire } from "../../acquire";
import { Macro } from "../../combat";
import { GarboStrategy } from "../../combatStrategy";
import {
  aprilFoolsRufus,
  bestShadowRift,
  felizValue,
  freeRest,
  questStep,
  sober,
  valueDrops,
} from "../../lib";
import { freeFightOutfit } from "../../outfit/free";
import { rufusPotion } from "../../potions";
import {
  noncombatForcerOpportunityCost,
  shouldClara,
  willYachtzee,
} from "../../resources/yachtzee";
import { highMeatMonsterCount } from "../../turns";
import { MappingTask } from "../engine";
import { freeFightTask } from "./lib";

const lodestone = $item`Rufus's shadow lodestone`;
const affinity = $effect`Shadow Affinity`;

function shadowWatersWorth(cost: number) {
  return rufusPotion
    .value(highMeatMonsterCount())
    .some((tier) => tier.value > cost);
}

type RiftForcer = {
  name: string;
  available: () => boolean;
  cost: () => number;
  spec: OutfitSpec;
  prepare: () => void;
  macro?: () => Macro;
};

const forcers: RiftForcer[] = [
  {
    name: "Clara's Bell",
    // Preserve the volcano/party reservations, but price yachtzee explicitly.
    available: () =>
      shouldClara("shadow waters") ||
      (willYachtzee() && shouldClara("yachtzee")),
    cost: noncombatForcerOpportunityCost,
    spec: {},
    prepare: () => {
      use($item`Clara's bell`);
    },
  },
  {
    name: "Cincho",
    available: () =>
      CinchoDeMayo.have() && CinchoDeMayo.totalAvailableCinch() >= 60,
    cost: () => Math.max(noncombatForcerOpportunityCost(), 36 * felizValue()),
    spec: { equip: $items`Cincho de Mayo` },
    prepare: () => {
      while (CinchoDeMayo.currentCinch() < 60) {
        if (!freeRest()) throw new Error("We are out of free rests!");
      }
      useSkill($skill`Cincho: Fiesta Exit`);
    },
  },
  {
    name: "Spikolodon",
    available: () =>
      have($item`Jurassic Parka`) &&
      get("_spikolodonSpikeUses") < 5 &&
      have(affinity) &&
      get("encountersUntilSRChoice") >= 2,
    cost: noncombatForcerOpportunityCost,
    spec: { shirt: $item`Jurassic Parka`, modes: { parka: "spikolodon" } },
    prepare: () => {},
    macro: () => Macro.skill($skill`Launch spikolodon spikes`).basicCombat(),
  },
];

function bestForcer() {
  const available = forcers.filter((forcer) => forcer.available());
  return available.length ? maxBy(available, (forcer) => -forcer.cost()) : null;
}

function artifactCost() {
  if (get("encountersUntilSRChoice") === 0 || get("noncombatForcerActive")) {
    return 0;
  }
  // The Labyrinth consumes neither a turn nor Shadow Affinity. Spikes consume
  // an Affinity combat, but we still receive that combat's rewards.
  return bestForcer()?.cost() ?? Infinity;
}

function riftLocation() {
  const target = ClosedCircuitPayphone.rufusTarget();
  if (
    get("rufusQuestType") === "items" &&
    target instanceof Item &&
    itemAmount(target) < 3
  ) {
    return (
      ClosedCircuitPayphone.chooseRift({
        canAdventure: true,
        drops: [target],
        otherFilter: (location) =>
          location !== $location`Shadow Rift (The 8-Bit Realm)`,
        sortBy: (location) => sum(getMonsters(location), valueDrops),
      }) ?? bestShadowRift()
    );
  }
  return bestShadowRift();
}

const riftTask = (
  fragment: Omit<Parameters<typeof freeFightTask>[0], "adventure">,
) =>
  freeFightTask({
    adventure: riftLocation,
    outfit: () => freeFightOutfit({}, riftLocation()),
    ...fragment,
  });

const commonChoices = { 1500: 2 }; // Shadow Waters

function shadowRiftTasks(): MappingTask[] {
  let acceptedItemQuest = false;
  return [
    {
      name: "Submit Rufus Quest",
      mapSafe: true,
      completed: () => questStep("questRufus") !== 1,
      do: () => {
        ClosedCircuitPayphone.submitQuest();
      },
      spendsTurn: false,
    },
    riftTask({
      name: "Collect Shadow Waters",
      ready: () => have(lodestone),
      completed: () => !have(lodestone),
      choices: commonChoices,
      do: riftLocation,
      tentacle: false,
    }),
    {
      name: "Accept Rufus Quest",
      mapSafe: true,
      ready: () =>
        !ClosedCircuitPayphone.rufusTarget() &&
        (!get("_shadowAffinityToday") ||
          have(affinity) ||
          artifactCost() === 0 ||
          shadowWatersWorth(artifactCost())),
      completed: () => ClosedCircuitPayphone.rufusTarget() !== null,
      do: () => {
        ClosedCircuitPayphone.chooseQuest(({ items }) => {
          const itemCost = 3 * getAcquirePrice(items);
          acceptedItemQuest =
            items !== $item.none &&
            itemCost < artifactCost() &&
            shadowWatersWorth(itemCost);
          return acceptedItemQuest ? 3 : 2;
        });
        aprilFoolsRufus();
      },
      spendsTurn: false,
    },
    {
      name: "Acquire Rufus Quest Items",
      mapSafe: true,
      ready: () => {
        const target = ClosedCircuitPayphone.rufusTarget();
        return (
          get("rufusQuestType") === "items" &&
          target instanceof Item &&
          (acceptedItemQuest || !have(affinity)) &&
          shadowWatersWorth(3 * getAcquirePrice(target))
        );
      },
      completed: () => {
        const target = ClosedCircuitPayphone.rufusTarget();
        return !(target instanceof Item) || itemAmount(target) >= 3;
      },
      do: () => {
        const target = ClosedCircuitPayphone.rufusTarget();
        if (!(target instanceof Item)) {
          throw new Error("Rufus no longer wants items");
        }
        acquire(3, target, getAcquirePrice(target));
      },
      spendsTurn: false,
    },
    riftTask({
      name: "Visit Shadow Labyrinth",
      ready: () =>
        get("rufusQuestType") !== "entity" &&
        (get("encountersUntilSRChoice") === 0 || get("noncombatForcerActive")),
      completed: () =>
        get("encountersUntilSRChoice") > 0 && !get("noncombatForcerActive"),
      do: riftLocation,
      tentacle: false,
    }),
    ...forcers.map((forcer) =>
      riftTask({
        name: `Shadow Rift (${forcer.name})`,
        ready: () =>
          get("rufusQuestType") === "artifact" &&
          get("encountersUntilSRChoice") > 0 &&
          !get("noncombatForcerActive") &&
          forcer.available() &&
          bestForcer() === forcer &&
          shadowWatersWorth(forcer.cost()),
        completed: () => questStep("questRufus") === 1,
        choices: commonChoices,
        outfit: () => {
          const outfit = freeFightOutfit(forcer.spec, riftLocation());
          // freeFightOutfit defaults the parka to dilophosaur.
          outfit.setModes(forcer.spec.modes ?? {});
          return outfit;
        },
        prepare: forcer.prepare,
        do: riftLocation,
        combat: new GarboStrategy(
          () => forcer.macro?.() ?? Macro.basicCombat(),
        ),
        tentacle: forcer.macro !== undefined,
        combatCount: () =>
          forcer === forcers[2]
            ? Math.max(0, 5 - get("_spikolodonSpikeUses"))
            : 0,
        limit: {
          skip:
            forcer === forcers[2]
              ? 5
              : forcer === forcers[1]
                ? Math.floor(CinchoDeMayo.totalAvailableCinch() / 60) + 5
                : 6,
        },
      }),
    ),
    riftTask({
      name: "Shadow Affinity Combat",
      ready: () =>
        have(affinity) &&
        get("encountersUntilSRChoice") > 0 &&
        !(get("rufusQuestType") === "entity" && get("noncombatForcerActive")),
      completed: () => !have(affinity),
      choices: commonChoices,
      do: riftLocation,
      tentacle: true,
      combatCount: () => haveEffect(affinity),
      post: () => {
        if (!have(affinity)) setLocation($location.none);
      },
    }),
  ];
}

export function shadowRiftQuest(): Quest<MappingTask> {
  // Read counts after daily setup, which may have granted Shadow Affinity.
  const questBudget =
    sum(rufusPotion.value(highMeatMonsterCount()), "quantity") +
    Math.floor(CinchoDeMayo.totalAvailableCinch() / 60) +
    Math.max(haveEffect(affinity), 11) +
    10;
  return {
    name: "Shadow Rift",
    ready: () =>
      ClosedCircuitPayphone.have() &&
      sober() &&
      myAdventures() > 0 &&
      !have($effect`Feeling Lost`),
    tasks: shadowRiftTasks().map((task) => ({
      ...task,
      // Quest transitions recur within the same engine. Budget for both the
      // available artifact quests and profitable item purchases.
      limit:
        task.name === "Shadow Affinity Combat"
          ? task.limit
          : {
              ...task.limit,
              skip: Math.max(task.limit?.skip ?? 0, questBudget),
            },
    })),
  };
}

export function expectedShadowRiftTentacles(): number {
  if (!ClosedCircuitPayphone.have()) return 0;
  return haveEffect(affinity) + (!get("_shadowAffinityToday") ? 11 : 0);
}

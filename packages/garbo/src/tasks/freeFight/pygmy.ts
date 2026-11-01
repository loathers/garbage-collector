import {
  adv1,
  closetAmount,
  handlingChoice,
  itemAmount,
  mallPrice,
  myAscensions,
  putCloset,
  retrieveItem,
  retrievePrice,
  runChoice,
  takeCloset,
  use,
  visitUrl,
} from "kolmafia";
import {
  $item,
  $items,
  $location,
  $monster,
  $monsters,
  $skill,
  clamp,
  CrystalBall,
  Delayed,
  get,
  have,
  MonsterProperty,
  sum,
  undelay,
} from "libram";
import { OutfitSpec } from "grimoire-kolmafia";
import { Macro } from "../../combat";
import { GarboStrategy } from "../../combatStrategy";
import { globalOptions } from "../../config";
import { getUsingFreeBunnyBanish } from "../../lib";
import { magnifyingGlass } from "../../outfit/dropsgear";
import { freeFightOutfit } from "../../outfit/free";
import { crateStrategy, doingGregFight } from "../../resources/extrovermectin";
import {
  timeSpinnerRefused,
  travelToRecentFight,
} from "../../resources/timeSpinner";
import { MappingTask } from "../engine";
import { freeFightTask } from "./lib";

const pygmyBanishHandlers = [
  {
    pygmy: $monster`pygmy bowler`,
    skill: $skill`Snokebomb`,
    check: "_snokebombUsed",
    limit: getUsingFreeBunnyBanish() ? 1 : 3,
    item: $item`Louder Than Bomb`,
  },
  {
    pygmy: $monster`pygmy orderlies`,
    skill: $skill`Feel Hatred`,
    check: "_feelHatredUsed",
    limit: 3,
    item: $item`divine champagne popper`,
  },
  {
    pygmy: $monster`pygmy janitor`,
    skill: undefined,
    check: undefined,
    limit: 0,
    item: $item`tennis ball`,
  },
] as const;

const sniffSources: MonsterProperty[] = [
  "_gallapagosMonster",
  "olfactedMonster",
  "_latteMonster",
  "motifMonster",
  "longConMonster",
];
const pygmySniffed = () =>
  sniffSources.some((source) =>
    pygmyBanishHandlers.some(({ pygmy }) => pygmy === get(source)),
  );

const pygmyMacro = () =>
  Macro.step(
    ...pygmyBanishHandlers.map(({ pygmy, skill, item, check, limit }) =>
      Macro.externalIf(
        (check ? get(check) : Infinity) < limit,
        Macro.if_(
          pygmy,
          skill ? Macro.trySkill(skill).item(item) : Macro.item(item),
        ),
        Macro.if_(pygmy, Macro.item(item)),
      ),
    ),
  )
    .if_($monster`drunk pygmy`, Macro.trySkill($skill`Extract`).trySingAlong())
    .ifInnateWanderer(Macro.basicCombat())
    .abort();

const alley = $location`The Hidden Bowling Alley`;
const drunk = $monster`drunk pygmy`;
const bowl = $item`Bowl of Scorpions`;
const saber = $item`Fourth of May Cosplay Saber`;
const pygmiesReady = () =>
  get("questL11Worship") !== "unstarted" && !pygmySniffed();
const closetBalls = () =>
  putCloset(itemAmount($item`bowling ball`), $item`bowling ball`);
const scorpionsAvailable = () =>
  get("hiddenTavernUnlock") === myAscensions() || mallPrice(bowl) < 1000;

export const UnlockHiddenTavernTask: MappingTask = {
  name: "Unlock Hidden Tavern for Scorpions",
  mapSafe: true,
  ready: () => pygmiesReady() && get("_drunkPygmyBanishes") < 9,
  completed: () =>
    get("hiddenTavernUnlock") === myAscensions() ||
    globalOptions.triedToUnlockHiddenTavern,
  do: () => {
    globalOptions.triedToUnlockHiddenTavern = true;
    retrieveItem($item`book of matches`);
    if (have($item`book of matches`)) use($item`book of matches`);
  },
  spendsTurn: false,
  limit: { tries: 1 },
};

type FreeFightFragment = Parameters<typeof freeFightTask>[0];
type PygmyTaskFragment = Omit<
  FreeFightFragment,
  "adventure" | "do" | "tentacle"
> &
  Partial<Pick<FreeFightFragment, "do" | "tentacle">> & {
    equip?: Delayed<OutfitSpec["equip"]>;
  };

function pygmyTask({
  equip = [],
  prepare = () => {
    retrieveItem(bowl);
  },
  ...fragment
}: PygmyTaskFragment) {
  return freeFightTask({
    adventure: { location: alley, target: drunk },
    do: alley,
    tentacle: true,
    combat: new GarboStrategy(pygmyMacro),
    outfit: () =>
      freeFightOutfit(
        {
          equip: undelay(equip),
          avoid: $items`Staff of Queso Escusado, stinky cheese sword`,
          bonuses: new Map([
            [$item`garbage sticker`, 100],
            ...magnifyingGlass(),
          ]),
        },
        { location: alley, target: drunk },
        { familiarOptions: { canChooseMacro: false } },
      ),
    prepare: () => {
      closetBalls();
      prepare();
    },
    ...fragment,
  });
}

let initialPygmiesAffordable: boolean | undefined;
function initialPygmyCostAllowed() {
  initialPygmiesAffordable ??=
    retrievePrice(bowl) +
      sum(
        pygmyBanishHandlers.filter(
          ({ skill, check, limit }) =>
            !skill || !have(skill) || (check && get(check) >= limit),
        ),
        ({ item }) => mallPrice(item),
      ) /
        11 <=
    globalOptions.prefs.valueOfFreeFight;
  return initialPygmiesAffordable;
}

export const PygmyFightTasks = [
  pygmyTask({
    name: "Drunk Pygmies (Initial Nine)",
    ready: () =>
      pygmiesReady() &&
      get("_drunkPygmyBanishes") < 9 &&
      scorpionsAvailable() &&
      initialPygmyCostAllowed(),
    completed: () => get("_drunkPygmyBanishes") >= 9,
    prepare: () => {
      retrieveItem(clamp(9 - get("_drunkPygmyBanishes"), 0, 9), bowl);
      for (const { item } of pygmyBanishHandlers) retrieveItem(item);
    },
    // Preserve the initial stage's original outfit rather than the later orb/saber setup.
    outfit: () => freeFightOutfit({}, { location: alley, target: drunk }),
    combatCount: () => clamp(9 - get("_drunkPygmyBanishes"), 0, 9),
  }),
  pygmyTask({
    name: "Drunk Pygmy (Tenth, Save Orb Prediction)",
    ready: () => pygmiesReady() && get("_drunkPygmyBanishes") === 9,
    completed: () => get("_drunkPygmyBanishes") >= 10,
    equip: () => $items`miniature crystal ball`.filter(have),
  }),
  pygmyTask({
    name: "Drunk Pygmy (Eleventh, Without Saber)",
    ready: () =>
      pygmiesReady() &&
      get("_drunkPygmyBanishes") === 10 &&
      (!have(saber) || crateStrategy() === "Saber"),
    completed: () => get("_drunkPygmyBanishes") >= 11,
  }),
  pygmyTask({
    name: "Drunk Pygmies (Saber Friends)",
    do: (): void => {
      adv1(alley, -1, "");
      if (handlingChoice()) runChoice(-1);
    },
    ready: () =>
      pygmiesReady() &&
      have(saber) &&
      crateStrategy() !== "Saber" &&
      get("_drunkPygmyBanishes") >= 10 &&
      !$monsters`pygmy orderlies, pygmy bowler, pygmy janitor`.includes(
        get("_saberForceMonster") ?? $monster.none,
      ),
    completed: () =>
      !(
        get("_drunkPygmyBanishes") === 10 ||
        (get("_saberForceMonster") === drunk &&
          get("_saberForceMonsterCount") > 0)
      ),
    prepare: () => {
      if (saberFriends()) {
        putCloset(itemAmount(bowl), bowl);
      } else if (closetAmount(bowl) > 0) {
        takeCloset(closetAmount(bowl), bowl);
      } else retrieveItem(bowl);
    },
    combat: new GarboStrategy(
      () => (saberFriends() ? new Macro() : pygmyMacro()),
      () =>
        saberFriends() ? Macro.skill($skill`Use the Force`) : pygmyMacro(),
    ),
    choices: { 1387: 2 },
    equip: [saber],
    tentacle: false,
    combatCount: () =>
      Math.max(0, 5 - get("_saberForceUses")) * 3 +
      get("_saberForceMonsterCount") +
      1,
  }),
  pygmyTask({
    name: "Drunk Pygmy (Release Orb Prediction)",
    ready: () =>
      pygmiesReady() &&
      get("_drunkPygmyBanishes") >= 11 &&
      CrystalBall.ponder().get(alley) === drunk,
    completed: () => CrystalBall.ponder().get(alley) !== drunk,
    equip: () => $items`miniature crystal ball`.filter(have),
    combat: new GarboStrategy(() => Macro.if_(drunk, pygmyMacro()).abort()),
  }),
  pygmyTask({
    name: "Drunk Pygmies (Time-Spinner)",
    mapSafe: true,
    ready: () =>
      !timeSpinnerRefused(drunk) &&
      have($item`Time-Spinner`) &&
      !doingGregFight() &&
      alley.combatQueue.includes("drunk pygmy"),
    completed: () => get("_timeSpinnerMinutesUsed") >= 8,
    do: () => {
      visitUrl(`inv_use.php?whichitem=${$item`Time-Spinner`.id}`);
      travelToRecentFight(drunk);
    },
    combat: new GarboStrategy(() =>
      Macro.trySkill($skill`Extract`).trySingAlong(),
    ),
    combatCount: () => Math.floor((10 - get("_timeSpinnerMinutesUsed")) / 3),
  }),
];

function saberFriends() {
  return (
    (get("_saberForceMonster") !== drunk ||
      get("_saberForceMonsterCount") === 1) &&
    get("_saberForceUses") < 5
  );
}

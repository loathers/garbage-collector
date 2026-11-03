import {
  canAdventure,
  cliExecute,
  equip,
  myAdventures,
  myBuffedstat,
  outfit,
  use,
} from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $location,
  $monster,
  $skill,
  $slot,
  $stat,
  ensureEffect,
  get,
  have,
} from "libram";
import { acquire } from "../acquire";
import { Macro } from "../combat";
import { GarboStrategy } from "../combatStrategy";
import { questStep, sober } from "../lib";
import { freeFightOutfit } from "../outfit/free";
import { doingGregFight } from "../resources/extrovermectin";
import { prepareParty } from "./freeFight/lib";
import { MappingTask, runGarboQuests } from "./engine";
import { PostQuest } from "./post";

export function molemanReady() {
  return have($item`molehill mountain`) && !get("_molehillMountainUsed");
}

function thesisPlan() {
  const hp = 1296;
  if (molemanReady()) {
    return { location: $location`Noob Cave`, muscle: hp / 1.5 - 15 };
  }
  if (
    (get("neverendingPartyAlways") || get("_neverEndingPartyToday")) &&
    questStep("_questPartyFair") < 999 &&
    !get("_partyHard")
  ) {
    return {
      location: $location`The Neverending Party`,
      muscle: hp / 0.75 + 10,
    };
  }
  const swamp = $location`Uncle Gator's Country Fun-Time Liquid Waste Sluice`;
  return canAdventure(swamp)
    ? { location: swamp, muscle: hp / 0.75 - 5 }
    : {
        location: $location`Hamburglaris Shield Generator`,
        muscle: hp / 0.75 - 1,
      };
}

export const ThesisTask = {
  name: "Deliver Thesis",
  mapSafe: molemanReady,
  ready: () =>
    sober() &&
    myAdventures() > 0 &&
    !have($effect`Feeling Lost`) &&
    have($familiar`Pocket Professor`) &&
    $familiar`Pocket Professor`.experience >= 400,
  completed: () => get("_thesisDelivered"),
  outfit: () =>
    freeFightOutfit(
      { modifier: ["100 Muscle"], familiar: $familiar`Pocket Professor` },
      molemanReady() ? $monster`Moleman` : thesisPlan().location,
    ),
  prepare: () => {
    const { location, muscle } = thesisPlan();
    if (location === $location`The Neverending Party`) prepareParty();
    if (
      location === $location`Hamburglaris Shield Generator` &&
      !have($effect`Transpondent`)
    ) {
      acquire(1, $item`transporter transponder`, 10000);
      use($item`transporter transponder`);
    }
    if (
      myBuffedstat($stat`Muscle`) < muscle &&
      have($item`Powerful Glove`) &&
      !have($effect`Triple-Sized`) &&
      get("_powerfulGloveBatteryPowerUsed") <= 95 &&
      (get("_powerfulGloveBatteryPowerUsed") % 10 === 5 || !doingGregFight())
    ) {
      cliExecute("checkpoint");
      equip($slot`acc1`, $item`Powerful Glove`);
      ensureEffect($effect`Triple-Sized`);
      outfit("checkpoint");
    }
    cliExecute(`try; gain ${muscle} muscle`);
  },
  do: () => {
    if (molemanReady()) {
      use($item`molehill mountain`);
      return;
    }
    return thesisPlan().location;
  },
  combat: new GarboStrategy(() => Macro.skill($skill`deliver your thesis!`)),
  spendsTurn: () => !molemanReady(),
  limit: { tries: 5 },
} satisfies MappingTask;

/** Run the same task from callers that have not migrated to Grimoire. */
export function deliverThesisIfAble(): void {
  if (ThesisTask.completed() || !ThesisTask.ready?.()) return;
  runGarboQuests([PostQuest(), { name: "Thesis", tasks: [ThesisTask] }]);
}

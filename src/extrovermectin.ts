import { equip, retrieveItem, toMonster, useFamiliar, visitUrl } from "kolmafia";
import {
  $effect,
  $item,
  $items,
  $location,
  $monster,
  $skill,
  $slot,
  adventureMacro,
  clamp,
  CrystalBall,
  get,
  have,
  property,
  Requirement,
} from "libram";
import { freeFightFamiliar } from "./familiar";
import { findRun, ltbRun, setChoice } from "./lib";
import { Macro } from "./combat";
import { embezzlerMacro } from "./embezzler";

export function expectedGregs(): number[] {
  const baseGregs = 3;
  const timeSpunGregs = have($item`Time-Spinner`)
    ? Math.floor((10 - get("_timeSpinnerMinutesUsed")) / 3)
    : 0;
  const orbGregs = have($item`miniature crystal ball`) ? 1 : 0;

  const macrometeors = have($skill`Meteor Lore`) ? 10 - get("_macrometeoriteUses") : 0;
  const replaceEnemies = have($item`Powerful Glove`)
    ? Math.floor((100 - get("_powerfulGloveBatteryPowerUsed")) / 10)
    : 0;
  let totalMonsterReplacers = macrometeors + replaceEnemies;

  const sabersLeft = have($item`Fourth of May Cosplay Saber`)
    ? clamp(5 - get("_saberForceUses"), 0, 3)
    : 0;

  const gregs = [];

  // these are estimates based on intuition
  const replacesPerGreg = have($skill`Transcendent Olfaction`) ? 7 : 5;
  const firstReplaces = clamp(sabersLeft * 2 + replacesPerGreg, 0, totalMonsterReplacers);

  gregs.push(baseGregs + orbGregs + timeSpunGregs + sabersLeft * 2 + replacesPerGreg);
  totalMonsterReplacers -= firstReplaces;
  while (totalMonsterReplacers > 0) {
    gregs.push(baseGregs + orbGregs + clamp(replacesPerGreg, 0, totalMonsterReplacers));
    totalMonsterReplacers -= replacesPerGreg;
  }
  gregs.push(baseGregs + orbGregs);

  return gregs;
}

export function doingExtrovermectin(): boolean {
  return get("beGregariousCharges") > 0 || get("beGregariousFightsLeft") > 0;
}

export function crateStrategy(): "Sniff" | "Saber" | "Orb" | null {
  if (!doingExtrovermectin()) return null;
  if (have($skill`Transcendent Olfaction`)) return "Sniff";
  if (have($item`miniature crystal ball`)) return "Orb";
  if (have($item`Fourth of May Cosplay Saber`)) return "Saber";
  return null;
}

export function hasMonsterReplacers(): boolean {
  return (
    (have($skill`Meteor Lore`) && get("_macrometeoriteUses") < 10) ||
    (have($item`Powerful Glove`) && get("_powerfulGloveBatteryPowerUsed") < 90)
  );
}

/**
 * Saberfriends a crate if we are able to do so.
 */
export function saberCrateIfDesired(): void {
  if (!have($item`Fourth of May Cosplay Saber`) || get("_saberForceUses") >= 5) return;
  if (get("_saberForceMonster") !== $monster`crate` || get("_saberForceMonsterCount") < 2) {
    const run = findRun() ?? ltbRun();

    new Requirement([], { forceEquip: $items`Fourth of May Cosplay Saber` })
      .merge(run.requirement ? run.requirement : new Requirement([], {}))
      .maximize();
    useFamiliar(freeFightFamiliar());
    if (run.prepare) run.prepare();
    setChoice(1387, 2);
    adventureMacro(
      $location`Noob Cave`,
      Macro.if_($monster`crate`, Macro.skill($skill`Use the Force`))
        .if_($monster`time-spinner prank`, Macro.kill())
        .ifHolidayWanderer(run.macro)
        .abort()
    );
  }
}

/**
 * Equip the miniature crystal ball if the current prediction is good for us.
 */
export function equipOrbIfDesired(): void {
  if (
    have($item`miniature crystal ball`) &&
    CrystalBall.currentPredictions(false).get($location`Noob Cave`) ===
      $monster`Knob Goblin Embezzler` &&
    !(get("_saberForceMonster") === $monster`crate` && get("_saberForceMonsterCount") > 0) &&
    (crateStrategy() !== "Sniff" ||
      !$location`Noob Cave`.combatQueue
        .split(";")
        .map((monster) => toMonster(monster))
        .includes($monster`Knob Goblin Embezzler`))
  ) {
    equip($slot`familiar`, $item`miniature crystal ball`);
  }
}

/**
 * Pre-olfact/saber crates, for extrovermectin/gregarious reasons.
 */
function initializeCrates(): void {
  do {
    //We use the force while olfacting sometimes, so we'll need to refresh mafia's knowledge of olfaction
    if (property.getString("olfactedMonster") !== "crate") {
      visitUrl(`desc_effect.php?whicheffect=${$effect`On the Trail`.descid}`);
    }
    //if we have olfaction, that's our primary method for ensuring crates
    if (
      have($skill`Transcendent Olfaction`) &&
      (!have($effect`On the Trail`) || property.getString("olfactedMonster") !== "crate") &&
      get<number>("_olfactionUses") < 3
    ) {
      const run = findRun() ?? ltbRun();
      setChoice(1387, 2); //use the force, in case we decide to use that

      //Sniff the crate in as many ways as humanly possible
      const macro = Macro.trySkill($skill`Transcendent Olfaction`)
        .trySkill($skill`Offer Latte to Opponent`)
        .externalIf(
          get("_gallapagosMonster") !== $monster`crate` && have($skill`Gallapagosian Mating Call`),
          Macro.trySkill($skill`Gallapagosian Mating Call`)
        )
        .trySkill($skill`Use the Force`)
        .step(run.macro);

      //equip latte and saber for lattesniff and saberfriends, if we want to
      //Crank up ML to make sure the crate survives several rounds; we may have some passive damage
      new Requirement(["100 Monster Level"], {
        forceEquip: $items`latte lovers member's mug, Fourth of May Cosplay Saber`.filter((item) =>
          have(item)
        ),
      })
        .merge(run.requirement ? run.requirement : new Requirement([], {}))
        .maximize();
      useFamiliar(freeFightFamiliar());
      if (run.prepare) run.prepare();
      adventureMacro(
        $location`Noob Cave`,
        Macro.if_($monster`crate`, macro)
          .if_($monster`time-spinner prank`, Macro.kill())
          .ifHolidayWanderer(run.macro)
          .abort()
      );
    } else if (
      crateStrategy() === "Saber" &&
      (get("_saberForceMonster") !== $monster`crate` || get("_saberForceMonsterCount") === 0) &&
      get("_saberForceUses") < 5
    )
      saberCrateIfDesired();
    else break; //we can break the loop if there's nothing to do
  } while (!["crate", "Using the Force"].includes(get("lastEncounter"))); //loop until we actually hit a crate
}

function initializeDireWarren(): void {
  retrieveItem(1, $item`human musk`);
  do {
    adventureMacro(
      $location`The Dire Warren`,
      Macro.if_($monster`fluffy bunny`, Macro.item($item`human musk`)).step(embezzlerMacro())
    );
  } while ("fluffy bunny" !== get("lastEncounter"));
}

export function intializeExtrovermectinZones(): void {
  if (get("beGregariousFightsLeft") === 0 && hasMonsterReplacers()) {
    initializeCrates();
  }
  initializeDireWarren();
}

import {
  booleanModifier,
  canInteract,
  cliExecute,
  equip,
  haveEffect,
  haveEquipped,
  maximize,
  myMeat,
  myTurncount,
  print,
  useSkill,
} from "kolmafia";
import {
  $effect,
  $item,
  $location,
  $skill,
  FloristFriar,
  get,
  getActiveSongs,
  have,
  realmAvailable,
  set,
  uneffect,
} from "libram";
import { garboAdventure, Macro } from "../combat";
import { globalOptions } from "../config";
import { postFreeFightDailySetup } from "../dailiespost";
import { runDiet } from "../diet";
import { embezzlerCount } from "../embezzler";
import { doSausage, freeRunFights } from "../fights";
import { baseMeat, eventLog, propertyManager, safeRestore } from "../lib";
import { meatMood } from "../mood";
import postCombatActions from "../post";
import { potionSetup } from "../potions";
import { prepRobortender } from "../tasks/dailyFamiliars";
import { yachtzeePotionSetup } from "./buffs";
import { executeNextDietStep, yachtzeeChainDiet } from "./diet";
import { pyecAvailable, shrugIrrelevantSongs } from "./lib";
import {
  getBestWaterBreathingEquipment,
  maximizeMeat,
  prepareOutfitAndFamiliar,
  stickerSetup,
} from "./outfit";

function _yachtzeeChain(): void {
  if (!canInteract()) return;
  // We definitely need to be able to eat sliders and drink pickle juice
  if (!realmAvailable("sleaze")) return;

  maximize("MP", false);
  meatMood(false, 750 + baseMeat).execute(embezzlerCount());
  potionSetup(globalOptions.nobarf); // This is the default set up for embezzlers (which helps us estimate if chaining is better than extros)
  maximizeMeat();
  prepareOutfitAndFamiliar();

  const meatLimit = 5000000;
  if (myMeat() > meatLimit) {
    const meatToCloset = myMeat() - meatLimit;
    print("");
    print("");
    print(`We are going to closet all-but-5million meat for your safety!`, "blue");
    print("");
    print("");
    if (!get("_yachtzeeChainClosetedMeat")) {
      set("_yachtzeeChainClosetedMeat", meatToCloset);
    } else {
      set("_yachtzeeChainClosetedMeat", meatToCloset + get("_yachtzeeChainClosetedMeat"));
    }
    cliExecute(`closet put ${meatToCloset} meat`);
  }
  if (!yachtzeeChainDiet()) {
    cliExecute(`closet take ${get("_yachtzeeChainClosetedMeat")} meat`);
    set("_yachtzeeChainClosetedMeat", 0);
    return;
  }
  let jellyTurns = get("_stenchJellyChargeTarget", 0);
  let fishyTurns = haveEffect($effect`Fishy`) + (pyecAvailable() ? 5 : 0);
  let turncount = myTurncount();
  yachtzeePotionSetup(Math.min(jellyTurns, fishyTurns));
  stickerSetup(Math.min(jellyTurns, fishyTurns));
  cliExecute(`closet take ${get("_yachtzeeChainClosetedMeat")} meat`);
  set("_yachtzeeChainClosetedMeat", 0);
  if (haveEffect($effect`Beaten Up`)) {
    uneffect($effect`Beaten Up`);
  }
  meatMood(false, 2000).execute(Math.min(jellyTurns, fishyTurns));
  safeRestore();

  propertyManager.setChoice(918, 2);
  let plantCrookweed = true;
  while (Math.min(jellyTurns, fishyTurns) > 0) {
    executeNextDietStep();
    if (!get("noncombatForcerActive")) throw new Error("We did not use stench jellies");
    // Switch familiars in case changes in fam weight from buffs means our current familiar is no longer optimal
    prepareOutfitAndFamiliar();
    if (!have($effect`Really Deep Breath`)) {
      const bestWaterBreathingEquipment = getBestWaterBreathingEquipment(
        Math.min(jellyTurns, fishyTurns),
      );
      if (bestWaterBreathingEquipment.item !== $item.none) {
        equip(bestWaterBreathingEquipment.item);
      }
      if (
        haveEquipped($item`The Crown of Ed the Undying`) &&
        !booleanModifier("Adventure Underwater")
      ) {
        cliExecute("edpiece fish");
      }
    }
    if (!have($effect`Polka of Plenty`)) {
      if (have($effect`Ode to Booze`)) cliExecute(`shrug ${$effect`Ode to Booze`}`);
      if (
        getActiveSongs().length < (have($skill`Mariachi Memory`) ? 4 : 3) &&
        have($skill`The Polka of Plenty`)
      ) {
        useSkill($skill`The Polka of Plenty`);
      }
    }
    garboAdventure($location`The Sunken Party Yacht`, Macro.abort());
    if (get("lastEncounter") === "Yachtzee!") eventLog.yachtzees += 1;
    if (myTurncount() > turncount || haveEffect($effect`Fishy`) < fishyTurns) {
      fishyTurns -= 1;
      jellyTurns -= 1;
      turncount = myTurncount();
      set("_stenchJellyChargeTarget", get("_stenchJellyChargeTarget", 0) - 1);
    }
    if (plantCrookweed && FloristFriar.have() && FloristFriar.Crookweed.available()) {
      FloristFriar.Crookweed.plant();
    }
    plantCrookweed = false;
    postCombatActions();

    doSausage();
  }
}

export function yachtzeeChain(): void {
  if (!globalOptions.prefs.yachtzeechain) return;
  if (get("_garboYachtzeeChainCompleted", false)) return;
  print("Running Yachtzee Chain", "purple");
  _yachtzeeChain();
  set("_garboYachtzeeChainCompleted", true);
  globalOptions.prefs.yachtzeechain = false;
  if (!globalOptions.nodiet) {
    shrugIrrelevantSongs();
    runDiet();
    prepRobortender(); // Recompute robo drinks' worth after diet is finally consumed
  }
  freeRunFights();
  postFreeFightDailySetup();
}

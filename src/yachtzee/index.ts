import {
  booleanModifier,
  canInteract,
  cliExecute,
  equip,
  haveEffect,
  haveEquipped,
  maximize,
  myLevel,
  myMeat,
  myTurncount,
  print,
  useSkill,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $item,
  $location,
  $skill,
  adventureMacro,
  get,
  getActiveSongs,
  have,
  Macro,
  set,
  uneffect,
} from "libram";
import { prepFamiliars } from "../dailies";
import { runDiet } from "../diet";
import { embezzlerCount } from "../embezzler";
import { doSausage } from "../fights";
import { baseMeat, globalOptions, realmAvailable, safeRestore } from "../lib";
import { meatMood } from "../mood";
import { potionSetup } from "../potions";
import { yachtzeePotionSetup } from "./buffs";
import { executeNextDietStep, yachtzeeChainDiet } from "./diet";
import { pyecAvailable } from "./lib";
import {
  getBestWaterBreathingEquipment,
  maximizeMeat,
  prepareOutfitAndFamiliar,
  stickerSetup,
} from "./outfit";

function _yachtzeeChain(): void {
  if (myLevel() <= 13 || !canInteract()) return;
  // We definitely need to be able to eat sliders and drink pickle juice
  if (!realmAvailable("sleaze")) return;

  maximize("MP", false);
  meatMood(false, 750 + baseMeat).execute(embezzlerCount());
  potionSetup(false); // This is the default set up for embezzlers (which helps us estimate if chaining is better than extros)
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

  let plantCrookweed = true;
  set("choiceAdventure918", 2);
  while (Math.min(jellyTurns, fishyTurns) > 0) {
    executeNextDietStep();
    if (!get("_stenchJellyUsed", false)) throw new Error("We did not use stench jellies");
    // Switch familiars in case changes in fam weight from buffs means our current familiar is no longer optimal
    prepareOutfitAndFamiliar();
    if (!have($effect`Really Deep Breath`)) {
      const bestWaterBreathingEquipment = getBestWaterBreathingEquipment(
        Math.min(jellyTurns, fishyTurns)
      );
      if (bestWaterBreathingEquipment.item !== $item.none) equip(bestWaterBreathingEquipment.item);
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
    adventureMacro($location`The Sunken Party Yacht`, Macro.abort());
    if (myTurncount() > turncount || haveEffect($effect`Fishy`) < fishyTurns) {
      fishyTurns -= 1;
      jellyTurns -= 1;
      turncount = myTurncount();
      set("_stenchJellyChargeTarget", get("_stenchJellyChargeTarget", 0) - 1);
      set("_stenchJellyUsed", false);
    }
    if (
      plantCrookweed &&
      visitUrl("forestvillage.php").includes("friarcottage.gif") &&
      !get("_floristPlantsUsed").split(",").includes("Crookweed")
    ) {
      cliExecute("florist plant Crookweed");
    }
    plantCrookweed = false;

    doSausage();
  }
  set("choiceAdventure918", "");
}

export function yachtzeeChain(): void {
  if (!globalOptions.yachtzeeChain) return;
  if (get("_garboYachtzeeChainCompleted", false)) return;
  print("Running Yachtzee Chain", "purple");
  _yachtzeeChain();
  set("_garboYachtzeeChainCompleted", true);
  globalOptions.yachtzeeChain = false;
  if (!globalOptions.noDiet) {
    runDiet();
    prepFamiliars(); // Recompute robo drinks' worth after diet is finally consumed
  }
}

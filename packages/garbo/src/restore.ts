import {
  eat,
  inebrietyLimit,
  lastMonster,
  myHp,
  myInebriety,
  myMaxhp,
  myMaxmp,
  myMp,
  mySoulsauce,
  restoreHp,
  restoreMp,
  soulsauceCost,
  useSkill,
} from "kolmafia";
import {
  $effect,
  $item,
  $monster,
  $skill,
  get,
  have,
  set,
  uneffect,
} from "libram";
import { FarmingStrategy } from "./farmingStrategy";
import { burnLibrams, howManySausagesCouldIEat } from "./lib";

export function safeRestoreMpTarget(): number {
  //  If our max MP is close to 200, we could be restoring every turn even if we don't need to, avoid that case.
  if (Math.abs(myMaxmp() - 200) < 40) {
    return Math.min(myMaxmp(), 100);
  }
  return Math.min(myMaxmp(), 200);
}

export function safeRestore(): void {
  if (
    lastMonster() === $monster`Sssshhsssblllrrggghsssssggggrrgglsssshhssslblgl`
  ) {
    if (have($effect`Beaten Up`)) uneffect($effect`Beaten Up`);
  } else if (get("_lastCombatLost")) {
    set("_lastCombatLost", "false");
    throw new Error(
      "You lost your most recent combat! Check to make sure everything is alright before rerunning.",
    );
  } else if (have($effect`Beaten Up`)) {
    throw new Error(
      "Hey, you're beaten up, and that's a bad thing. Lick your wounds, handle your problems, and run me again when you feel ready.",
    );
  }

  const lowPercentageHealth = FarmingStrategy.isUnderwater()
    ? myInebriety() > inebrietyLimit()
      ? 0.9
      : 0.6
    : 0.5;

  if (
    myHp() <
    Math.min(
      myMaxhp() * lowPercentageHealth,
      get("garbo_restoreHpTarget", 2000),
    )
  ) {
    restoreHp(Math.min(myMaxhp() * 0.9, get("garbo_restoreHpTarget", 2000)));
  }
  const mpTarget = safeRestoreMpTarget();
  const shouldRestoreMp = () => myMp() < mpTarget;

  if (shouldRestoreMp() && howManySausagesCouldIEat() > 0) {
    eat($item`magical sausage`);
  }

  const soulFoodCasts = Math.floor(
    mySoulsauce() / soulsauceCost($skill`Soul Food`),
  );
  if (shouldRestoreMp() && soulFoodCasts > 0) {
    useSkill(soulFoodCasts, $skill`Soul Food`);
  }

  if (shouldRestoreMp()) restoreMp(mpTarget);

  burnLibrams(mpTarget * 2); // Leave a mp buffer when burning
}

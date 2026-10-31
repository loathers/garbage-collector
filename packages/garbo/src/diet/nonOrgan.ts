import {
  cliExecute,
  getProperty,
  Item,
  mallPrice,
  myClass,
  print,
  setProperty,
  use,
  useSkill,
  wait,
} from "kolmafia";
import { $class, $item, $skill, clamp, get, have, Kmail, maxBy } from "libram";
import { acquire } from "../acquire";
import { globalOptions } from "../config";
import { MPA, useIfUnused } from "./lib";

export function nonOrganAdventures(): void {
  useIfUnused(
    $item`fancy chocolate car`,
    get("_chocolatesUsed") !== 0,
    2 * MPA,
  );

  while (get("_loveChocolatesUsed") < 3) {
    const price = have($item`LOV Extraterrestrial Chocolate`) ? 15000 : 20000;
    const value =
      clamp(3 - get("_loveChocolatesUsed"), 0, 3) * get("valueOfAdventure");
    if (value < price) break;
    if (!have($item`LOV Extraterrestrial Chocolate`)) {
      Kmail.send(
        "sellbot",
        `${$item`LOV Extraterrestrial Chocolate`.name} (1)`,
        undefined,
        20000,
      );
      wait(11);
      cliExecute("refresh inventory");
      if (!have($item`LOV Extraterrestrial Chocolate`)) {
        print(
          "I'm tired of waiting for sellbot to send me some chocolate",
          "red",
        );
        break;
      }
    }
    use($item`LOV Extraterrestrial Chocolate`);
  }

  const chocos = new Map([
    [$class`Seal Clubber`, $item`chocolate seal-clubbing club`],
    [$class`Turtle Tamer`, $item`chocolate turtle totem`],
    [$class`Pastamancer`, $item`chocolate pasta spoon`],
    [$class`Sauceror`, $item`chocolate saucepan`],
    [$class`Accordion Thief`, $item`chocolate stolen accordion`],
    [$class`Disco Bandit`, $item`chocolate disco ball`],
  ]);
  const classChoco = chocos.get(myClass());
  const chocExpVal = (remaining: number, item: Item): number => {
    const advs = [0, 0, 1, 2, 3][remaining + (item === classChoco ? 1 : 0)];
    return advs * MPA - mallPrice(item);
  };
  const chocosRemaining = clamp(3 - get("_chocolatesUsed"), 0, 3);
  for (let i = chocosRemaining; i > 0; i--) {
    const chocoVals = [...chocos.values()].map((choc) => {
      return {
        choco: choc,
        value: chocExpVal(i, choc),
      };
    });
    const best = maxBy(chocoVals, "value");
    if (best.value > 0) {
      acquire(1, best.choco, best.value + mallPrice(best.choco), false);
      use(1, best.choco);
    } else break;
  }

  useIfUnused(
    $item`fancy chocolate sculpture`,
    get("_chocolateSculpturesUsed") > 0,
    5 * MPA + 5000,
  );
  useIfUnused($item`essential tofu`, "_essentialTofuUsed", 5 * MPA);

  if (!get("_etchedHourglassUsed") && have($item`etched hourglass`)) {
    use(1, $item`etched hourglass`);
  }

  if (
    getProperty("_timesArrowUsed") !== "true" &&
    mallPrice($item`time's arrow`) < 5 * MPA
  ) {
    acquire(1, $item`time's arrow`, 5 * MPA);
    cliExecute("csend 1 time's arrow to botticelli");
    setProperty("_timesArrowUsed", "true");
  }

  if (have($skill`Ancestral Recall`) && mallPrice($item`blue mana`) < 3 * MPA) {
    const casts = Math.max(10 - get("_ancestralRecallCasts"), 0);
    acquire(casts, $item`blue mana`, 3 * MPA);
    useSkill(casts, $skill`Ancestral Recall`);
  }

  if (globalOptions.ascend) {
    useIfUnused($item`borrowed time`, "_borrowedTimeUsed", 20 * MPA);
  }

  if (get("_extraTimeUsed", 3) < 3) {
    const extraTimeValue = (timesUsed: number): number => {
      const advs = [5, 3, 1][timesUsed];
      return advs * MPA;
    };
    const extraTimeUsed = get("_extraTimeUsed", 3);
    for (let i = extraTimeUsed; i < 3; i++) {
      if (extraTimeValue(i) > mallPrice($item`extra time`)) {
        if (acquire(1, $item`extra time`, extraTimeValue(i), false)) {
          use($item`extra time`);
        }
      } else break;
    }
  }

  if (get("_clocksUsed", 2) < 2) {
    const clockValue = (timesUsed: number): number => {
      const advs = [3, 2][timesUsed];
      return advs * MPA;
    };
    const clocksUsed = get("_clocksUsed", 2);
    for (let i = clocksUsed; i < 2; i++) {
      if (clockValue(i) > mallPrice($item`clock`)) {
        if (acquire(1, $item`clock`, clockValue(i), false)) {
          use($item`clock`);
        }
      } else break;
    }
  }
}

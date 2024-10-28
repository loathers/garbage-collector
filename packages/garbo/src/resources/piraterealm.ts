import { Outfit, step } from "grimoire-kolmafia";
import { $item, $location, $monster, get, have } from "libram";
import { runChoice, visitUrl } from "kolmafia";
import { GarboTask } from "../tasks/engine";

import { GarboStrategy, Macro } from "../combat";
import { freeFightOutfit, meatTargetOutfit } from "../outfit";
import { globalOptions } from "../config";

const eyepatch = $item`PirateRealm eyepatch`;

export function prSetupTasks(): GarboTask[] {
  return [
    getEyepatch(),
    chooseCrew(),
    sailToCrabIsland(),
    runToGiantGiantCrab(),
    runGiantGiantCrab(),
    selectTrashIsland(),
  ];
}

export function getEyepatch(): GarboTask {
  return {
    name: "Start Pirate Realm",
    completed: () => have(eyepatch),
    ready: () =>
      get("prAlways") ||
      (get("_prToday") &&
        globalOptions.target === $monster`cockroach` &&
        get("pirateRealmUnlockedAnemometer")),
    do: (): void => {
      visitUrl("place.php?whichplace=realm_pirate&action=pr_port");
    },
    combat: new GarboStrategy(() => Macro.basicCombat()),
    spendsTurn: false,
  };
}

export function chooseCrew(): GarboTask {
  return {
    name: "Choose Crew",
    completed: () => get("_pirateRealmShip").length > 0,
    ready: () =>
      get("prAlways") ||
      (get("_prToday") &&
        globalOptions.target === $monster`cockroach` &&
        have(eyepatch) &&
        get("pirateRealmUnlockedAnemometer")),
    do: (): void => {
      visitUrl("place.php?whichplace=realm_pirate&action=pr_port");
      runChoice(1); // Head to Groggy's
      runChoice(1); // Select the first crew-member. Better options exist probably.
      runChoice(4); // Grab the Anemometer
      if (get("pirateRealmStormsEscaped") >= 10) {
        runChoice(4); // Swift Clipper, if it's unlocked
      } else {
        runChoice(3); // Otherwise, Speedy Caravel
      }
      runChoice(1); // Head to the sea
    },
    outfit: (): Outfit => {
      return freeFightOutfit({ acc3: eyepatch });
    },
    combat: new GarboStrategy(() => Macro.basicCombat()),
    spendsTurn: false,
  };
}

export function sailToCrabIsland(): GarboTask {
  return {
    name: "Sail to Crab Island",
    completed: () => get("_pirateRealmShip").length > 0,
    ready: () =>
      (get("_questPirateRealm") && get("prAlways")) ||
      (get("_prToday") &&
        globalOptions.target === $monster`cockroach` &&
        have(eyepatch) &&
        get("pirateRealmUnlockedAnemometer")),
    do: $location`Sailing the PirateRealm Seas`,
    choices: {
      1365: 1,
      1352: 1,
      1364: get("_pirateRealmShip") === "Speedy Caravel" ? 1 : 2,
      1361: 1,
      1357: 3,
      1360: 6, // I hate this but don't know how to do it better!
      1356: 3,
      1362: 2,
      1363: 1,
      1359: 1,
      1358: 1,
      1355: 1,
      1367: 2, // If we knew we had glue we could choose glue, but we can't know that
    },
    outfit: (): Outfit => {
      return freeFightOutfit({ acc3: eyepatch });
    },
    combat: new GarboStrategy(() => Macro.basicCombat()),
    spendsTurn: true,
    limit: { turns: get("_pirateRealmShipSpeed") + 2 },
  };
}

export function runToGiantGiantCrab(): GarboTask {
  return {
    name: "Pre-Giant Giant Crab",
    completed: () => get("_pirateRealmIslandMonstersDefeated") >= 4,
    ready: () => step("_questPirateRealm") === 4,
    do: $location`PirateRealm Island`,
    outfit: (): Outfit => {
      return freeFightOutfit({ acc3: eyepatch });
    },
    combat: new GarboStrategy(() => Macro.basicCombat()),
    spendsTurn: true,
    limit: { turns: get("_pirateRealmShipSpeed") + 2 },
  };
}

export function runGiantGiantCrab(): GarboTask {
  return {
    name: "Giant Giant Crab",
    completed: () => step("_questPirateRealm") === 6,
    ready: () => get("_pirateRealmIslandMonstersDefeated") >= 4,
    do: $location`PirateRealm Island`,
    outfit: (): Outfit => {
      return meatTargetOutfit({ acc3: eyepatch });
    },
    combat: new GarboStrategy(() => Macro.basicCombat()),
    spendsTurn: true,
  };
}

export function selectTrashIsland(): GarboTask {
  return {
    name: "Select Trash Island",
    completed: () => get("_lastPirateRealmIsland") === $location`Trash Island`,
    ready: () => step("_questPirateRealm") === 6,
    do: $location`Sailing the PirateRealm Seas`,
    choices: { 1353: 5 }, // Select Trash Island
    outfit: (): Outfit => {
      return meatTargetOutfit({ acc3: eyepatch });
    },
    combat: new GarboStrategy(() => Macro.basicCombat()),
    spendsTurn: false,
  };
}

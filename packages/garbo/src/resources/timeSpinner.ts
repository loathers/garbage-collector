import {
  abort,
  availableChoiceSelectInputs,
  handlingChoice,
  lastChoice,
  Monster,
  print,
  runChoice,
  visitUrl,
} from "kolmafia";
import { HIGHLIGHT } from "../lib";

const SPINNING_YOUR_TIME_SPINNER = 1195;
const TRAVEL_TO_A_RECENT_FIGHT = 1196;

const refusedMonsterIds = new Set<number>();

/**
 * Whether the Time-Spinner has declined to travel to a monster this run.
 * Refusals spend no minutes, so sources must check this or they re-offer.
 * @param monster The monster to check
 * @returns Whether a travel to this monster was refused
 */
export function timeSpinnerRefused(monster: Monster): boolean {
  return refusedMonsterIds.has(monster.id);
}

/**
 * Whether a monster is on the <select name="monid"> in choice 1196.
 * @param monster The monster to look for
 * @returns Whether the monster is offered, or null if no list was found
 */
function offersMonster(monster: Monster): boolean | null {
  const monids = availableChoiceSelectInputs(1)["monid"];
  if (!monids || Object.keys(monids).length === 0) return null;
  if (`${monster.id}` in monids) return true;
  print(
    `The Time-Spinner is only offering: ${Object.values(monids).join(", ")}`,
    HIGHLIGHT,
  );
  return false;
}

/**
 * Record a refused travel and leave the Time-Spinner choice. An open choice
 * blocks every later equipment change.
 * @param monster The monster the Time-Spinner would not travel to
 */
function escapeRefusal(monster: Monster): void {
  refusedMonsterIds.add(monster.id);
  print(
    `The Time-Spinner would not travel to a ${monster}; it is no longer in the recent-fight list. Backing out of the choice.`,
    HIGHLIGHT,
  );
  // "Maybe Later" returns to 1195, which any non-choice request leaves.
  if (lastChoice() === TRAVEL_TO_A_RECENT_FIGHT) runChoice(2);
  if (handlingChoice() && lastChoice() === SPINNING_YOUR_TIME_SPINNER) {
    visitUrl("main.php");
  }
  if (handlingChoice()) {
    abort(
      `Still stuck in choice ${lastChoice()} after the Time-Spinner refused to fight a ${monster}. Resolve it in the relay browser before continuing.`,
    );
  }
}

/**
 * From the menu that using the Time-Spinner opens, travel to a recent fight.
 * @param monster The monster to fight
 * @returns Whether a fight started, rather than the Time-Spinner refusing
 */
export function travelToRecentFight(monster: Monster): boolean {
  // runChoice() sends nothing outside a choice, so check each page is open.
  if (!handlingChoice() || lastChoice() !== SPINNING_YOUR_TIME_SPINNER) {
    abort("Using the Time-Spinner did not open its menu.");
  }
  runChoice(1);
  if (!handlingChoice() || lastChoice() !== TRAVEL_TO_A_RECENT_FIGHT) {
    abort("The Time-Spinner menu did not open the recent-fight list.");
  }
  const offered = offersMonster(monster);
  if (offered === false) {
    escapeRefusal(monster);
    return false;
  }
  if (offered === null) {
    print(
      "Could not find the Time-Spinner's recent-fight list on the page; attempting the travel anyway.",
      HIGHLIGHT,
    );
  }
  runChoice(1, false, `monid=${monster.id}`);
  if (handlingChoice()) {
    escapeRefusal(monster);
    return false;
  }
  return true;
}

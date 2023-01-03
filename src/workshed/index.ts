import {
  getWorkshed,
  haveEffect,
  Item,
  print,
  toItem,
  totalTurnsPlayed,
  use,
  visitUrl,
} from "kolmafia";
import { $effect, $item, $items, AsdonMartin, clamp, get, have, property } from "libram";
import { dietCompleted } from "../diet";
import { globalOptions } from "../lib";
import { potionSetupCompleted } from "../potions";
import { estimatedTurns } from "../turns";
import {
  defaultPieces,
  grabMedicine,
  isTrainsetConfigurable,
  setTrainsetConfiguration,
} from "./utils";

class GarboWorkshed {
  workshed: Item;
  done: () => boolean;
  action: () => void;

  constructor(workshed: Item, done?: () => boolean, action?: () => void) {
    this.workshed = workshed;
    this.done =
      done ??
      (() => {
        return true;
      });
    this.action =
      action ??
      (() => {
        return;
      });
  }
}

export function currentWorkshed(): GarboWorkshed {
  return worksheds.find(({ workshed }) => workshed === getWorkshed()) ?? defaultWorkshed;
}

export function getGarboWorkshed(item: Item): GarboWorkshed {
  return worksheds.find(({ workshed }) => workshed === item) ?? defaultWorkshed;
}

const defaultWorkshed = new GarboWorkshed($item`none`);

const worksheds = [
  new GarboWorkshed(
    $item`model train set`,
    () => {
      // We should always get value from the trainset, so we would never switch from it
      return false;
    },
    () => {
      if (!isTrainsetConfigurable()) return;
      else if (defaultPieces.join(",") === get("trainsetConfiguration", "")) return;
      setTrainsetConfiguration(defaultPieces);
    }
  ),
  new GarboWorkshed(
    $item`cold medicine cabinet`,
    () => {
      return get("_coldMedicineConsults") >= 5;
    },
    () => {
      if (property.getNumber("_nextColdMedicineConsult") > totalTurnsPlayed()) return;
      grabMedicine();
    }
  ),
  new GarboWorkshed(
    $item`Asdon Martin keyfob`,
    () => {
      return (
        haveEffect($effect`Driving Observantly`) >=
        estimatedTurns() +
          (globalOptions.ascending ? 0 : 400 + clamp((get("valueOfAdventure") - 4000) / 10, 0, 300))
      );
    },
    () => {
      AsdonMartin.drive(
        $effect`Driving Observantly`,
        estimatedTurns() +
          (globalOptions.ascending ? 0 : 400 + clamp((get("valueOfAdventure") - 4000) / 10, 0, 300))
      );
    }
  ),
  new GarboWorkshed(
    $item`Little Geneticist DNA-Splicing Lab`,
    () => {
      // This will likely always return true or false for now, depending on the start state of garbo
      // Since we don't actually support using the syringe in combat at this time, the counter will never change
      return get("_dnaPotionsMade") >= 3;
    },
    () => {
      // Just grab whatever tonics for now, since we don't actually have support for DNA
      const page = visitUrl("campground.php?action=workshed");
      if (page.includes("Human-")) {
        visitUrl("campground.php?action=dnapotion");
      }
    }
  ),
  new GarboWorkshed(
    $item`spinning wheel`,
    () => {
      return get("_spinningWheel");
    },
    () => {
      // We simply assume you will not gain a level while garboing, since we do not do powerlevellings
      // So we will just use the spinning wheel immediately
      visitUrl("campground.php?action=spinningwheel");
    }
  ),
  ...$items`diabolic pizza cube, portable Mayo Clinic, warbear high-efficiency still, warbear induction oven`.map(
    (item) => new GarboWorkshed(item, dietCompleted)
  ),
  ...$items`warbear chemistry lab, warbear LP-ROM burner`.map(
    (item) => new GarboWorkshed(item, potionSetupCompleted)
  ),
  ...$items`snow machine, warbear jackhammer drill press, warbear auto-anvil`.map(
    (item) => new GarboWorkshed(item)
  ),
];

const nextWorkshed =
  worksheds.find((workshed) => workshed.workshed === toItem(get("_garboNextWorkshed", ""))) ??
  defaultWorkshed;

if (nextWorkshed.workshed === $item`none` && get("_garboNextWorkshed", "").length > 0) {
  throw new Error(`Error: Could not find matching workshed for ${get("_garboNextWorkshed", "")}`);
}

if (
  currentWorkshed().workshed === $item`model train set` &&
  nextWorkshed.workshed !== $item`none`
) {
  print(
    `Warning: We currently do not support switching from the model train set to another workshed, so ${nextWorkshed.workshed} will not be set-up during this run of garbo!`,
    "red"
  );
}

export function handleWorkshed(): void {
  if (!currentWorkshed().done()) currentWorkshed().action();
  if (
    !get("_workshedItemUsed") &&
    currentWorkshed().done() &&
    nextWorkshed.workshed !== $item`none` &&
    have(nextWorkshed.workshed)
  ) {
    use(nextWorkshed.workshed);
    if (!currentWorkshed().done()) currentWorkshed().action();
  }
}

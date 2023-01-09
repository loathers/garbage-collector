import {
  getWorkshed,
  haveEffect,
  Item,
  print,
  toInt,
  toItem,
  totalTurnsPlayed,
  use,
  visitUrl,
} from "kolmafia";
import { $effect, $item, $items, AsdonMartin, clamp, DNALab, get, have } from "libram";
import { dietCompleted } from "../diet";
import { globalOptions } from "../config";
import { potionSetupCompleted } from "../potions";
import { estimatedTurns } from "../turns";
import {
  defaultPieces,
  getTrainsetConfiguration,
  grabMedicine,
  isTrainsetConfigurable,
  setTrainsetConfiguration,
  TrainsetPiece,
} from "./utils";

class GarboWorkshed {
  workshed: Item;
  done = () => true;
  action = () => {
    return;
  };
  constructor(workshed: Item, done?: () => boolean, action?: () => void) {
    this.workshed = workshed;
    if (done) this.done = done;
    if (action) this.action = action;
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
      if (get("trainsetConfiguration") === "") {
        print("Reconfiguring trainset, as our next station is empty", "blue");
        return setTrainsetConfiguration(defaultPieces);
      } else {
        const pieces = getTrainsetConfiguration();
        const offset = toInt(get("trainsetPosition")) % 8;
        const nextPiece = pieces[offset];

        print(`Reconfiguring trainset, as our next station is ${String(nextPiece)}`, "blue");
        if ([TrainsetPiece.DOUBLE_NEXT_STATION, TrainsetPiece.GAIN_MEAT].includes(nextPiece)) {
          return;
        }

        const newPieces: TrainsetPiece[] = [];
        for (let i = 0; i < 8; i++) {
          const newPos = (i + offset) % 8;
          newPieces[newPos] = defaultPieces[i];
        }

        return setTrainsetConfiguration(newPieces);
      }
    }
  ),
  new GarboWorkshed(
    $item`cold medicine cabinet`,
    () => {
      return get("_coldMedicineConsults") >= 5;
    },
    () => {
      if (get("_nextColdMedicineConsult") > totalTurnsPlayed()) return;
      grabMedicine();
    }
  ),
  new GarboWorkshed(
    $item`Asdon Martin keyfob`,
    () => {
      return (
        haveEffect($effect`Driving Observantly`) >=
        estimatedTurns() +
          (globalOptions.ascend ? 0 : 400 + clamp((get("valueOfAdventure") - 4000) / 8, 0, 600))
      );
    },
    () => {
      AsdonMartin.drive(
        $effect`Driving Observantly`,
        estimatedTurns() +
          (globalOptions.ascend ? 0 : 400 + clamp((get("valueOfAdventure") - 4000) / 8, 0, 600))
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
      if (get("dnaSyringe")) DNALab.makeTonic(3);
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

let _nextWorkshed: GarboWorkshed | null = null;

function nextWorkshed(): GarboWorkshed {
  _nextWorkshed ??=
    worksheds.find((workshed) => workshed.workshed === toItem(globalOptions.workshed)) ??
    defaultWorkshed;
  return _nextWorkshed;
}

if (nextWorkshed().workshed === $item`none` && globalOptions.workshed.length > 0) {
  throw new Error(`Error: Could not find matching workshed for ${globalOptions.workshed}`);
}

if (
  currentWorkshed().workshed === $item`model train set` &&
  nextWorkshed().workshed !== $item`none`
) {
  print(
    `Warning: We currently do not support switching from the model train set to another workshed, so ${
      nextWorkshed().workshed
    } will not be set-up during this run of garbo!`,
    "red"
  );
}

export function handleWorkshed(): void {
  if (!currentWorkshed().done()) currentWorkshed().action();
  if (
    !get("_workshedItemUsed") &&
    currentWorkshed().done() &&
    nextWorkshed().workshed !== $item`none` &&
    have(nextWorkshed().workshed)
  ) {
    use(nextWorkshed().workshed);
    if (!currentWorkshed().done()) currentWorkshed().action();
  }
}

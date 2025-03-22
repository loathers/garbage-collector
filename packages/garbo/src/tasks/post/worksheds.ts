import {
  getWorkshed,
  haveEffect,
  Item,
  myTotalTurnsSpent,
  totalTurnsPlayed,
  use,
  visitUrl,
} from "kolmafia";
import {
  $effect,
  $item,
  $items,
  AsdonMartin,
  DNALab,
  get,
  have,
  TakerSpace,
} from "libram";
import { globalOptions } from "../../config";
import { potionSetupCompleted } from "../../potions";
import { estimatedGarboTurns, estimatedTurnsTomorrow } from "../../turns";
import {
  bestTakerspaceItem,
  grabMedicine,
  rotateToOptimalCycle,
  trainNeedsRotating,
} from "../../resources";
import { GarboPostTask } from "./lib";
type WorkshedOptions = {
  workshed: Item;
  done?: () => boolean;
  action?: () => void;
  minTurns?: number;
  available?: () => boolean;
};
class GarboWorkshed {
  workshed: Item;
  done?: () => boolean;
  action?: () => void;
  minTurns?: number;
  available = () => true;
  constructor(options: WorkshedOptions) {
    this.workshed = options.workshed;
    if (options.done) this.done = options.done;
    if (options.action) this.action = options.action;
    if (options.available) this.available = options.available;
    this.minTurns = options.minTurns ?? 0;
  }

  canRemove(): boolean {
    return (
      (this.done?.() ?? true) ||
      estimatedGarboTurns() <= (GarboWorkshed.next?.minTurns ?? 0)
    );
  }

  use(): void {
    if (!this.done?.()) this.action?.();
  }

  static get(item: Item | null): GarboWorkshed | null {
    return worksheds.find(({ workshed }) => workshed === item) ?? null;
  }

  static get current(): GarboWorkshed | null {
    return GarboWorkshed.get(getWorkshed());
  }

  static get next(): GarboWorkshed | null {
    if (get("_workshedItemUsed") || getWorkshed() === globalOptions.workshed) {
      return null;
    }
    return GarboWorkshed.get(globalOptions.workshed);
  }

  static useNext(): GarboWorkshed | null {
    if (get("_workshedItemUsed")) return null;
    const next = GarboWorkshed.next;
    if (next && have(next.workshed)) {
      use(next.workshed);
    }
    return GarboWorkshed.current;
  }
}

let _attemptedMakingTonics = false;
let _lastCMCTurn = myTotalTurnsSpent();
const worksheds = [
  new GarboWorkshed({
    workshed: $item`model train set`,
    // We should always get value from the trainset, so we would never switch from it
    done: () => false,
    available: trainNeedsRotating,
    action: rotateToOptimalCycle,
  }),
  new GarboWorkshed({
    workshed: $item`cold medicine cabinet`,
    done: () => get("_coldMedicineConsults") >= 5,
    available: () =>
      get("_nextColdMedicineConsult") <= totalTurnsPlayed() &&
      myTotalTurnsSpent() !== _lastCMCTurn, // TODO: Ensure that we have a good expected cmc result
    action: () => {
      grabMedicine();
      _lastCMCTurn = myTotalTurnsSpent();
    },
    minTurns: 80,
  }),
  new GarboWorkshed({
    workshed: $item`Asdon Martin keyfob (on ring)`,
    done: () => {
      return (
        haveEffect($effect`Driving Observantly`) >=
        estimatedGarboTurns() +
          (globalOptions.ascend ? 0 : estimatedTurnsTomorrow)
      );
    },
    action: () => {
      AsdonMartin.drive(
        $effect`Driving Observantly`,
        estimatedGarboTurns() +
          (globalOptions.ascend ? 0 : estimatedTurnsTomorrow),
      );
    },
  }),
  new GarboWorkshed({
    workshed: $item`Little Geneticist DNA-Splicing Lab`,
    done: () => {
      // This will likely always return true or false for now, depending on the start state of garbo
      // Since we don't actually support using the syringe in combat at this time, the counter will never change
      return _attemptedMakingTonics || get("_dnaPotionsMade") >= 3;
    },
    action: () => {
      // Just grab whatever tonics for now, since we don't actually have support for DNA
      if (get("dnaSyringe")) DNALab.makeTonic(3);
      _attemptedMakingTonics = true;
    },
  }),
  new GarboWorkshed({
    workshed: $item`spinning wheel`,
    done: () => get("_spinningWheel"),
    action: () => {
      // We simply assume you will not gain a level while garboing, since we do not do powerlevellings
      // So we will just use the spinning wheel immediately
      visitUrl("campground.php?action=spinningwheel");
    },
  }),
  new GarboWorkshed({
    workshed: $item`TakerSpace letter of Marque`,
    done: () =>
      [...TakerSpace.allRecipes().keys()].every(
        (item) => !TakerSpace.canMake(item),
      ),
    action: () => {
      let best: Item | null = bestTakerspaceItem();
      while (best) {
        TakerSpace.make(best);
        best = bestTakerspaceItem();
      }
    },
    available: () =>
      (GarboWorkshed.next && !get("_workshedItemUsed")) || globalOptions.ascend,
  }),
  ...$items`diabolic pizza cube, portable Mayo Clinic, warbear high-efficiency still, warbear induction oven`.map(
    (item) =>
      new GarboWorkshed({
        workshed: item,
        done: () => globalOptions.dietCompleted,
      }),
  ),
  ...$items`warbear chemistry lab, warbear LP-ROM burner`.map(
    (item) => new GarboWorkshed({ workshed: item, done: potionSetupCompleted }),
  ),
  ...$items`TakerSpace letter of Marque, snow machine, warbear jackhammer drill press, warbear auto-anvil`.map(
    (item) => new GarboWorkshed({ workshed: item }),
  ),
];

function workshedTask(workshed: GarboWorkshed): GarboPostTask {
  return {
    name: `Workshed: ${workshed.workshed}`,
    completed: () => workshed.done?.() ?? true,
    ready: () =>
      getWorkshed() === workshed.workshed &&
      workshed.available() &&
      !!workshed.action,
    do: () => workshed.use(),
    available: () =>
      [GarboWorkshed.current?.workshed, GarboWorkshed.next?.workshed].includes(
        workshed.workshed,
      ),
  };
}

const SAFETY_TURNS_THRESHOLD = 25;
export default function workshedTasks(): GarboPostTask[] {
  return [
    ...worksheds.map(workshedTask),
    {
      name: "Swap Workshed",
      completed: () => get("_workshedItemUsed"),
      ready: () => {
        const canRemove = GarboWorkshed.current?.canRemove() ?? true;
        const haveNext =
          GarboWorkshed.next !== null && have(GarboWorkshed.next.workshed);
        const enoughTurns =
          !GarboWorkshed.next?.minTurns ||
          GarboWorkshed.next.minTurns + SAFETY_TURNS_THRESHOLD >
            estimatedGarboTurns();
        return canRemove && haveNext && enoughTurns;
      },
      do: () => GarboWorkshed.useNext(),
      available: () => !get("_workshedItemUsed") && !!GarboWorkshed.next,
    },
  ];
}

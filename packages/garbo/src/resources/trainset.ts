import { TrainSetManager } from "garbo-lib";
import { $item, $items, $monster, TrainSet } from "libram";
import { globalOptions } from "../config";
import { garboAverageValue, garboValue } from "../garboValue";
import { copyTargetCount } from "../target/fights";
import { estimatedGarboTurns } from "../turns";

let _trainSetManager: TrainSetManager;
export const trainSetManager = () =>
  (_trainSetManager ??= new TrainSetManager({
    averageItemValue: garboAverageValue,
    stationValues: new Map([
      [
        TrainSet.Station.TRACKSIDE_DINER,
        () =>
          globalOptions.target === $monster`Witchess Knight` &&
          copyTargetCount() > 0
            ? garboValue($item`jumping horseradish`)
            : garboAverageValue(
                ...$items`bowl of cottage cheese, hot buttered roll, toast`,
              ),
      ],
    ]),
    ascend: globalOptions.ascend,
    estimatedTurns: estimatedGarboTurns,
  }));

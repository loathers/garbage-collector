import { AutumnAtonManager } from "garbo-lib";
import { globalOptions } from "../config";
import { garboAverageValue } from "../garboValue";
import { estimatedGarboTurns, estimatedTurnsTomorrow } from "../turns";

let _autumnAtonManager: AutumnAtonManager;
export const autumnAtonManager = () =>
  (_autumnAtonManager ??= new AutumnAtonManager({
    averageItemValue: garboAverageValue,
    estimatedTurns: estimatedGarboTurns,
    estimatedTurnsTomorrow: () =>
      globalOptions.ascend ? 0 : estimatedTurnsTomorrow,
  }));

import {
  availableChoiceOptions,
  ChoiceAdventureScript,
  runChoice,
} from "kolmafia";
import { mobiusChoice } from "./resources/mobiusRing";

export const main: ChoiceAdventureScript = (choiceNumber: number) => {
  const options = availableChoiceOptions();
  switch (choiceNumber) {
    case 1562:
      return void runChoice(mobiusChoice(options));
  }
};

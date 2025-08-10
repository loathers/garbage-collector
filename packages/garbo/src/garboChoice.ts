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
  if (choiceNumber === 1224) {
    runChoice(3);
  }
  if (choiceNumber === 1226) {
    runChoice(2);
  }
  if (choiceNumber === 1228) {
    runChoice(3);
  }
};

import { runChoice } from "kolmafia";
import { highestPriorityOption } from "packagesgarbosrc\resourcesdarts.ts";

export function main(choiceNumber: number) {
  switch (choiceNumber) {
    case 1525:
      return runChoice(highestPriorityOption());
  }
}

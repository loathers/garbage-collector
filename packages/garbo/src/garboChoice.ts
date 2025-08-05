import { availableChoiceOptions,  print, runChoice } from "kolmafia";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function main(choice: number, page: string) {
  const options: { [key: number]: string } = availableChoiceOptions();

  // Everfull dart handling
  if (choice === 1562) {
    const priority: { [key: string]: number } = {
      "I'm not messing with the timeline!": 0,
      "Go back and make the Naughty Sorceress naughty again": 0,
      "Bake Susie a cupcake": 0,
      "Borrow a cup of sugar from yourself": 0,
      "Draw a goatee on yourself": 0,
      "Go back and take a 20-year-long nap": 1,
      "Go back and set an alarm": 1,
      "Steal a club from the past": 0,
      "Hey, free gun!": 0,
      "Go back and write a best-seller.": 0,
      "Play Schroedinger's Prank on yourself": 0,
      "Peek in on your future": 0,
      "Mind your own business": 0,
      "Plant some trees and harvest them in the future": 0,
      "Cheeze it, it's the pigs!": 0,
      "Meet your parents when they were young": 0,
      "Go for a nature walk": 0,
      "Defend yourself": 0,
      "Borrow meat from your future": 0,
      "Take the long odds on the trifecta": 0,
      "Give your past self investment tips": 0,
      "Make friends with a famous poet": 0,
      "Shoot yourself in the foot": 0,
      "Lift yourself up by your bootstraps": 0,
      "Plant some seeds in the distant past": 0,
    };

    let currentScore = 999999999;
    let choiceToRun = 1;

    for (const [option, optionText] of Object.entries(options)) {
      if (!priority[optionText]) {
        print(`choice "${optionText}" not in priority list`, "red");
        continue;
      }

      if (priority[optionText] >= currentScore) {
        continue;
      }

      currentScore = priority[optionText];
      choiceToRun = parseInt(option);
    }

    runChoice(choiceToRun);
  }
}

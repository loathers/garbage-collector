import { maxBy } from "libram";


export const MOBIUS_OPTIONS: string[] = [
  "Go back and take a 20-year-long nap",
  "Go back and set an alarm",
  "I'm not messing with the timeline!",
  "Go back and make the Naughty Sorceress naughty again",
  "Bake Susie a cupcake",
  "Borrow a cup of sugar from yourself",
  "Draw a goatee on yourself",
  "Steal a club from the past",
  "Hey, free gun!",
  "Go back and write a best-seller.",
  "Play Schroedinger's Prank on yourself",
  "Peek in on your future",
  "Mind your own business",
  "Plant some trees and harvest them in the future",
  "Cheeze it, it's the pigs!",
  "Meet your parents when they were young",
  "Go for a nature walk",
  "Defend yourself",
  "Borrow meat from your future",
  "Take the long odds on the trifecta",
  "Give your past self investment tips",
  "Make friends with a famous poet",
  "Shoot yourself in the foot",
  "Lift yourself up by your bootstraps",
  "Plant some seeds in the distant past",
];

export function mobiusChoice(options: { [key: number]: string }) {
  return Number(
    maxBy(
      Object.entries(options),
      ([text]) =>
        MOBIUS_OPTIONS.includes(text) ? MOBIUS_OPTIONS.indexOf(text) : Infinity,
      true,
    )[0],
  );
}
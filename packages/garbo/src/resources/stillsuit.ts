import { get, StillSuit } from "libram";

const currentAdventures = () => StillSuit.distillateAdventures();
const nextDistillateSweat = () =>
  Math.ceil((currentAdventures() + 0.5) ** (5 / 2));
const previousDistillateSweat = () =>
  Math.ceil(Math.max(currentAdventures() - 0.5, 0) ** (5 / 2));

export const adventuresPerSweat = () =>
  1 / (nextDistillateSweat() - previousDistillateSweat());

export const turnsNeededForNextAdventure = (equipped = true) =>
  Math.ceil(
    (nextDistillateSweat() - get("familiarSweat")) / (equipped ? 3 : 1),
  );

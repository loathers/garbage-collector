import { StillSuit } from "libram";

const currentAdventures = () => StillSuit.distillateAdventures();
const nextDistillateSweat = () => (currentAdventures() + 0.5) ** (5 / 2);
const previousDistillateSweat = () => (currentAdventures() - 0.5) ** (5 / 2);

export const adventuresPerSweat = () =>
  1 / (nextDistillateSweat() - previousDistillateSweat());

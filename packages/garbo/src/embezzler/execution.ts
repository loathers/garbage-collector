import { CopyTargetFight } from "./fights";
import { RunOptions } from "./lib";
import { EmbezzlerFightRunOptions } from "./staging";

export function runEmbezzlerFight(
  fight: CopyTargetFight,
  options: Partial<RunOptions> = {},
): void {
  const fullOptions = new EmbezzlerFightRunOptions(fight, options);
  fight.run(fullOptions);
}

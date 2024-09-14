import { CopyTargetFight } from "./fights";
import { RunOptions } from "./lib";
import { TargetFightRunOptions } from "./staging";

export function runTargetFight(
  fight: CopyTargetFight,
  options: Partial<RunOptions> = {},
): void {
  const fullOptions = new TargetFightRunOptions(fight, options);
  fight.run(fullOptions);
}

import { EmbezzlerFight } from "./fights";
import { RunOptions } from "./lib";
import { EmbezzlerFightRunOptions } from "./staging";

export function runEmbezzlerFight(fight: EmbezzlerFight, options: Partial<RunOptions> = {}): void {
  const fullOptions = new EmbezzlerFightRunOptions(fight, options);
  fight.run(fullOptions);
}

import { Item } from "kolmafia";
import { get, JuneCleaver, sum } from "libram";
import { globalOptions } from "../../config";
import { bestJuneCleaverOption, juneCleaverChoiceValues, valueJuneCleaverOption } from "../../lib";
import { estimatedTurns } from "../../turns";
import { BonusEquipMode, toBonus } from "../lib";

let juneCleaverEV: number | null = null;
function valueCleaver(mode: BonusEquipMode): number {
  if (get("_juneCleaverFightsLeft") > estimatedTurns() || !get("_juneCleaverFightsLeft")) return 0;

  // If we're ascending then the chances of hitting choices in the queue is reduced
  if (globalOptions.ascend && estimatedTurns() <= 180 && JuneCleaver.getInterval() === 30) {
    const availEV =
      sum([...JuneCleaver.choicesAvailable()], (choice) =>
        valueJuneCleaverOption(juneCleaverChoiceValues[choice][bestJuneCleaverOption(choice)])
      ) / JuneCleaver.choicesAvailable().length;
    const queueEV =
      sum([...JuneCleaver.queue()], (choice) => {
        const choiceValue = valueJuneCleaverOption(
          juneCleaverChoiceValues[choice][bestJuneCleaverOption(choice)]
        );
        const cleaverEncountersLeft = Math.floor(estimatedTurns() / 30);
        const encountersToQueueExit = 1 + JuneCleaver.queue().indexOf(choice);
        const chancesLeft = Math.max(0, cleaverEncountersLeft - encountersToQueueExit);
        const encounterProbability = 1 - Math.pow(2 / 3, chancesLeft);
        return choiceValue * encounterProbability;
      }) / JuneCleaver.queue().length;
    return (queueEV + availEV) / 30;
  }

  if (!juneCleaverEV) {
    juneCleaverEV =
      sum([...JuneCleaver.choices], (choice) =>
        valueJuneCleaverOption(juneCleaverChoiceValues[choice][bestJuneCleaverOption(choice)])
      ) / JuneCleaver.choices.length;
  }

  const interval = mode === BonusEquipMode.EMBEZZLER ? 30 : JuneCleaver.getInterval();
  return juneCleaverEV / interval;
}
const juneCleaver = { item: JuneCleaver.cleaver, value: valueCleaver };
export default (mode: BonusEquipMode): [Item, number] | null => toBonus(juneCleaver, mode);

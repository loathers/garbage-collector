import { abort, runChoice, xpath } from "kolmafia";
import { get, NumericOrStringProperty } from "libram";

function getChoiceOption(): [number, string | null] {
  const option = get("choiceAdventure1557" as NumericOrStringProperty);
  if (typeof option === "number") return [option, null];
  const [value, addendums] = option.split("&", 2);
  return [Number(value), addendums];
}

export function runPeridotChoice(pageText: string) {
  const [option, addendums] = getChoiceOption();
  if (!addendums) return void runChoice(option);
  if (!addendums.startsWith("bandersnatch="))
    abort(`Invalid peridot args: ${addendums}`);
  const monsterId = addendums.slice("bandersnatch=".length);

  if (
    !xpath(
      pageText,
      `//form//input[@name='bandersnatch'][value='${monsterId}']`,
    ).length
  ) {
    return void runChoice(2); // Monster not available
  }
  return void runChoice(option, addendums);
}

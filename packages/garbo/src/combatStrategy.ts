import { CombatStrategy } from "grimoire-kolmafia";
import { customizeMacro, CustomizeMacroOptions, Macro } from "./combat";
import { GarboContext } from "./tasks/context";

export class GarboStrategy extends CombatStrategy<never, GarboContext> {
  constructor(
    macro: (context: GarboContext) => Macro,
    postAuto = macro,
    useAutoAttack = () => true,
    options: Partial<CustomizeMacroOptions> = {},
  ) {
    super();
    const macroCustom = (context: GarboContext) =>
      customizeMacro(macro(context), options);
    if (useAutoAttack()) {
      const postAutoCustom = (context: GarboContext) =>
        customizeMacro(postAuto(context), options);
      this.autoattack(macroCustom).macro(postAutoCustom);
    } else {
      this.macro(macroCustom);
    }
  }
}

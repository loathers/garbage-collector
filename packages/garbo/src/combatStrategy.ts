import { CombatStrategy } from "grimoire-kolmafia";
import { customizeMacro, CustomizeMacroOptions, Macro } from "./combat";

export class GarboStrategy extends CombatStrategy {
  constructor(
    macro: () => Macro,
    postAuto = macro,
    useAutoAttack = () => true,
    options: Partial<CustomizeMacroOptions> = {},
  ) {
    super();
    const macroCustom = () => customizeMacro(macro(), options);
    if (useAutoAttack()) {
      const postAutoCustom = () => customizeMacro(postAuto(), options);
      this.autoattack(macroCustom).macro(postAutoCustom);
    } else {
      this.macro(macroCustom);
    }
  }
}

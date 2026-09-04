import { CombatStrategy } from "grimoire-kolmafia";
import { customizeMacro, CustomizeMacroOptions, Macro } from "./combat";

export class GarboStrategy<Context = unknown> extends CombatStrategy<
  never,
  Context
> {
  constructor(
    macro: (context: Context) => Macro,
    postAuto = macro,
    useAutoAttack = () => true,
    options: Partial<CustomizeMacroOptions> = {},
  ) {
    super();
    const macroCustom = (context: Context) =>
      customizeMacro(macro(context), options);
    if (useAutoAttack()) {
      const postAutoCustom = (context: Context) =>
        customizeMacro(postAuto(context), options);
      this.autoattack(macroCustom).macro(postAutoCustom);
    } else {
      this.macro(macroCustom);
    }
  }
}

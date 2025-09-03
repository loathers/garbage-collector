import { haveEquipped, Location, mallPrice, retrieveItem } from "kolmafia";
import { $item, $location, $skill, get } from "libram";
import { MEAT_TARGET_MULTIPLIER, propertyManager, targetingMeat } from "../lib";
import { checkUnderwater, RunOptions, TargetFightConfigOptions } from "./lib";
import { Macro } from "../combat";
import { wanderer } from "../garboWanderer";
import { globalOptions } from "../config";

const taffyIsWorthIt = () =>
  mallPrice($item`pulled green taffy`) <
    (targetingMeat()
      ? MEAT_TARGET_MULTIPLIER() * get("valueOfAdventure")
      : get("valueOfAdventure")) && retrieveItem($item`pulled green taffy`);

const wandererFailsafeMacro = () =>
  Macro.externalIf(
    haveEquipped($item`backup camera`) &&
      get("_backUpUses") < 11 &&
      get("lastCopyableMonster") === globalOptions.target,
    Macro.if_(
      `!monsterid ${globalOptions.target.id}`,
      Macro.skill($skill`Back-Up to your Last Enemy`),
    ),
  );

export class TargetFightRunOptions implements RunOptions {
  configOptions: TargetFightConfigOptions;
  #macro?: Macro;
  #location?: Location;
  #useAuto?: boolean;
  #action?: string;
  constructor(
    configOptions: TargetFightConfigOptions,
    { macro, location, useAuto, action }: Partial<RunOptions> = {},
  ) {
    this.configOptions = configOptions;
    this.#action = action;
    this.#macro = macro;
    this.#location = location;
    this.#useAuto = useAuto;
  }

  get location(): Location {
    if (this.configOptions.location) return this.configOptions.location;

    const suggestion =
      this.configOptions.draggable &&
      !this.#location &&
      checkUnderwater() &&
      taffyIsWorthIt()
        ? $location`The Briny Deeps`
        : this.#location;

    if (
      (this.configOptions.draggable && !suggestion) ||
      (this.configOptions.draggable === "backup" &&
        suggestion &&
        suggestion.combatPercent < 100)
    ) {
      const wanderOptions = {
        wanderer: this.configOptions.draggable,
        allowEquipment: false,
      };
      const targetLocation = wanderer().getTarget(wanderOptions).location;
      propertyManager.setChoices(wanderer().getChoices(targetLocation));
      return targetLocation;
    }
    return suggestion ?? $location`Noob Cave`;
  }

  get macro(): Macro {
    const baseMacro = this.#macro ?? Macro.target(this.action);
    return this.configOptions.draggable === "wanderer"
      ? wandererFailsafeMacro().step(baseMacro)
      : baseMacro;
  }

  get useAuto(): boolean {
    return this.#useAuto ?? true;
  }

  get action(): string {
    return this.#action ?? "???";
  }
}

import {
  availableAmount,
  bjornifyFamiliar,
  cliExecute,
  enthroneFamiliar,
  equip,
  familiarEquippedEquipment,
  getClanId,
  getClanName,
  handlingChoice,
  Item,
  itemAmount,
  print,
  putStash,
  refreshStash,
  retrieveItem,
  stashAmount,
  takeStash,
  toItem,
  toSlot,
  visitUrl,
} from "kolmafia";
import {
  $familiar,
  $familiars,
  $item,
  $monster,
  $slot,
  Clan,
  get,
  getAcquirePrice,
  getFoldGroup,
  have,
  set,
  unequip,
} from "libram";
import { Macro } from "./combat";
import { globalOptions } from "./config";
import {
  HIGHLIGHT,
  ULTRA_RARE_MONSTERS,
  unlimitedFreeRunList,
  userConfirmDialog,
} from "./lib";

export const stashItems = get("garboStashItems", "")
  .split(",")
  .filter((x) => x.trim().length > 0)
  .map((id) => toItem(id));

export function withStash<T>(itemsToTake: Item[], action: () => T): T {
  const manager = new StashManager();
  try {
    manager.take(...itemsToTake);
    return action();
  } finally {
    manager.putBackAll();
  }
}

export function withVIPClan<T>(action: () => T): T {
  const clanIdOrNameString = globalOptions.prefs.vipClan;
  let clanIdOrName = clanIdOrNameString.match(/^\d+$/)
    ? parseInt(clanIdOrNameString)
    : clanIdOrNameString;
  if (clanIdOrName === "" && have($item`Clan VIP Lounge key`)) {
    if (
      userConfirmDialog(
        "The preference 'garbo_vipClan' is not set. Use the current clan as a VIP clan? (Defaults to yes in 15 seconds)",
        true,
        15000,
      )
    ) {
      clanIdOrName = getClanId();
      globalOptions.prefs.vipClan = `${clanIdOrName}`;
      set("garbo_vipClan", clanIdOrName);
    }
  }
  return withClan(clanIdOrName || getClanId(), action);
}

function withClan<T>(clanIdOrName: string | number, action: () => T): T {
  const startingClanId = getClanId();
  Clan.join(clanIdOrName);
  try {
    return action();
  } finally {
    Clan.join(startingClanId);
  }
}

export class StashManager {
  clanIdOrName: string | number;
  enabled: boolean;
  taken = new Map<Item, number>();

  constructor() {
    const clanIdOrName = globalOptions.prefs.stashClan;
    this.clanIdOrName = clanIdOrName.match(/^\d+$/)
      ? parseInt(clanIdOrName)
      : clanIdOrName;
    this.enabled = ![0, "", "none"].some((id) => id === this.clanIdOrName);
  }

  take(...items: Item[]): void {
    if (items.length === 0) {
      return;
    }
    if (!this.enabled) {
      print(
        `Stash access is disabled. Ignoring request to borrow "${items
          .map((value) => value.name)
          .join(", ")}" from clan stash.`,
        HIGHLIGHT,
      );
      return;
    }
    withClan(this.clanIdOrName, () => {
      for (const item of items) {
        if (have(item)) continue;
        if (getFoldGroup(item).some((fold) => have(fold))) {
          cliExecute(`fold ${item.name}`);
          continue;
        }
        const foldArray = [item, ...getFoldGroup(item)];

        refreshStash();
        for (const fold of foldArray) {
          if (stashAmount(fold) > 0) {
            try {
              if (takeStash(1, fold)) {
                print(
                  `Took ${fold.name} from stash in ${getClanName()}.`,
                  HIGHLIGHT,
                );
                if (fold !== item) cliExecute(`fold ${item.name}`);
                this.taken.set(item, (this.taken.get(item) ?? 0) + 1);
                stashItems.push(fold);
                break;
              } else {
                print(
                  `Failed to take ${
                    fold.name
                  } from the stash. Do you have stash access in ${getClanName()}?`,
                  "red",
                );
              }
            } catch {
              print(
                `Failed to take ${fold.name} from stash in ${getClanName()}.`,
                "red",
              );
            }
          }
        }
        if (have(item)) continue;
      }
    });
  }

  /**
   * Ensure at least one of each of {items} in inventory.
   * @param items Items to take from the stash.
   */
  ensure(...items: Item[]): void {
    this.take(...items.filter((item) => availableAmount(item) === 0));
  }

  putBack(...items: Item[]): void {
    if (items.length === 0) return;
    if (visitUrl("fight.php").includes("You're fighting")) {
      print(
        "In fight, trying to get away to return items to stash...",
        HIGHLIGHT,
      );
      Macro.if_(
        [globalOptions.target, $monster`giant giant crab`],
        Macro.attack().repeat(),
      )
        .if_(ULTRA_RARE_MONSTERS, Macro.abort())
        .tryItem(
          ...unlimitedFreeRunList
            .filter((i) => getAcquirePrice(i) < get("valueOfAdventure"))
            .sort((a, b) => getAcquirePrice(a) - getAcquirePrice(b)),
        )
        .step("runaway")
        .submit();
    } else {
      visitUrl("main.php");
      if (handlingChoice()) {
        print(
          `I'm stuck in a choice, unfortunately, but were I not, I'd like to return the following items to your clan stash:`,
          "red",
        );
        items.forEach((item) => print(`${item.name},`, "red"));
      }
    }
    withClan(this.clanIdOrName, () => {
      for (const item of items) {
        const count = this.taken.get(item) ?? 0;
        if (count > 0) {
          retrieveItem(count, item);

          if (item === $item`Buddy Bjorn`) {
            visitUrl(`desc_item.php?whichitem=${$item`Buddy Bjorn`.descid}`);
            bjornifyFamiliar($familiar.none);
          }
          if (item === $item`Crown of Thrones`) {
            visitUrl(
              `desc_item.php?whichitem=${$item`Crown of Thrones`.descid}`,
            );
            enthroneFamiliar($familiar.none);
          }

          const foldedForms = [item, ...getFoldGroup(item)];
          for (const fold of foldedForms) unequip(fold);

          if (toSlot(item) === $slot`familiar` && !have(item, count)) {
            for (const familiar of $familiars.all().filter(have)) {
              if (familiarEquippedEquipment(familiar) === item) {
                equip(familiar, $item.none);
              }
            }
          }

          if (itemAmount(item) >= count && putStash(count, item)) {
            const index = stashItems.indexOf(item);
            if (index >= 0) stashItems.splice(stashItems.indexOf(item), 1);
            print(
              `Returned ${item.name} to stash in ${getClanName()}.`,
              HIGHLIGHT,
            );
            this.taken.delete(item);
          } else {
            throw `Failed to return ${item.name} to stash.`;
          }
        }
      }
    });
  }

  /**
   * Put all items back in the stash.
   */
  putBackAll(): void {
    this.putBack(...this.taken.keys());
  }
}

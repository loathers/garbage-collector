import {
  availableAmount,
  cliExecute,
  getClanId,
  getClanName,
  print,
  putStash,
  refreshStash,
  retrieveItem,
  stashAmount,
  takeStash,
  userConfirm,
} from "kolmafia";
import { $item, Clan, get, have, set } from "libram";
import { getFoldGroupWithoutEntries } from "./lib";

export function withStash<T>(itemsToTake: Item[], action: () => T) {
  const manager = new StashManager();
  try {
    manager.take(...itemsToTake);
    return action();
  } finally {
    manager.putBackAll();
  }
}

export function withVIPClan<T>(action: () => T) {
  let clanIdOrName: number | string | undefined = get("garbo_vipClan", undefined);
  if (!clanIdOrName && have($item`Clan VIP lounge key`)) {
    if (
      userConfirm(
        "The preference 'garbo_vipClan' is not set. Use the current clan as a VIP clan? (Defaults to yes in 15 seconds)",
        15000,
        true
      )
    ) {
      clanIdOrName = getClanId();
      set("garbo_vipClan", clanIdOrName);
    }
  }
  return withClan(clanIdOrName || getClanId(), action);
}

function withClan<T>(clanIdOrName: string | number, action: () => T) {
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
  taken = new Map<Item, number>();

  constructor(clanIdOrName?: string | number) {
    if (clanIdOrName === undefined) {
      clanIdOrName = get("garbo_stashClan", undefined);
      if (!clanIdOrName) {
        if (
          userConfirm(
            "The preference 'garbo_stashClan' is not set. Use the current clan as a stash clan? (Defaults to yes in 15 seconds)",
            15000,
            true
          )
        ) {
          clanIdOrName = getClanId();
          set("garbo_stashClan", clanIdOrName);
        } else {
          throw "No garbo_stashClan set.";
        }
      }
    }
    this.clanIdOrName = clanIdOrName;
  }

  take(...items: Item[]) {
    withClan(this.clanIdOrName, () => {
      for (const item of items) {
        if (have(item)) continue;
        if (getFoldGroupWithoutEntries(item).some((item) => have(item))) {
          cliExecute(`fold ${item.name}`);
          continue;
        }
        const foldArray = [item, ...getFoldGroupWithoutEntries(item)];

        refreshStash();
        for (const fold of foldArray) {
          try {
            if (stashAmount(fold) > 0) {
              takeStash(1, fold);
              print(`Took ${fold.name} from stash in ${getClanName()}.`, "blue");
              if (fold !== item) cliExecute(`fold ${item.name}`);
              this.taken.set(item, (this.taken.get(item) ?? 0) + 1);
              break;
            }
          } catch {
            print(`Failed to take ${fold.name} from stash in ${getClanName()}.`, "red");
          }
        }
        if (have(item)) continue;
        print(`Couldn't find ${item.name} in clan stash for ${getClanName()}.`, "red");
      }
    });
  }

  /**
   * Ensure at least one of each of {items} in inventory.
   * @param items Items to take from the stash.
   */
  ensure(...items: Item[]) {
    this.take(...items.filter((item) => availableAmount(item) === 0));
  }

  putBack(...items: Item[]) {
    withClan(this.clanIdOrName, () => {
      for (const item of items) {
        const count = this.taken.get(item) ?? 0;
        if (count > 0) {
          retrieveItem(count, item);
          if (putStash(count, item)) {
            print(`Returned ${item.name} to stash in ${getClanName()}.`, "blue");
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
  putBackAll() {
    this.putBack(...this.taken.keys());
  }
}

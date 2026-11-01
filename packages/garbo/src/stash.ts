import {
  bjornifyFamiliar,
  cliExecute,
  closetAmount,
  enthroneFamiliar,
  equip,
  equippedAmount,
  equippedItem,
  familiarEquippedEquipment,
  getClanId,
  getClanName,
  Item,
  itemAmount,
  myFamiliar,
  myMaxhp,
  print,
  putStash,
  refreshStash,
  restoreHp,
  stashAmount,
  takeCloset,
  takeStash,
  toItem,
  use,
} from "kolmafia";
import {
  $familiar,
  $familiars,
  $item,
  $slots,
  arrayToCountedMap,
  Clan,
  examine,
  get,
  getFoldGroup,
  have,
  maxBy,
  set,
  sum,
  unequip,
} from "libram";
import { withClan } from "./clan";
import { prepareForCleanup } from "./cleanup";
import { globalOptions } from "./config";
import { HIGHLIGHT } from "./lib";

type ItemAmounts = Map<Item, number>;

export interface Loan {
  clanId: number;
  item: Item;
  quantity: number;
}

export interface BorrowResult {
  missingItems: ItemAmounts;
}

export interface ReturnResult {
  returnedLoans: Loan[];
  remainingLoans: Loan[];
}

type ItemRequest = Item[] | ItemAmounts;
const DISABLE_HINT =
  "To stop garbo borrowing from a clan stash, set 'garbo_stashClan' to 'none'.";

function forms(item: Item): Item[] {
  return [...new Set([item, ...getFoldGroup(item)])];
}

function canonicalItem(item: Item): Item {
  return maxBy(forms(item), "id", true);
}

interface Ledger {
  version: 1;
  loans: Loan[];
}

interface StoredLoan {
  clanId: number;
  itemId: number;
  quantity: number;
}

interface StoredLedger {
  version: 1;
  loans: StoredLoan[];
}

function readLedger(): Ledger | Item[] {
  const stored = get("garboStashItems", '{"version":1,"loans":[]}').trim();
  if (!stored.startsWith("{")) return stored.split(",").map((id) => toItem(id));

  const ledger: StoredLedger = JSON.parse(stored);
  if (
    ledger.version !== 1 ||
    !Array.isArray(ledger.loans) ||
    !ledger.loans.every(
      (loan) =>
        loan !== null &&
        ["clanId", "itemId", "quantity"].every((key) => key in loan) &&
        Object.values(loan).every(
          (value) => Number.isInteger(value) && value > 0,
        ) &&
        toItem(loan.itemId) !== $item.none,
    )
  ) {
    throw new Error("Invalid garboStashItems ledger!");
  }

  return {
    version: ledger.version,
    loans: ledger.loans.map(({ clanId, itemId, quantity }) => ({
      clanId,
      item: canonicalItem(toItem(itemId)),
      quantity,
    })),
  };
}

type LoansByClan = Map<number, ItemAmounts>;

function groupLoansByClan(loans: Loan[]): LoansByClan {
  const loansByClan: LoansByClan = new Map();

  for (const { clanId, item, quantity } of loans) {
    const clanLoans = loansByClan.get(clanId) ?? new Map<Item, number>();
    clanLoans.set(item, (clanLoans.get(item) ?? 0) + quantity);
    loansByClan.set(clanId, clanLoans);
  }

  return loansByClan;
}

function legacyClanId(): number {
  const preference = get("garbo_stashClan", "");
  if (["", "0", "none"].includes(preference)) {
    throw new Error(
      "Garbo found items still out of the stash from a previous run, but does not know which clan they came from. Set 'garbo_stashClan' to that clan, then run garbo again.",
    );
  }

  if (/^\d+$/.test(preference)) return Number(preference);
  if (preference.toLowerCase() === getClanName().toLowerCase()) {
    return getClanId();
  }

  const clan = Clan.getWhitelisted().find(
    ({ name }) => name.toLowerCase() === preference.toLowerCase(),
  );
  if (!clan) {
    throw new Error(
      `Could not find stash clan '${preference}' on your whitelist. Check 'garbo_stashClan', then run garbo again.`,
    );
  }
  return clan.id;
}

class StashManager {
  private readonly loansByClan: LoansByClan;

  constructor() {
    this.loansByClan = this.loadLedger();
  }

  private loadLedger(): LoansByClan {
    const ledger = readLedger();
    if (!Array.isArray(ledger)) return groupLoansByClan(ledger.loans);

    // Old model doesn't list clan, and just assumes it matches your stashClan
    if (ledger.some((item) => item === $item.none)) {
      throw new Error("Invalid legacy garboStashItems!");
    }

    const counts = arrayToCountedMap(ledger.map(canonicalItem));

    const clanId = legacyClanId();
    const loans = [...counts].map(([item, quantity]) => ({
      clanId,
      item,
      quantity,
    }));

    this.saveLedger(loans);
    return groupLoansByClan(loans);
  }

  private borrowingClan(): string | number | null {
    const preference = globalOptions.prefs.stashClan;
    if (["", "0", "none"].includes(preference)) return null;
    return /^\d+$/.test(preference) ? Number(preference) : preference;
  }

  private saveLedger(loans: Loan[] = this.outstandingLoans()): void {
    const ledger: StoredLedger = {
      version: 1,
      loans: loans.map(({ clanId, item, quantity }) => ({
        clanId,
        itemId: item.id,
        quantity,
      })),
    };

    set("garboStashItems", JSON.stringify(ledger));
  }

  private getLoans(clanId: number): ItemAmounts {
    const currentValue = this.loansByClan.get(clanId);

    if (!currentValue) {
      const loans = new Map<Item, number>();
      this.loansByClan.set(clanId, loans);
      return loans;
    }

    return currentValue;
  }

  private adjustLoan(clanId: number, item: Item, amountChange: number): void {
    const clanLoans = this.getLoans(clanId);
    const amount = (clanLoans.get(item) ?? 0) + amountChange;
    if (amount > 0) {
      clanLoans.set(item, amount);
    } else {
      clanLoans.delete(item);
      if (clanLoans.size === 0) this.loansByClan.delete(clanId);
    }

    this.saveLedger();
  }

  outstandingLoans(): Loan[] {
    return [...this.loansByClan].flatMap(([clanId, clanLoans]) =>
      [...clanLoans].map(([item, quantity]) => ({
        clanId,
        item,
        quantity,
      })),
    );
  }

  // How many the player owns, deliberately excluding loans
  amountOwned(item: Item): number {
    const loanItem = canonicalItem(item);
    const amountBorrowed = sum(
      [...this.loansByClan.values()],
      (clanLoans) => clanLoans.get(loanItem) ?? 0,
    );
    const amountAvailable = this.amountAvailable(item);
    return Math.max(0, amountAvailable - amountBorrowed);
  }

  // Total across all forms
  private amountAvailable(item: Item): number {
    return sum(forms(item), (form) => this.amountInForm(form));
  }

  private amountInForm(item: Item): number {
    const familiarAmount = $familiars
      .all()
      .filter(
        (familiar) =>
          have(familiar) &&
          familiar !== myFamiliar() &&
          familiarEquippedEquipment(familiar) === item,
      ).length;
    return (
      itemAmount(item) +
      closetAmount(item) +
      equippedAmount(item) +
      familiarAmount
    );
  }

  request(items: ItemRequest): BorrowResult {
    return this.borrow(items);
  }

  private borrow(items: ItemRequest, loansToReturn: Loan[] = []): BorrowResult {
    const requestedItems = arrayToCountedMap(items);
    for (const quantity of requestedItems.values()) {
      if (!Number.isInteger(quantity) || quantity < 0) {
        throw new Error(`Invalid stash request quantity: ${quantity}`);
      }
    }

    const clan = this.borrowingClan();
    if (clan === null) {
      return { missingItems: this.itemsNeeded(requestedItems) };
    }

    withClan(clan, DISABLE_HINT, () =>
      this.borrowItems(requestedItems, loansToReturn),
    );

    this.foldRequestedItems(requestedItems);

    return { missingItems: this.itemsNeeded(requestedItems) };
  }

  private borrowItems(
    requestedItems: ItemAmounts,
    loansToReturn: Loan[],
  ): void {
    const requestedFamilies: ItemAmounts = new Map();
    for (const [item, quantity] of requestedItems) {
      const family = canonicalItem(item);
      requestedFamilies.set(
        family,
        (requestedFamilies.get(family) ?? 0) + quantity,
      );
    }

    refreshStash();
    for (const [item, quantity] of requestedFamilies) {
      for (const form of forms(item)) {
        const amountNeeded = Math.max(0, quantity - this.amountAvailable(item));
        const count = Math.min(amountNeeded, stashAmount(form));
        if (count === 0) continue;

        this.borrowItem(form, count, loansToReturn);
      }
    }
  }

  private borrowItem(
    item: Item,
    quantity: number,
    loansToReturn: Loan[],
  ): void {
    const before = itemAmount(item);

    try {
      takeStash(quantity, item);
    } catch (error) {
      print(`Could not borrow ${item.name}: ${error}`, "red");
    } finally {
      const taken = Math.max(0, itemAmount(item) - before);
      if (taken > 0) {
        const loan: Loan = {
          clanId: getClanId(),
          item: canonicalItem(item),
          quantity: taken,
        };
        this.adjustLoan(loan.clanId, loan.item, taken);
        loansToReturn.push(loan);

        print(
          `Took ${taken} ${item.name} from ${getClanName()} stash.`,
          HIGHLIGHT,
        );
      }
    }
  }

  private foldRequestedItems(requestedItems: ItemAmounts): void {
    // Only fold copies beyond the amount requested in their current form.
    for (const [item, quantity] of requestedItems) {
      const amountNeeded = () =>
        Math.max(0, quantity - this.amountInForm(item));
      for (const form of forms(item).filter((form) => form !== item)) {
        const spare = Math.max(
          0,
          this.amountInForm(form) - (requestedItems.get(form) ?? 0),
        );
        const count = Math.min(amountNeeded(), spare);

        for (let i = 0; i < count; i++) {
          if (!this.foldOne(form, item)) break;
        }
      }
    }
  }

  private itemsNeeded(requestedItems: ItemAmounts): ItemAmounts {
    const missingItems = new Map<Item, number>();
    for (const [item, quantity] of requestedItems) {
      const shortfall = quantity - this.amountInForm(item);
      if (shortfall > 0) missingItems.set(item, shortfall);
    }
    return missingItems;
  }

  private foldOne(source: Item, target: Item): boolean {
    this.prepareInventory(source, 1);
    if (itemAmount(source) === 0) return false;
    const before = itemAmount(target);
    const group = getFoldGroup(target);
    // CLI fold command stops when you get only one; we need to be able to obtain multiple
    const cyclic = [
      $item`Spooky Putty sheet`,
      $item`origami pasties`,
      $item`stinky cheese diaper`,
      $item`ice baby`,
      $item`liar's pants`,
    ].some((item) => group.includes(item));
    if (cyclic) {
      const sourceIndex = group.indexOf(source);
      const orderedForms = [
        ...group.slice(sourceIndex),
        ...group.slice(0, sourceIndex),
      ];
      for (const form of orderedForms) {
        if (form === target) break;
        if (
          itemAmount(form) === 0 ||
          !restoreHp(Math.floor(myMaxhp() * 0.05) + 2)
        ) {
          return false;
        }
        if (!use(1, form)) return false;
      }
    } else {
      cliExecute(`fold ${target.name}`);
    }
    return itemAmount(target) > before;
  }

  private prepareReturn(item: Item, quantity: number): void {
    if (this.amountInForm(item) === 0) return;

    if (item === $item`Buddy Bjorn`) {
      examine(item);
      bjornifyFamiliar($familiar.none);
    } else if (item === $item`Crown of Thrones`) {
      examine(item);
      enthroneFamiliar($familiar.none);
    }

    this.prepareInventory(item, quantity);
  }

  private prepareInventory(item: Item, quantity: number): void {
    const closeted = Math.min(
      closetAmount(item),
      Math.max(0, quantity - itemAmount(item)),
    );
    if (closeted > 0) takeCloset(closeted, item);

    for (const slot of $slots.all()) {
      if (itemAmount(item) >= quantity) break;
      if (equippedItem(slot) === item) unequip(slot);
    }

    for (const familiar of $familiars.all().filter(have)) {
      if (itemAmount(item) >= quantity) break;
      if (familiarEquippedEquipment(familiar) === item) {
        equip(familiar, $item.none);
      }
    }
  }

  private returnItem(loan: Loan, item: Item, quantity: number): number {
    let deposited = 0;

    try {
      this.prepareReturn(item, quantity);
      const count = Math.min(quantity, itemAmount(item));
      if (count === 0) return 0;

      const before = itemAmount(item);
      try {
        putStash(count, item);
      } finally {
        deposited = Math.min(count, Math.max(0, before - itemAmount(item)));
        if (deposited > 0) {
          this.adjustLoan(loan.clanId, loan.item, -deposited);
          print(
            `Returned ${deposited} ${item.name} to ${getClanName()} stash.`,
            HIGHLIGHT,
          );
        }
      }
    } catch (error) {
      print(`Could not return ${item.name}: ${error}`, "red");
    }

    return deposited;
  }

  private returnLoan(loan: Loan): number {
    const amountOwed = this.loansByClan.get(loan.clanId)?.get(loan.item) ?? 0;
    const quantity = Math.min(loan.quantity, amountOwed);
    let remaining = quantity;

    for (const form of forms(loan.item).filter((form) => form.tradeable)) {
      if (remaining === 0) break;
      remaining -= this.returnItem(loan, form, remaining);
    }

    if (remaining > 0) {
      print(
        `Still owe ${remaining} ${loan.item.name} to clan #${loan.clanId}.`,
        "red",
      );
    }

    return quantity - remaining;
  }

  private returnClanLoans(clanId: number, loans: ItemAmounts): Loan[] {
    const returnedLoans: Loan[] = [];

    try {
      withClan(
        clanId,
        "Outstanding stash loans will remain recorded until returned.",
        () => {
          for (const [item, amount] of loans) {
            const loan: Loan = { clanId, item, quantity: amount };
            const quantity = this.returnLoan(loan);
            if (quantity > 0) returnedLoans.push({ ...loan, quantity });
          }
        },
      );
    } catch (error) {
      print(`Stash return interrupted: ${error}`, "red");
    }

    return returnedLoans;
  }

  private returnLoans(loansToReturn: Loan[]): ReturnResult {
    const returnedLoans: Loan[] = [];

    if (loansToReturn.length > 0 && prepareForCleanup()) {
      for (const [clanId, loans] of groupLoansByClan(loansToReturn)) {
        returnedLoans.push(...this.returnClanLoans(clanId, loans));
      }
    }

    return { returnedLoans, remainingLoans: this.outstandingLoans() };
  }

  done(...items: Item[]): ReturnResult {
    const families = new Set(items.map(canonicalItem));
    return this.returnLoans(
      this.outstandingLoans().filter((loan) => families.has(loan.item)),
    );
  }

  returnAll(): ReturnResult {
    return this.returnLoans(this.outstandingLoans());
  }

  with<T>(items: ItemRequest, action: () => T): T {
    const loansToReturn: Loan[] = [];

    try {
      this.borrow(items, loansToReturn);
      return action();
    } finally {
      this.returnLoans(loansToReturn);
    }
  }
}

export const stash = new StashManager();

export function returnExhaustedStashItems(): void {
  if (get("_navelRunaways") >= 3) {
    stash.done(
      $item`navel ring of navel gazing`,
      $item`Greatest American Pants`,
    );
  }
  if (
    get("spookyPuttyCopiesMade") + Math.max(1, get("_raindohCopiesMade")) >=
      6 &&
    !have($item`Spooky Putty monster`)
  ) {
    stash.done($item`Spooky Putty sheet`);
  }
  if (get("_stinkyCheeseCount") >= 100) {
    stash.done($item`stinky cheese diaper`);
  }
}

import { getClanId, getClanName, sessionStorage } from "kolmafia";
import { $item, Clan, have, set } from "libram";
import { prepareForCleanup } from "./cleanup";
import { globalOptions } from "./config";
import { userConfirmDialog } from "./lib";

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
  return withClan(
    clanIdOrName || getClanId(),
    "To stop garbo switching to a VIP clan, set 'garbo_vipClan' to your current clan.",
    action,
  );
}

const SESSION_WHITELISTED_CLANS = "garbo_clanWhitelists";

export function checkCurrentClanWhitelist(
  targetClanIdOrName: string | number,
  disableHint: string,
): void {
  const clanId = getClanId();
  const clanName = getClanName();
  if (
    clanId < 0 ||
    targetClanIdOrName === clanId ||
    `${targetClanIdOrName}`.toLowerCase() === clanName.toLowerCase()
  ) {
    return;
  }

  if (!getWhitelistedClans().some((clan) => clan.id === clanId)) {
    // Cleared so the next run picks up any whitelist the user adds to fix this
    sessionStorage.removeItem(SESSION_WHITELISTED_CLANS);
    throw new Error(
      `You are not whitelisted to your current clan '${clanName}' (#${clanId}). Garbo will not switch clans, as you would be unable to return. ${disableHint}`,
    );
  }
}

export function getWhitelistedClans(): { id: number; name: string }[] {
  const cached = sessionStorage.getItem(SESSION_WHITELISTED_CLANS);
  if (cached !== null) return JSON.parse(cached);

  const clans = Clan.getWhitelisted().map(({ id, name }) => ({ id, name }));
  sessionStorage.setItem(SESSION_WHITELISTED_CLANS, JSON.stringify(clans));
  return clans;
}

export function withClan<T>(
  clanIdOrName: string | number,
  disableHint: string,
  action: () => T,
): T {
  checkCurrentClanWhitelist(clanIdOrName, disableHint);
  const startingClanId = getClanId();
  Clan.join(clanIdOrName);
  try {
    return action();
  } finally {
    if (prepareForCleanup()) Clan.join(startingClanId);
  }
}

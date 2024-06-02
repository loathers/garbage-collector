import { $item, Clan, get, have } from "libram";

export function hotTubAvailable(): boolean {
  return (
    // FIXME getClanID returns a clan even if you aren't currently in one, as long as you were ever in a clan.
    Clan.get() && have($item`Clan VIP Lounge key`) && get("_hotTubSoaks") < 5
  );
}

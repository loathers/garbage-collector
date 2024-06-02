import { $item, Clan, get, have } from "libram";

export function hotTubAvailable(): boolean {
  return (
    Clan.get() && have($item`Clan VIP Lounge key`) && get("_hotTubSoaks") < 5
  );
}

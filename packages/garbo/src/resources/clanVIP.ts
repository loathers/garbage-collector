import { $item, get, have } from "libram";

export function hotTubAvailable(): boolean {
  return have($item`Clan VIP Lounge key`) && get("_hotTubSoaks") < 5;
}

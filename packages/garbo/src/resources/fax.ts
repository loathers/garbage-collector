import {
  canFaxbot,
  cliExecute,
  faxbot,
  getClanLounge,
  Monster,
  wait,
} from "kolmafia";
import { $item, get, have, property } from "libram";

function checkFax(monster: Monster): boolean {
  if (!have($item`photocopied monster`)) cliExecute("fax receive");
  if (!have($item`photocopied monster`)) return false;
  if (property.get("photocopyMonster") === monster) {
    return true;
  }
  if (have($item`photocopied monster`)) cliExecute("fax send");
  return false;
}

export function faxMonster(monster: Monster): boolean {
  if (!have($item`Clan VIP Lounge key`)) return false;
  if (getClanLounge()["deluxe fax machine"] === undefined) return false;
  if (get("_photocopyUsed")) return false;

  if (!get("_photocopyUsed")) {
    if (checkFax(monster)) return true;
    if (!canFaxbot(monster)) return false;
    faxbot(monster);
    for (let i = 0; i < 3; i++) {
      wait(10);
      if (checkFax(monster)) return true;
    }
  }
  return false;
}

import { descToItem, mallPrice, print, runChoice, turnsPlayed, visitUrl } from "kolmafia";
import { property } from "libram";

export function coldMedicineCabinet(): void {
  if (
    property.getNumber("_coldMedicineConsults") >= 5 ||
    property.getNumber("_nextColdMedicineConsult") > turnsPlayed()
  )
    return;
  const options = visitUrl("campground.php?action=workshed");
  let bestChoice = 0;
  let highestPrice = 0;
  let i = 0;
  let match;
  const regexp = /descitem\((\d+)\)/g;
  while ((match = regexp.exec(options)) !== null) {
    i++;
    const item = descToItem(match[1]);
    const price = mallPrice(item);
    print(item.toString());
    if (price > highestPrice) {
      highestPrice = price;
      bestChoice = i;
    }
  }
  visitUrl("campground.php?action=workshed");
  runChoice(bestChoice);
}

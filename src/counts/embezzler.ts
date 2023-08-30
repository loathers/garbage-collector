import { canAdventure, getClanLounge, itemAmount } from "kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $location,
  $locations,
  $monster,
  $skill,
  ChateauMantegna,
  CombatLoversLocket,
  Counter,
  CrystalBall,
  get,
  have,
  property,
  SourceTerminal,
  sum,
} from "libram";

const embezzler = $monster`Knob Goblin Embezzler`;

export function embezzlerCount(): number {
  return sum(embezzlerCounts, (countEntry: NameCountPair) => countEntry[1]());
}

type NameCountPair = [string, () => number];

const embezzlerCounts = new Array<NameCountPair>(
  [
    "Chateau Painting",
    () =>
      ChateauMantegna.have() &&
      !ChateauMantegna.paintingFought() &&
      ChateauMantegna.paintingMonster() === embezzler
        ? 1
        : 0,
  ],
  [
    "Combat Lover's Locket",
    () => (CombatLoversLocket.availableLocketMonsters().includes(embezzler) ? 1 : 0),
  ],
  [
    "Fax",
    () =>
      have($item`Clan VIP Lounge key`) &&
      !get("_photocopyUsed") &&
      getClanLounge()["deluxe fax machine"] !== undefined
        ? 1
        : 0,
  ],
  [
    "Pillkeeper Semirare",
    () =>
      have($item`Eight Days a Week Pill Keeper`) &&
      canAdventure($location`Cobb's Knob Treasury`) &&
      !get("_freePillKeeperUsed") &&
      !have($effect`Lucky!`)
        ? 1
        : 0,
  ],
  [
    "Time-Spinner",
    () =>
      have($item`Time-Spinner`) &&
      $locations`Noob Cave, The Dire Warren, The Haunted Kitchen`.some(
        (location) =>
          location.combatQueue.includes(embezzler.name) || get("beGregariousCharges") > 0,
      )
        ? Math.floor((10 - get("_timeSpinnerMinutesUsed")) / 3)
        : 0,
  ],
  [
    "Spooky Putty & Rain-Doh",
    () => {
      const havePutty = have($item`Spooky Putty sheet`) || have($item`Spooky Putty monster`);
      const haveRainDoh =
        have($item`Rain-Doh black box`) || have($item`Rain-Doh box full of monster`);
      const puttyLocked =
        have($item`Spooky Putty monster`) && get("spookyPuttyMonster") !== embezzler;
      const rainDohLocked =
        have($item`Rain-Doh box full of monster`) && get("rainDohMonster") !== embezzler;

      if (havePutty && haveRainDoh) {
        if (puttyLocked && rainDohLocked) return 0;
        else if (puttyLocked) {
          return 5 - get("_raindohCopiesMade") + itemAmount($item`Rain-Doh box full of monster`);
        } else if (rainDohLocked) {
          return 5 - get("spookyPuttyCopiesMade") + itemAmount($item`Spooky Putty monster`);
        }
        return (
          6 -
          get("spookyPuttyCopiesMade") -
          get("_raindohCopiesMade") +
          itemAmount($item`Spooky Putty monster`) +
          itemAmount($item`Rain-Doh box full of monster`)
        );
      } else if (havePutty) {
        if (puttyLocked) return 0;
        return (
          5 -
          get("spookyPuttyCopiesMade") -
          get("_raindohCopiesMade") +
          itemAmount($item`Spooky Putty monster`)
        );
      } else if (haveRainDoh) {
        if (rainDohLocked) return 0;
        return (
          5 -
          get("spookyPuttyCopiesMade") -
          get("_raindohCopiesMade") +
          itemAmount($item`Rain-Doh box full of monster`)
        );
      }
      return 0;
    },
  ],
  [
    "4-d Camera",
    () =>
      have($item`shaking 4-d camera`) && get("cameraMonster") === embezzler && !get("_cameraUsed")
        ? 1
        : 0,
  ],
  [
    "Ice Sculpture",
    () =>
      have($item`ice sculpture`) &&
      get("iceSculptureMonster") === embezzler &&
      !get("_iceSculptureUsed")
        ? 1
        : 0,
  ],
  [
    "Green Taffy",
    () =>
      have($item`envyfish egg`) && get("envyfishMonster") === embezzler && !get("_envyfishEggUsed")
        ? 1
        : 0,
  ],
  [
    "Sticky Clay Homunculus",
    () =>
      property.getString("crudeMonster") === "Knob Goblin Embezzler"
        ? itemAmount($item`sticky clay homunculus`)
        : 0,
  ],
  [
    "Lucky!",
    () => (canAdventure($location`Cobb's Knob Treasury`) && have($effect`Lucky!`) ? 1 : 0),
  ],
  ["Digitize", () => (SourceTerminal.have() && SourceTerminal.getDigitizeUses() === 0 ? 1 : 0)],
  ["Guaranteed Romantic Monster", () => 0],
  [
    "Enamorang",
    () =>
      (Counter.get("Enamorang") <= 0 && get("enamorangMonster") === embezzler) ||
      (have($item`LOV Enamorang`) && !get("_enamorangs"))
        ? 1
        : 0,
  ],
  [
    "Orb Prediction",
    () =>
      (have($item`miniature crystal ball`) ? 1 : 0) *
      (get("beGregariousCharges") +
        (get("beGregariousFightsLeft") > 0 ||
        CrystalBall.ponder().get($location`The Dire Warren`) === embezzler
          ? 1
          : 0)),
  ],
  [
    "Macrometeorite",
    () =>
      ((get("beGregariousMonster") === embezzler && get("beGregariousFightsLeft") > 0) ||
        get("beGregariousCharges") > 0) &&
      have($skill`Meteor Lore`)
        ? 10 - get("_macrometeoriteUses")
        : 0,
  ],
  [
    "Powerful Glove",
    () =>
      ((get("beGregariousMonster") === embezzler && get("beGregariousFightsLeft") > 0) ||
        get("beGregariousCharges") > 0) &&
      have($item`Powerful Glove`)
        ? Math.min((100 - get("_powerfulGloveBatteryPowerUsed")) / 10)
        : 0,
  ],
  [
    "Be Gregarious",
    () =>
      get("beGregariousMonster") === embezzler
        ? get("beGregariousCharges") * 3 + get("beGregariousFightsLeft")
        : 0,
  ],
  ["Backup", () => (have($item`backup camera`) ? 11 - get("_backUpUses") : 0)],
  [
    "Professor MeatChain",
    () =>
      have($familiar`Pocket Professor`) && !get("_garbo_meatChain", false)
        ? Math.max(10 - get("_pocketProfessorLectures"), 0)
        : 0,
  ],
  [
    "Professor WeightChain",
    () =>
      have($familiar`Pocket Professor`) && !get("_garbo_weightChain", false)
        ? Math.min(15 - get("_pocketProfessorLectures"), 5)
        : 0,
  ],
);

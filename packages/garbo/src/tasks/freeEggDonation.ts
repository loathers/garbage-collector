import {
  getMonsters,
  haveEquipped,
  Item,
  itemDropsArray,
  Location,
  Monster,
  myMaxhp,
  restoreHp,
  useFamiliar,
  visitUrl,
} from "kolmafia";
import { Quest } from "grimoire-kolmafia";
import {
  $effect,
  $familiar,
  $item,
  $items,
  $monster,
  $monsters,
  $skill,
  ActionSource,
  ChestMimic,
  CombatLoversLocket,
  Delayed,
  ensureEffect,
  get,
  have,
  Requirement,
  RetroCape,
  sum,
} from "libram";
import { Macro } from "../combat";
import { GarboStrategy } from "../combatStrategy";
import { globalOptions } from "../config";
import { garboValue } from "../garboValue";
import { getUsingFreeBunnyBanish, tryFindFreeRunOrBanish } from "../lib";
import { GarboTask } from "./engine";

function queryEggNetIncomplete(): Map<Monster, number> {
  try {
    const status: {
      lastUpdate: number;
      eggs: { [id: string]: number };
    } = JSON.parse(visitUrl("https://eggnet.loathers.net/status"));

    return new Map<Monster, number>(
      Object.entries(status.eggs)
        .filter((entry) => entry[1] > 0 && entry[1] < 100)
        .map(([id, count]) => [Monster.get(id), count]),
    );
  } catch {
    return new Map<Monster, number>();
  }
}

function donateMonsterValue(m: Monster): number {
  const items = itemDropsArray(m).filter((drop) =>
    ["", "n"].includes(drop.type),
  );
  return (
    (m.minMeat + m.maxMeat) / 2 +
    sum(items, (drop) => (drop.rate / 100) * garboValue(drop.drop))
  );
}

function findDonateMonster(
  onlyFree: boolean,
): { monster: Monster; count: number } | undefined {
  const incomplete = queryEggNetIncomplete();
  if (incomplete.size === 0) return undefined;
  const maxMonsterId = $monster`time cop`.id; // Last Update Aug 2025
  const banned = new Set<Monster>([
    ...Location.all()
      .filter((x) => x.zone === "FantasyRealm")
      .flatMap((x) => getMonsters(x)),
    ...$monsters
      .all()
      .filter(
        (x) =>
          x.attributes.includes("BOSS") ||
          x.attributes.includes("NOCOPY") ||
          (onlyFree && !x.attributes.includes("FREE")),
      ),
    ...$monsters`Source Agent`,
  ]);
  const monster = CombatLoversLocket.findMonster(
    (m) => m.id <= maxMonsterId && incomplete.has(m) && !banned.has(m),
    (m) => donateMonsterValue(m),
  );
  const count = incomplete.get(monster ?? Monster.none) ?? 0;
  return !!monster && monster !== Monster.none && count > 0
    ? { monster, count }
    : undefined;
}

function mimicEscape(): ActionSource | undefined {
  return (
    tryFindFreeRunOrBanish({
      noFamiliar: () => true,
      allowedAction: (action) =>
        action.source === $skill`Snokebomb` && getUsingFreeBunnyBanish()
          ? $skill`Snokebomb`.timescast < 2
          : true,
    }) ?? undefined
  );
}

function mimicEggDonation(): GarboTask[] {
  const escape = mimicEscape();
  const donation = findDonateMonster(!escape);

  if (!donation) {
    return [];
  }

  return [
    {
      name: `Donate mimic egg`,
      ready: () => ChestMimic.eggMonsters().has(donation.monster),
      completed: () => get("_mimicEggsDonated") >= 3,
      outfit: { familiar: $familiar`Chest Mimic` },
      do: () => ChestMimic.donate(donation.monster),
      limit: { skip: 3 },
      spendsTurn: false,
    },
    {
      name: `Harvest mimic eggs`,
      ready: () =>
        CombatLoversLocket.canReminisce(donation.monster) &&
        (!!escape || donation.monster.attributes.includes("FREE")) &&
        $familiar`Chest Mimic`.experience > 50,
      completed: () =>
        get("_mimicEggsObtained") >= 11 ||
        get("_mimicEggsDonated") >= 3 ||
        ChestMimic.eggMonsters().has(donation.monster),
      do: () => CombatLoversLocket.reminisce(donation.monster),
      combat: new GarboStrategy(
        () =>
          Macro.externalIf(
            Math.min(donation.count, 3 - get("_mimicEggsDonated")) > 0,
            Macro.trySkill($skill`%fn, lay an egg`),
          )
            .externalIf(
              Math.min(donation.count, 3 - get("_mimicEggsDonated")) > 1,
              Macro.trySkill($skill`%fn, lay an egg`),
            )
            .externalIf(
              Math.min(donation.count, 3 - get("_mimicEggsDonated")) > 2,
              Macro.trySkill($skill`%fn, lay an egg`),
            )
            .externalIf(
              !!escape && !donation.monster.attributes.includes("FREE"),
              Macro.step(escape?.macro ?? ""),
            )
            .kill(),
        () => Macro.kill(),
      ),
      prepare: () => {
        useFamiliar($familiar`Chest Mimic`);
        escape?.prepare(
          new Requirement(
            [
              "100 Avoid Attack",
              "-100 Thorns",
              "-100 Sporadic Thorns",
              "-100 Damage Aura",
              "-100 Sporadic Damage Aura",
            ],
            {
              bonusEquip: new Map<Item, number>([
                [$item`unwrapped knock-off retro superhero cape`, 300],
                [$item`navel ring of navel gazing`, 50],
                [$item`ancient stone head`, 33],
                [$item`asteroid belt`, 25],
                [$item`attorney's badge`, 20],
                [$item`propeller beanie`, 10],
                [$item`Mayflower bouquet`, 6.5],
              ]),
              preventEquip: $items`carnivorous potted plant, Kramco Sausage-o-Matic™`,
            },
          ),
        );
        if (haveEquipped($item`unwrapped knock-off retro superhero cape`)) {
          RetroCape.set("heck", "hold");
        }
        if (have($skill`Blood Bubble`)) ensureEffect($effect`Blood Bubble`);
        restoreHp(myMaxhp());
      },
      limit: { skip: 1 },
      spendsTurn: false,
      sobriety: "sober",
    },
  ];
}

export const FreeMimicEggDonationQuest: Delayed<Quest<GarboTask>> = () => ({
  name: "Free Mimic Egg Donation",
  tasks: [...mimicEggDonation()],
  ready: () =>
    globalOptions.prefs.beSelfish !== true &&
    ChestMimic.have() &&
    CombatLoversLocket.have(),
  completed: () => get("_mimicEggsDonated") >= 3,
});

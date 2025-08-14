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
        .filter((entry) => entry[1] < 100)
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

function findDonateMonster(): { monster: Monster; count: number } | undefined {
  const incomplete = queryEggNetIncomplete();
  if (incomplete.size === 0) return undefined;

  const alreadyHave = [...ChestMimic.eggMonsters().keys()].find(incomplete.has);
  if (alreadyHave) {
    const count = incomplete.get(alreadyHave ?? Monster.none) ?? 0;
    return { monster: alreadyHave, count };
  }

  const maxMonsterId = 2497; // Last Update Aug 2025
  const banned = new Set<Monster>([
    ...Location.all()
      .filter((x) => x.zone === "FantasyRealm")
      .flatMap((x) => getMonsters(x)),
    ...$monsters
      .all()
      .filter(
        (x) => x.attributes.includes("BOSS") || x.attributes.includes("NOCOPY"),
      ),
    ...$monsters`Source Agent`,
  ]);
  const monster = CombatLoversLocket.findMonster(
    (m) => m.id <= maxMonsterId && incomplete.has(m) && !banned.has(m),
    donateMonsterValue,
  );
  const count = incomplete.get(monster ?? Monster.none) ?? 0;
  return monster ? { monster, count } : undefined;
}

function mimicEscape(): ActionSource | null {
  return tryFindFreeRunOrBanish({
    noFamiliar: () => true,
    allowedAction: (action) =>
      action.source === $skill`Snokebomb` && getUsingFreeBunnyBanish()
        ? $skill`Snokebomb`.timescast < 2
        : true,
  });
}

function mimicEggDonation(): GarboTask[] {
  const donation = findDonateMonster();
  if (!donation) {
    return [];
  }

  const escape = mimicEscape();

  return [
    {
      name: `Harvest ${donation.monster} mimic egg(s)`,
      ready: () =>
        !!escape &&
        donation.count > 0 &&
        $familiar`Chest Mimic`.experience > 50 &&
        get("_mimicEggsObtained") < 11 &&
        get("_mimicEggsDonated") < 3,
      completed: () =>
        ChestMimic.eggMonsters().has(donation.monster) ||
        !CombatLoversLocket.canReminisce(donation.monster),
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
              !donation?.monster.attributes.includes("FREE"),
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
    {
      name: `Donate ${donation.monster} mimic egg`,
      ready: () => ChestMimic.eggMonsters().has(donation.monster),
      completed: () => get("_mimicEggsDonated") >= 3,
      outfit: { familiar: $familiar`Chest Mimic` },
      do: () => ChestMimic.donate(donation.monster),
      limit: { skip: 3 },
      spendsTurn: false,
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

import {
  Effect,
  equippedItem,
  haveEquipped,
  Item,
  itemType,
  Monster,
  myBuffedstat,
  myDaycount,
  myId,
  myMaxhp,
  restoreHp,
  restoreMp,
  toInt,
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
  $slot,
  $stat,
  ActionSource,
  ChestMimic,
  CombatLoversLocket,
  Delayed,
  ensureEffect,
  get,
  have,
  MaximizeOptions,
  Requirement,
  RetroCape,
} from "libram";
import { Macro } from "../combat";
import { GarboStrategy } from "../combatStrategy";
import { globalOptions } from "../config";
import {
  freeRunConstraints,
  safeRestoreMpTarget,
  tryFindFreeRunOrBanish,
} from "../lib";
import { GarboTask } from "./engine";

function queryEggNetIncomplete(): Map<Monster, number> {
  try {
    const status: {
      lastUpdate: string;
      eggs: { [id: string]: number };
    } = JSON.parse(visitUrl("https://eggnet.loathers.net/status"));

    const lastUpdate = new Date(status.lastUpdate);
    const daysSince =
      (Date.now() - lastUpdate.getTime()) / (24 * 60 * 60 * 1000);
    const max = daysSince < 0.5 ? 100 : 100 - 10 * daysSince;

    return new Map<Monster, number>(
      Object.entries(status.eggs)
        .filter((entry) => entry[1] > 0 && entry[1] < max)
        .map(([id, count]) => [Monster.get(id), count]),
    );
  } catch {
    return new Map<Monster, number>();
  }
}

function queryEggNetPriority(): Map<Monster, number> {
  try {
    const monsters: {
      id: number;
      eggs: number;
      priority: number;
    }[] = JSON.parse(visitUrl("https://eggnet.loathers.net/monsters"));

    return new Map<Monster, number>(
      monsters
        .filter((entry) => entry.eggs < 100 && entry.priority > 0)
        .map((entry) => [Monster.get(entry.id), entry.priority]),
    );
  } catch {
    return new Map<Monster, number>();
  }
}

function findDonateMonster(
  onlyFree: boolean,
): { monster: Monster; count: number } | undefined {
  const incomplete = queryEggNetIncomplete();
  const priority = queryEggNetPriority();
  if (incomplete.size === 0) return undefined;
  const maxMonsterId = $monster`beef bodyguard bat`.id; // Last Update Feb 24 2026
  const banned = new Set<Monster>([
    ...$monsters
      .all()
      .filter(
        (x) =>
          x.attributes.includes("BOSS") ||
          x.attributes.includes("NOCOPY") ||
          (onlyFree && !x.attributes.includes("FREE")),
      ),
    // Impossible, cannot use items or skills
    ...$monsters`quadfaerie, cursed villager, plywood cultists, barrow wraith?, Source Agent`,
  ]);
  // Find the monster that needs the most eggs, adding in a small amount of variance as a tiebreaker
  const monster = CombatLoversLocket.findMonster(
    (m) => m.id <= maxMonsterId && incomplete.has(m) && !banned.has(m),
    (m) =>
      100 -
      (incomplete.get(m ?? Monster.none) ?? 0) +
      (priority.get(m) ?? 0) * 1000 +
      Math.sin((toInt(myId()) << 5) + myDaycount() + m.id),
  );
  const count = incomplete.get(monster ?? Monster.none) ?? 0;
  return !!monster && monster !== Monster.none && count > 0
    ? { monster, count }
    : undefined;
}

function mimicEscape(): ActionSource | undefined {
  const constraints = {
    ...freeRunConstraints(),
    noFamiliar: () => true,
    maximumCost: () =>
      globalOptions.prefs.valueOfAdventure ??
      globalOptions.prefs.valueOfFreeFight,
  };
  return tryFindFreeRunOrBanish(constraints) ?? undefined;
}

function shouldDelevel(monster: Monster): boolean {
  return (
    monster.attributes.includes("Scale:") ||
    myBuffedstat($stat`Moxie`) < monster.baseAttack + 10 ||
    (have($skill`Hero of the Half-Shell`) &&
      itemType(equippedItem($slot`offhand`)) === "shield" &&
      myBuffedstat($stat`Muscle`) < monster.baseAttack + 10)
  );
}

function monsterRequirements(monster: Monster): Requirement {
  const maximize = [
    "-100 Thorns",
    "-100 Sporadic Thorns",
    "-100 Damage Aura",
    "-100 Sporadic Damage Aura",
  ];
  const options: Partial<MaximizeOptions> = {
    preventEquip: $items`carnivorous potted plant, Kramco Sausage-o-Matic™`,
  };
  switch (monster) {
    default:
      maximize.push("100 Avoid Attack");
      options.bonusEquip = new Map<Item, number>([
        [$item`unwrapped knock-off retro superhero cape`, 300],
        [$item`navel ring of navel gazing`, 50],
        [$item`ancient stone head`, 33],
        [$item`asteroid belt`, 25],
        [$item`attorney's badge`, 20],
        [$item`propeller beanie`, 10],
        [$item`Mayflower bouquet`, 6.5],
      ]);
      break;
  }
  return new Requirement(maximize, options);
}

function monsterEffects(monster: Monster): Effect[] {
  const effects: Effect[] = [];
  switch (monster) {
    default:
      break;
  }
  return effects;
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
          Macro.externalIf(shouldDelevel(donation.monster), Macro.delevel())
            .externalIf(
              Math.min(100 - donation.count, 3 - get("_mimicEggsDonated")) > 0,
              Macro.trySkill($skill`%fn, lay an egg`),
            )
            .externalIf(
              Math.min(100 - donation.count, 3 - get("_mimicEggsDonated")) > 1,
              Macro.trySkill($skill`%fn, lay an egg`),
            )
            .externalIf(
              Math.min(100 - donation.count, 3 - get("_mimicEggsDonated")) > 2,
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
        escape?.prepare(monsterRequirements(donation.monster));
        if (haveEquipped($item`unwrapped knock-off retro superhero cape`)) {
          RetroCape.set("heck", "hold");
        }
        if (have($skill`Blood Bubble`)) ensureEffect($effect`Blood Bubble`);
        restoreHp(myMaxhp());
        restoreMp(safeRestoreMpTarget());
      },
      effects: () => monsterEffects(donation.monster),
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

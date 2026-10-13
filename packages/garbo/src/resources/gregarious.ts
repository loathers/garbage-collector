import { equip, Monster } from "kolmafia";
import {
  $effect,
  $item,
  $location,
  $monster,
  $skill,
  $slot,
  clamp,
  CrystalBall,
  get,
  have,
} from "libram";
import { globalOptions } from "../config";

const crate = $monster`crate`;

type GregSource = {
  copies: number;
  skillSource: "habitat" | "extro";
  replaces: number;
  extra: number;
};

export function expectedGregs(skillSource: "habitat" | "extro"): number[] {
  const habitatCharges = have($skill`Just the Facts`)
    ? 3 - get("_monsterHabitatsRecalled", 0)
    : 0;

  const habitatGregs: GregSource[] = new Array(habitatCharges).fill({
    copies: 5,
    skillSource: "habitat",
    replaces: 0,
    extra: 0,
  });

  const extroGregs = new Array(50).fill({
    copies: 3,
    skillSource: "extro",
    replaces: 0,
    extra: 0,
  });

  const baseGregs: GregSource[] = [...habitatGregs, ...extroGregs];

  const replacementsPerGreg = (source: GregSource) =>
    have($skill`Transcendent Olfaction`)
      ? Math.floor((source.copies * 7) / 3)
      : Math.floor((source.copies * 5) / 3);

  const timeSpunGregs = have($item`Time-Spinner`)
    ? Math.floor((10 - get("_timeSpinnerMinutesUsed")) / 3)
    : 0;

  const orbGregs = have($item`miniature crystal ball`) ? 1 : 0;

  const macrometeors = have($skill`Meteor Lore`)
    ? 10 - get("_macrometeoriteUses")
    : 0;
  const replaceEnemies = have($item`Powerful Glove`)
    ? Math.floor((100 - get("_powerfulGloveBatteryPowerUsed")) / 10)
    : 0;

  const firstReplaces = clamp(
    replacementsPerGreg(baseGregs[0]),
    0,
    macrometeors + replaceEnemies,
  );
  const initialCast: { replacesLeft: number; sources: GregSource[] } = {
    replacesLeft: macrometeors + replaceEnemies - firstReplaces,
    sources: [
      {
        ...baseGregs[0],
        replaces: firstReplaces,
        extra: timeSpunGregs + orbGregs,
      },
    ],
  };

  return baseGregs
    .slice(1)
    .reduce((acc, curr): { replacesLeft: number; sources: GregSource[] } => {
      const currentReplaces = clamp(
        replacementsPerGreg(curr),
        0,
        acc.replacesLeft,
      );
      return {
        replacesLeft: acc.replacesLeft - currentReplaces,
        sources: [
          ...acc.sources,
          {
            ...curr,
            replaces: currentReplaces,
            extra: orbGregs,
          },
        ],
      };
    }, initialCast)
    .sources.filter((source) => source.skillSource === skillSource)
    .map((source) => source.copies + source.replaces + source.extra);
}

export function doingGregFight(): boolean {
  const extrovermectin =
    get("beGregariousCharges") > 0 ||
    (get("beGregariousFightsLeft") > 0 &&
      get("beGregariousMonster") === globalOptions.target) ||
    (!globalOptions.dietCompleted &&
      !globalOptions.nodiet &&
      hasMonsterReplacers());
  const habitat =
    have($skill`Just the Facts`) &&
    (get("_monsterHabitatsRecalled") < 3 ||
      (get("_monsterHabitatsFightsLeft") > 0 &&
        get("_monsterHabitatsMonster") === globalOptions.target));

  return extrovermectin || habitat;
}

export const isOlfacted = (monster: Monster): boolean =>
  get("olfactedMonster") === monster && have($effect`On the Trail`);
export const isConned = (monster: Monster): boolean =>
  get("longConMonster") === monster;
export function crateStrategy(): "Sniff" | "Saber" | "Orb" | null {
  if (!doingGregFight()) return null;
  if (
    (have($skill`Transcendent Olfaction`) &&
      (isOlfacted(crate) || get("_olfactionsUsed") < 2)) ||
    (have($skill`Long Con`) && (isConned(crate) || get("_longConUsed") < 4))
  ) {
    return "Sniff";
  }
  if (have($item`miniature crystal ball`)) return "Orb";
  if (have($item`Fourth of May Cosplay Saber`) && get("_saberForceUses") < 5) {
    return "Saber";
  }
  return null;
}

export function hasMonsterReplacers(): boolean {
  return (
    (have($skill`Meteor Lore`) && get("_macrometeoriteUses") < 10) ||
    (have($item`Powerful Glove`) && get("_powerfulGloveBatteryPowerUsed") < 90)
  );
}

/**
 * Equip the miniature crystal ball if the current prediction is good for us.
 */
export function equipOrbIfDesired(): void {
  if (
    have($item`miniature crystal ball`) &&
    !(
      get("_saberForceMonster") === crate && get("_saberForceMonsterCount") > 0
    ) &&
    crateStrategy() !== "Sniff" &&
    [undefined, crate].includes(CrystalBall.ponder().get($location`Noob Cave`))
  ) {
    equip($slot`familiar`, $item`miniature crystal ball`);
  }
}

export function gregReady(): boolean {
  return (
    (get("beGregariousMonster") === globalOptions.target &&
      get("beGregariousFightsLeft") > 0) ||
    (get("_monsterHabitatsMonster") === globalOptions.target &&
      get("_monsterHabitatsFightsLeft") > 0)
  );
}

export function totalGregCharges(countPartial: boolean): number {
  const extroPartial = get("beGregariousFightsLeft") > 0 ? 1 : 0;
  const habitatPartial = get("_monsterHabitatsFightsLeft") > 0 ? 1 : 0;

  return (
    get("beGregariousCharges") +
    (have($skill`Just the Facts`) ? 3 - get("_monsterHabitatsRecalled") : 0) +
    (countPartial ? extroPartial + habitatPartial : 0)
  );
}

export function possibleGregCrystalBall(): number {
  if (have($item`miniature crystal ball`)) {
    const ponderCount =
      CrystalBall.ponder().get($location`The Dire Warren`) ===
      globalOptions.target
        ? 1
        : 0;
    return totalGregCharges(true) + ponderCount;
  }
  return 0;
}

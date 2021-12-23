import { cliExecute, fileToBuffer, myId } from "kolmafia";
import { get, set } from "libram";

type BeachTile = { minute: number; row: number; column: number };

const rareTiles: BeachTile[] = JSON.parse(fileToBuffer("raretiles.json"));

function _comb(tile: BeachTile): void {
  const { minute, row, column } = tile;
  cliExecute(`beach wander ${minute}; beach comb ${row} ${column}`);
}

let seed = parseInt(myId());
function deterministicRandom(): number {
  seed++;
  return Math.sin(seed);
}

function deterministicShuffle<T>(array: T[]): T[] {
  const returnValue: T[] = [];
  while (array.length > 0) {
    const index = Math.floor(deterministicRandom() * array.length);
    returnValue.push(...array.splice(index));
  }
  return returnValue;
}

let shuffledArray: BeachTile[];

function getShuffledArray(): BeachTile[] {
  if (!shuffledArray) {
    shuffledArray = deterministicShuffle(rareTiles);
  }
  return shuffledArray;
}

export default function comb(): void {
  const tileList = getShuffledArray();
  const index = (get("garbo_lastTileCombed", 0) + 1) % tileList.length;
  const tile = tileList[index];
  _comb(tile);
  set("garbo_lastTileCombed", index);
}

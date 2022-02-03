/**
 * @file Type definition for CanAdv, made by dj_d.
 *
 * - ASH script name: CanAdv
 * - ASH script version: r109
 * - ASH script authors: zarqon, Theraze
 *
 * Links:
 *  - ASH script forum thread: https://kolmafia.us/threads/canadv-check-whether-you-can-adventure-at-a-given-location.2027/
 */

import { Location } from "kolmafia";

/**
 * Checks if the player can adventure at `location`.
 * @param location
 * @param prep If `true`, will equip items, use potions, etc. to meet
 *    requirements for visiting the location. Default is `false`
 */
export function canAdv(where: Location, prep?: boolean): boolean;

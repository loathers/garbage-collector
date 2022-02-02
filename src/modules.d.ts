import { Location } from "kolmafia";

declare module "canadv.ash" {
  export function canAdv(location: Location, x: boolean): boolean;
}

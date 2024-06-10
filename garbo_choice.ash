void main(int choice, string page)
{
	string[int] options = available_choice_options();
	int[string] priority;
	int top,pick;

  //Everfull dart handling
  switch (choice) {
		default:
			return;

	case 1525:
			priority = {
				"Throw a second dart quickly":60,
				"Deal 25-50% more damage":800,
				"You are less impressed by bullseyes":10,
				"25% Better bullseye targeting":20,
				"Extra stats from stats targets":40,
				"Butt awareness":30,
				"Add Hot Damage":1000,
				"Add Cold Damage":1000,
				"Add Sleaze Damage":1000,
				"Add Spooky Damage":1000,
				"Add Stench Damage":1000,
				"Expand your dart capacity by 1":50,
				"Bullseyes do not impress you much":9,
				"25% More Accurate bullseye targeting":19,
				"Deal 25-50% extra damage":10000,
				"Increase Dart Deleveling from deleveling targets":100,
				"Deal 25-50% greater damage":10000,
				"Extra stats from stats targets":39,
				"25% better chance to hit bullseyes":18,
				};
			top = 999999999;
			pick = 1;

			foreach i,x in available_choice_options() {
				if (priority[x] == 0) {
					print(`dart perk "{x}" not in priority list`,"red");
					continue;
				}
				if (priority[x] < top) {
					top = priority[x];
					pick = i;
				}
			}
			run_choice(pick);
			break;
	}
}
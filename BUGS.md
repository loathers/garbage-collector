#THIS SHOULD GO AWAY SOON!!!!!
# Buggin' Out (as portrayed by Giancarlo Esposito)

So you'd like to report a bug. Great! The very first step is to read this.

Garbage Collector is a very complicated script, worked on for free by people who have jobs and families. Which means that before reporting a bug, we want you to broadly verify two things:

- You've set garbo up to succeed.
- The behavior you've encountered is definitely a bug.

Let's dig in.

### Please set Garbo up for success

As mentioned in the README, garbo relies on Mafia as a source of truth, and that means it's important to only play turns in Mafia (including the relay browser, which is a fantastic tool!), and to only play turns in one Mafia install. There are a few ways to get around this--you can sync the preference files of multiple mafia installs using something like DropBox, for example--but we aren't going to get into that here or now, because it is out of scope of this file.

Garbo and mafia both get updated regularly both to fix bugs and to support new content. It's important to keep both of them up to date locally, so you aren't encountering bugs that have already been fixed. Mafia can be told to always update git-based scripts on startup by going to `General > Preferences > Git`, and checking the `Update installed Git projects on login` checkbox. There are a number of scripts people have whipped up to automatically update mafia, many of which can be found on [the kolmafia forums](https://kolmafia.us).

Try to make sure you have a stable internet connection, and that your device won't shut down mid-operation. If you need to terminate garbo, use the "Interrupt Garbo" button accessible through Garbo's relay interface, rather than spam-clicking "Stop Now" in Mafia. Don't interact with the game using the relay browser while Garbo is running, either.

### Please ensure that what you're describing is a bug

Garbo is a big, complicated script that often finds itself doing big, complicated things. While its express purpose is to farm meat at Barf Mountain, it can do a lot of unconventional-seeming things along the way. It will likely try to fight a large number of target monsters at the start of the day. When it fights "wandering" monsters, like those found using Digitize, it will try to place those monsters into special zones from which it can eke additional value. It will pause throughout the day to Spit Jurassic Acid in a variety of zones, assuming you have a Jurassic Parka. This list is extremely, extremely non-exhaustive--KoL is a 20 year old game with profoundly complex interacting mechanics, and Garbo exploits a hell of a lot of them.

Given all this, how can we know that something is a bug? We have a few rules of thumb:

- In general, if Garbo is outside barf mountain and is not fighting a target monster, it should probably not be spending turns.
  - Unfortunately, like all rules, this has exceptions. We may spend turns to convert Maps to Safety Shelter Grimacia Prime into pills, or we may hit a turn-taking superlikely in the Deep Dark Jungle, or any of a dozen other things.
- Garbo aborting is often, but not always, a bug. Obviously aborting is bad, but if garbo is not set up for success (e.g., it finds that the things Mafia believes are not true), it may abort to try to avoid making terrible decisions. The best way to decide if an abort is based on a garbo bug is to **read the associated error text**. Expanding and improving error text is something we're actively working on, so please don't let these efforts be in vain.
- It turns out we actually only have two rules of thumb, which works out great given the limitations of human anatomy.

## Actually Writing the Bug Report

We have an issue template to help write your bug report, so you should follow that template and the instructions therein. But a very quick TL;DR is as follows:

- It's not very long, read it!
- Read existing bug reports, to see if this is a new bug or if it's already been reported.
- You should provide a **full** session log, available in the `sessions` folder of your mafia directory. Logs are given names of the form `user_name_YYYYMMDD.txt`. Make sure you're using today's log!
- Bug reports without attached session logs (or without descriptive titles, such as those that just say `[BUG]` with no other details) will be closed.
- If garbo prints any red text or abort messages to the CLI, we'll need those too. They aren't included in your session log, and they're especially pertinent information that helps us narrow things down much faster. Copy and paste them into your bug report
- Explain clearly the thing that happened and, if it's not _extremely_ obvious, why that thing is bad.
- Session logs are hella long--try to let us know the context in which the bug happened, so we can find where in the log it occured. This additional context might also help us identify what the bug is to begin with. It might be helpful to separately share the most relevant portions of the log, but **you should still share a full session log alongside a truncated one**.
- If you don't hear back over the course of the next couple of days, consider reading garbo's [commit history](https://github.com/loathers/garbage-collector/commits/main)--we may have addressed the bug but not responded to the ticket. Sorry!

Alright, it sounds like you're all ready to rock and roll. Submit your bug report [here](https://github.com/loathers/garbage-collector/issues).

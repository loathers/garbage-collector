import { fileToArray, formField, formFields, svnInfo, writeln } from "kolmafia";
import { get, set } from "libram";

export function main(): void {
  // handle updating values
  const fields = formFields();
  Object.keys(fields).forEach((field) => {
    if (field.includes("_didchange")) return;
    if (field === "relay") return;

    const oldSetting = formField(`${field} _didchange`);
    if (oldSetting === fields[field]) {
      if (get(field) !== fields[field]) {
        writeln(
          `You did not change setting ${field}. It changed since you last loaded the page, ignoring.<br>`
        );
      }
      return;
    }
    if (get(field) !== fields[field]) {
      writeln(`Changing setting ${field} to ${fields[field]} <br>`);
      set(field, fields[field]);
    }
  });

  // load user prefences into json object to pass to react
  const settings = [];
  const lines = fileToArray("garbo_settings.txt");
  for (const i in lines) {
    const data = lines[i].split("\t");
    settings.push({
      name: data[2],
      value: get(data[2]),
      type: data[3],
      description: data[4],
    });
  }

  writeln('<head><link rel="stylesheet" href="/garbage-collector/main.css"></head>');
  writeln('<div id="root"></div>');

  // add script that react calls when loaded to get kol data
  writeln("<script>");
  writeln(
    `let getData = function(callback) {callback(${JSON.stringify({
      rev: svnInfo("garbage-collector").last_changed_rev,
      settings: settings,
    })})}`
  );
  writeln("</script>");

  // include react scripts
  writeln('<script src="./garbage-collector/garbage-collector.js"></script>');
}

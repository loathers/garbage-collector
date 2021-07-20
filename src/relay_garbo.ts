import { fileToArray, formField, formFields, writeln } from "kolmafia";
import { get, set } from "libram";

export function main(): void {
  const updatedSettings: Array<{ name: String; value: String }> = [];
  // handle updating values
  const fields = formFields();
  Object.keys(fields).forEach((field) => {
    if (field.includes("_didchange")) return;
    if (field === "relay") return;

    const oldSetting = formField(`${field}_didchange`);
    if (oldSetting === fields[field] && get(field) !== fields[field]) return;

    if (get(field) !== fields[field]) {
      updatedSettings.push({
        name: field,
        value: fields[field],
      });
      set(field, fields[field]);
    }
  });

  // load user prefences into json object to pass to react
  const settings = [];
  const lines = fileToArray("garbo_settings.txt");
  for (const i of Object.values(lines)) {
    const [, , name, type, description] = i.split("\t");
    settings.push({
      name: name,
      value: get(name),
      type: type,
      description: description,
    });
  }

  writeln('<head><link rel="stylesheet" href="/garbage-collector/main.css"></head>');
  writeln('<div id="root"></div>');

  // add script that react calls when loaded to get kol data
  writeln("<script>");
  writeln(
    `let getData = function(callback) {callback(${JSON.stringify({
      settings: settings,
      updatedSettings: updatedSettings,
    })})}`
  );
  writeln("</script>");

  // include react scripts
  writeln('<script src="./garbage-collector/garbage-collector.js"></script>');
}

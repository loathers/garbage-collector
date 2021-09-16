import { fileToBuffer, formField, formFields, writeln } from "kolmafia";
import { get, set } from "libram";

export function main(): void {
  const updatedSettings: Array<{ name: string; value: string }> = [];
  // handle updating values
  const fields = formFields();
  Object.keys(fields).forEach((field) => {
    if (field.includes("_didchange")) return;
    if (field === "relay") return;

    const oldSetting = formField(`${field}_didchange`);
    if (oldSetting === fields[field] && get(field) !== fields[field]) return;

    if (get(field).toString() !== fields[field]) {
      updatedSettings.push({
        name: field,
        value: fields[field],
      });
      set(field, fields[field]);
    }
  });

  // load user perferences into json object to pass to react
  const settings = JSON.parse(fileToBuffer("garbo_settings.json"));
  for (const setting of settings) {
    setting.value = get(setting.name);
  }

  writeln('<head><link rel="stylesheet" href="/garbage-collector/main.css"></head>');
  writeln('<div id="root"></div>');

  writeln("<script>");

  // add script that react calls when loaded to get kol data
  writeln(
    `let getData = function(callback) {callback(${JSON.stringify({
      settings: settings,
      updatedSettings: updatedSettings,
    })})}`
  );

  // close notifications when they are clicked on
  writeln(`document.onclick = (e) => {
    if(e.target.classList.contains('notification')) e.target.remove();
  }`);

  writeln("</script>");

  // include react scripts
  writeln('<script src="./garbage-collector/garbage-collector.js"></script>');
}

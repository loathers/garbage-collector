import * as React from "react";
import Setting from "./components/Setting";

declare global {
  function getData(callback: (data: Data) => void): void;
  type SettingProp = {
    name: string;
    type: string;
    description: string;
    value: string | number;
  };
  type Data = {
    settings: SettingProp[];
    updatedSettings: UpdatedSetting[];
  };
  type UpdatedSetting = {
    name: string;
    value: string;
  };
}

function App({ settings, updatedSettings }: Data) {
  const preferences = settings.map((setting) => (
    <Setting
      value={setting.value}
      type={setting.type}
      name={setting.name}
      description={setting.description}
    />
  ));

  const updatedPreferences = updatedSettings.map((setting) => (
    <div>
      Changing setting {setting.name} to {setting.value}
    </div>
  ));

  return (
    <div id="garbageCollectorContainer">
      <h1> Garbage Collector Configuration </h1>
      {updatedPreferences}
      <form action="" method="post">
        <table>{preferences}</table>
        <input type="submit" name="" value="Save Changes" />
      </form>
    </div>
  );
}

export default App;

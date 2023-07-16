import * as React from "react";
import Setting from "./components/Setting";

declare global {
  function getData(callback: (data: Data) => void): void;
  type SettingProp = {
    name: string;
    type: string;
    description: string;
    value: string | number | boolean;
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

function App({ settings, updatedSettings }: Data): JSX.Element {
  const preferences = settings.map((setting) => (
    <Setting
      value={setting.value}
      type={setting.type}
      name={setting.name}
      description={setting.description}
    />
  ));

  const onInterruptClicked = (): void => {
    const interruptInput = document.getElementById("garboInterrupt") as HTMLInputElement;
    interruptInput.value = "true";
    const form = document.getElementById("garboForm") as HTMLFormElement;
    form.submit();
  };

  const updatedPreferences = updatedSettings.map((setting) => (
    <div className="notification">
      {setting.name} changed to {setting.value}
    </div>
  ));

  return (
    <div id="garbageCollectorContainer">
      <div id="notificationsContainer">{updatedPreferences}</div>
      <img src="/images/relayimages/garbo/garbo.gif" />
      <form id="garboForm" action="" method="post">
        <input
          className="interrupt"
          type="submit"
          value="Interrupt Garbo"
          onClick={onInterruptClicked}
        />
        <input id="garboInterrupt" type="hidden" name="garbo_interrupt" />
        <table>{preferences}</table>
        <input className="save" type="submit" value="Save Changes" />
      </form>
    </div>
  );
}

export default App;

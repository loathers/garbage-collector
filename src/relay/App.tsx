import * as React from "react";
import Setting from "./components/Setting";

function App(props: Data) {
  const elements = props.settings.map((setting) => (
    <Setting
      value={setting.value}
      type={setting.type}
      name={setting.name}
      description={setting.description}
    />
  ));
  return (
    <div id="garbageCollectorContainer">
      <h1> Garbage Collector Configuration </h1>
      <form action="" method="post">
        <table>{elements}</table>
        <input type="submit" name="" value="Save Changes" />
      </form>
      <h2>Info</h2>
      garbo version: {props.rev}
      <br />
    </div>
  );
}

export default App;

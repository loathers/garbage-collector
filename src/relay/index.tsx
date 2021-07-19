declare global {
  function getData(callback): void;
  type SettingProp = {
    name: string;
    type: string;
    description: string;
    value: string | number;
  };
  type Data = {
    rev: string;
    settings: SettingProp[];
  };
}

import * as ReactDOM from "react-dom";
import * as React from "react";
import App from "./App";
import ".//css/App.css";

getData((data: Data) => {
  ReactDOM.render(<App settings={data.settings} rev={data.rev} />, document.getElementById("root"));
});

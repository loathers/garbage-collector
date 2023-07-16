import { render } from "react-dom";
import * as React from "react";
import App from "./App";
import "./css/App.scss";

getData((data: Data) => {
  render(
    React.createElement(App, { updatedSettings: data.updatedSettings, settings: data.settings }),
    document.getElementById("root")
  );
});

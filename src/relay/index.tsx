import * as ReactDOM from "react-dom";
import * as React from "react";
import App from "./App";
import ".//css/App.css";

getData((data: Data) => {
  ReactDOM.render(
    <App updatedSettings={data.updatedSettings} settings={data.settings} />,
    document.getElementById("root")
  );
});

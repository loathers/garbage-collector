import * as React from "react";
import BooleanInput from "./BooleanInput";

function Setting(props: SettingProp): JSX.Element {
  return (
    <tr id="userPreference">
      <td>{props.name}</td>
      <td>
        {props.type === "boolean" ? (
          <BooleanInput {...props} />
        ) : (
          <input name={props.name} defaultValue={props.value} />
        )}
      </td>
      <td>{props.description}</td>
    </tr>
  );
}

export default Setting;

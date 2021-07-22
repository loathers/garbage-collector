import * as React from "react";

function Setting(props: SettingProp): React.ReactNode {
  return (
    <tr id="userPreference">
      <td>{props.name}</td>
      <td>
        <input name={props.name} defaultValue={props.value}></input>
      </td>
      <td>{props.description}</td>
    </tr>
  );
}

export default Setting;

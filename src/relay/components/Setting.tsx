import * as React from "react";

function Setting(props: SettingProp): JSX.Element {
  return (
    <tr id="userPreference">
      <td>{props.name}</td>
      <td>
        <input name={props.name} defaultValue={props.value} />
      </td>
      <td>{props.description}</td>
    </tr>
  );
}

export default Setting;

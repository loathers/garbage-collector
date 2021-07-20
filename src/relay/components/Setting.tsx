import * as React from "react";

function Setting(props: SettingProp) {
  return (
    <tr id="userPreference">
      <td>{this.props.name}</td>
      <td>
        <input name={props.name} defaultValue={props.value}></input>
      </td>
      <td>{this.props.description}</td>
    </tr>
  );
}

export default Setting;

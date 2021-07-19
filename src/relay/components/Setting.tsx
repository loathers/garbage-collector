import * as React from "react";

class Setting extends React.Component<SettingProp> {
  render(): React.ReactNode {
    return (
      <tr id="userPreference">
        <td>{this.props.name}</td>
        <td>
          <input name={this.props.name} defaultValue={this.props.value}></input>
        </td>
        <td>{this.props.description}</td>
      </tr>
    );
  }
}

export default Setting;

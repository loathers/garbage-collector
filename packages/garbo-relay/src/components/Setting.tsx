import BooleanInput from "./BooleanInput";

function Setting(props: SettingProp): JSX.Element {
  return (
    <tr id="userPreference">
      <td>{props.name}</td>
      <td>
        {props.type === "boolean" ? (
          <BooleanInput {...props} />
        ) : (
          <input
            className="stringPreference"
            name={props.name}
            defaultValue={props.value.toString()}
          />
        )}
      </td>
      <td>{props.description}</td>
    </tr>
  );
}

export default Setting;

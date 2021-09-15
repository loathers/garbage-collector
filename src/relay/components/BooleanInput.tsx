import * as React from "react";
import { useState } from "react";

function BooleanInput(props: SettingProp): JSX.Element {
  const [value, setValue] = useState(props.value === true);

  return (
    <label class="checkcontainer">
      <input type="hidden" name={props.name} value={value} />
      <div
        class="checkmark"
        onClick={() => {
          setValue(!value);
        }}
      />
    </label>
  );
}

export default BooleanInput;

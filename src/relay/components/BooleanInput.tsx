import * as React from "react";
import { useState } from "react";

function BooleanInput(props: SettingProp): JSX.Element {
  const [value, setValue] = useState(props.value === true || props.value === "true");

  return (
    <label className="checkcontainer">
      <input type="hidden" name={props.name} value={value.toString()} />
      <div
        className="toggle-track"
        onClick={() => {
          setValue(!value);
        }}
      >
        <span className="toggle-indicator">
          <span className="checkMark">
            <svg viewBox="0 0 24 24" id="ghq-svg-check" role="presentation" aria-hidden="true">
              <path d="M9.86 18a1 1 0 01-.73-.32l-4.86-5.17a1.001 1.001 0 011.46-1.37l4.12 4.39 8.41-9.2a1 1 0 111.48 1.34l-9.14 10a1 1 0 01-.73.33h-.01z"></path>
            </svg>
          </span>
        </span>
      </div>
    </label>
  );
}

/*
<div
  class="checkmark"
  onClick={() => {
    setValue(!value);
  }}
/>
 */
export default BooleanInput;

import React from "react";
import "@material/icon-button/dist/mdc.icon-button.css";
import { IconButton } from "@rmwc/icon-button";
import styled from "styled-components";

const Counter = ({ value = 1, setValue, min = 1, max = 10 }) => {
  const updateValue = newValue => {
    if (newValue >= min && newValue <= max) {
      setValue(newValue);
    }
  };

  return (
    <HolderStyled>
      <IconButton
        onClick={() => updateValue(value - 1)}
        icon={"navigate_before"}
        label="subtract"
      />
      <ValueStyled>
        {value} of {max}
      </ValueStyled>
      <IconButton
        onClick={() => updateValue(value + 1)}
        icon={"navigate_next"}
        label="add"
      />
    </HolderStyled>
  );
};

export default Counter;

const HolderStyled = styled.div`
  display: flex;
  align-items: center;
`;

const ValueStyled = styled.div`
  padding: 0 5px;
  user-select: none;
`;

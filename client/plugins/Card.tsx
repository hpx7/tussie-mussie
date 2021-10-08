import React from "react";
import ReactDom from "react-dom";
//@ts-ignore
import reactToWebComponent from "react-to-webcomponent";
import { PlayerState, Card } from "../.rtag/types";

function CardComponent({ val, state }: { val: Card; state: PlayerState }) {
  return <div style={{ width: 50, height: 100, textAlign: "center" }}>{val.details?.name}</div>;
}

export default reactToWebComponent(CardComponent, React, ReactDom);

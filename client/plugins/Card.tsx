import React from "react";
import ReactDom from "react-dom";
//@ts-ignore
import reactToWebComponent from "react-to-webcomponent";
import { PlayerState, Card } from "../.rtag/types";
import { RtagConnection } from "../.rtag/client";

function CardComponent({ val, state, client }: { val: Card; state: PlayerState; client: RtagConnection }) {
  return val.details ? (
    <img style={{ width: 100, height: 150 }} src={`/${val.details?.name.toLowerCase()}.png`} alt="" />
  ) : (
    <img style={{ width: 100, height: 150 }} src={`/card_back.png`} alt="" />
  );
}

export default reactToWebComponent(CardComponent, React, ReactDom);

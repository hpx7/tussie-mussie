import React from "react";
import { PlayerState, Card } from "../../.rtag/types";
import { RtagConnection } from "../../.rtag/client";
import { CardAction } from "../types";

function CardComponent({
  val,
  state,
  client,
  clickHandler,
  isKeepsake,
}: {
  val: Card;
  state: PlayerState;
  client: RtagConnection;
  clickHandler?: (selection: CardAction) => void;
  isKeepsake: boolean;
}) {
  function handleClick() {
    if (clickHandler) {
      return clickHandler({
        cardName: val.details?.name,
        isFaceUp: !!val.details,
      });
    }
    return;
  }

  return val.details ? (
    <span>
      <img
        onClick={handleClick}
        style={{ width: 150, height: 225, margin: 4 }}
        src={`/${val.details?.name.toLowerCase()}.png`}
        alt=""
      />
      {isKeepsake && <span style={{ position: "absolute", marginLeft: -120, fontWeight: 900 }}> KEEPSAKE</span>}
    </span>
  ) : (
    <img onClick={handleClick} style={{ width: 150, height: 225, margin: 4 }} src={`/card_back.png`} alt="" />
  );
}

export default CardComponent;

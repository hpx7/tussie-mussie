import React, {useEffect, useState} from "react";
import { PlayerState, Card } from "../../.rtag/types";
import { RtagConnection } from "../../.rtag/client";
import { CardAction } from "../types";

function CardComponent({
  val,
  state,
  client,
  clickHandler,
  isKeepsake,
  isSelected,
  isSmall,
}: {
  val: Card;
  state: PlayerState;
  client: RtagConnection;
  clickHandler?: (selection: CardAction) => void;
  isKeepsake?: boolean;
  isSelected?: boolean;
  isSmall?: boolean;
}) {
  let className = 'tussie--card';
  if (isSelected) {
    className += ' tussie--card-selected';
  }
  if (isKeepsake) {
    className += ' tussie--card-keepsake';
  }
  if (isSmall) {
    className += ' tussie--card-small';
  }


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
    <div style={{display:"flex", flexDirection:"column", alignItems: "center"}}>
      {isKeepsake &&
      <h4 style={{margin:0, color: "#95778B"}}>
        KEEPSAKE
      </h4>}
      <div
        onClick={handleClick}
        className={className}
        style={{
          backgroundImage: `url("/${val.details?.name.toLowerCase()}.png")`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
      </div>
    </div>
  ) : (

    <div style={{display:"flex", flexDirection:"column", alignItems: "center"}}>
      <div
          onClick={handleClick}
          className={className}
          style={{
            backgroundImage: `url("/card_back.png")`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
      >
      </div>
    </div>
  );
}

export default CardComponent;

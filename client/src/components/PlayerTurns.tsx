import { isEqual } from "lodash-es";
import React from "react";
import { RtagConnection } from "../../.rtag/client";
import { PlayerState, PlayerInfo } from "../../.rtag/types";
import CardComponent from "./Card";
import { CardAction } from "../types";

interface IPlayerTurnsProps {
  isCreator: boolean;
  currentPlayerInfo: PlayerInfo;
  playerState: PlayerState;
  client: RtagConnection;
}

interface IPlayerTurnsState {}

class PlayerTurns extends React.Component<IPlayerTurnsProps, IPlayerTurnsState> {
  state = this.getDefaultState(this.props);

  componentDidUpdate(oldProps: IPlayerTurnsProps) {
    if (!isEqual(oldProps, this.props)) {
      this.setState(this.getDefaultState(this.props));
    }
  }

  render() {
    const { client, playerState, currentPlayerInfo } = this.props;
    const turnIdx = playerState.players.findIndex((p) => p.name === playerState.turn)!;
    const chooser = playerState.players[(turnIdx + 1) % playerState.players.length];

    return (
      <div>
        <p>active turn: {playerState.turn}</p>
        {currentPlayerInfo &&
          playerState.turn === currentPlayerInfo.name &&
          currentPlayerInfo.drawnCards.length === 0 &&
          !playerState.offer && <button onClick={this.drawCards}>Draw Cards</button>}
        {currentPlayerInfo && currentPlayerInfo.drawnCards.length > 0 && (
          <>
            <p>Select one card to offer face down:</p>
            {currentPlayerInfo.drawnCards.map((card) => {
              return (
                <CardComponent
                  key={card.id}
                  val={card}
                  state={playerState}
                  client={client}
                  clickHandler={playerState.turn === currentPlayerInfo.name ? this.makeOffer : (s: CardAction) => {}}
                />
              );
            })}
          </>
        )}
        {currentPlayerInfo && playerState.offer && (
          <>
            {chooser.name === currentPlayerInfo.name ? (
              <p>Select which card you want:</p>
            ) : (
              <p>{chooser.name} is deciding on an offer:</p>
            )}
            <CardComponent
              key={playerState.offer.faceupCard.id}
              val={playerState.offer.faceupCard}
              state={playerState}
              client={client}
              clickHandler={chooser.name === currentPlayerInfo.name ? this.selectOffer : (s: CardAction) => {}}
            />
            <CardComponent
              key={playerState.offer.facedownCard.id}
              val={playerState.offer.facedownCard}
              state={playerState}
              client={client}
              clickHandler={chooser.name === currentPlayerInfo.name ? this.selectOffer : (s: CardAction) => {}}
            />
          </>
        )}

        <p>Your Arrangement:</p>
        {currentPlayerInfo &&
          currentPlayerInfo.hand.map((hc) => {
            return (
              <CardComponent
                key={hc.card.id}
                val={hc.card}
                state={playerState}
                client={client}
                isKeepsake={hc.isKeepsake}
              />
            );
          })}

        {currentPlayerInfo &&
          playerState &&
          playerState.players
            .filter((p) => p.name !== currentPlayerInfo.name)
            .map((p) => {
              return (
                <>
                  <p key={p.name}>{p.name}'s Arrangement:</p>
                  {p.hand.map((hc) => {
                    return <CardComponent key={hc.card.id} val={hc.card} state={playerState} client={client} />;
                  })}
                </>
              );
            })}
      </div>
    );
  }

  private getDefaultState(props: IPlayerTurnsProps): IPlayerTurnsState {
    return {
      edited: false,
    };
  }

  private drawCards = () => {
    this.props.client.drawForOffer({}).then((result) => {
      if (result.type === "error") {
        console.error(result.error);
      }
    });
  };

  private makeOffer = (selection: CardAction) => {
    this.props.client.makeOffer({ faceupCard: selection.cardName! }).then((result) => {
      if (result.type === "error") {
        console.error(result.error);
      }
    });
  };

  private selectOffer = (selection: CardAction) => {
    this.props.client.selectOffer({ faceup: selection.isFaceUp }).then((result) => {
      if (result.type === "error") {
        console.error(result.error);
      }
    });
  };
}

export default PlayerTurns;

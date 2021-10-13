import { isEqual } from "lodash-es";
import React from "react";
import { RtagConnection } from "../../.rtag/client";
import { PlayerState, PlayerInfo } from "../../.rtag/types";
import CardComponent from "./Card";

interface IRoundRecapProps {
  isCreator: boolean;
  currentPlayerInfo: PlayerInfo;
  playerState: PlayerState;
  client: RtagConnection;
}

interface IRoundRecapState {}

class RoundRecap extends React.Component<IRoundRecapProps, IRoundRecapState> {
  state = this.getDefaultState(this.props);

  componentDidUpdate(oldProps: IRoundRecapProps) {
    if (!isEqual(oldProps, this.props)) {
      this.setState(this.getDefaultState(this.props));
    }
  }

  render() {
    const { client, playerState, currentPlayerInfo } = this.props;

    return (
      <div>
        {playerState.round < 2 && <p>Scores:</p>}
        {currentPlayerInfo &&
          playerState &&
          playerState.players
            .sort((a, b) => b.score - a.score)
            .map((p) => {
              return (
                <>
                  <p key={p.name}>
                    {p.name}'s: {p.score}
                  </p>
                </>
              );
            })}

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
                </>
              );
            })}
        <div>
          <button className="hive-btn" onClick={this.advanceRound}>
            Advance Round
          </button>
        </div>
      </div>
    );
  }

  private getDefaultState(props: IRoundRecapProps): IRoundRecapState {
    return {
      edited: false,
    };
  }

  private advanceRound = () => {
    this.props.client.advanceRound({}).then((result) => {
      if (result.type === "error") {
        console.error(result.error);
      }
    });
  };
}

export default RoundRecap;

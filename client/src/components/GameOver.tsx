import { isEqual } from "lodash-es";
import React from "react";
import { RtagConnection } from "../../.rtag/client";
import { PlayerState, PlayerInfo } from "../../.rtag/types";

interface IGameOverProps {
  isCreator: boolean;
  currentPlayerInfo: PlayerInfo;
  playerState: PlayerState;
  client: RtagConnection;
}

interface IGameOverState {}

class GameOver extends React.Component<IGameOverProps, IGameOverState> {
  state = this.getDefaultState(this.props);

  componentDidUpdate(oldProps: IGameOverProps) {
    if (!isEqual(oldProps, this.props)) {
      this.setState(this.getDefaultState(this.props));
    }
  }

  render() {
    const { playerState, currentPlayerInfo } = this.props;

    return (
      <div>
        <strong>{playerState.players.sort((a, b) => b.score - a.score)[0].name} wins!</strong>
        {currentPlayerInfo &&
          playerState &&
          playerState.players
            .sort((a, b) => b.score - a.score)
            .map((p) => {
              return (
                <>
                  <p key={p.name}>
                    {p.name}'s score: {p.score}
                  </p>
                </>
              );
            })}
        <div>
          <button className="hive-btn" onClick={this.playAgain}>
            Play Again
          </button>
        </div>
      </div>
    );
  }

  private getDefaultState(props: IGameOverProps): IGameOverState {
    return {};
  }

  private playAgain = () => {
    this.props.client.playAgain({}).then((result) => {
      if (result.type === "error") {
        console.error(result.error);
      }
    });
  };
}

export default GameOver;

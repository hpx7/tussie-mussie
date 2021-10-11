import { isEqual } from "lodash-es";
import React, { useState, useEffect } from "react";
import { RtagConnection } from "../../.rtag/client";
import {PlayerState, PlayerInfo, CardName} from "../../.rtag/types";
import CardComponent from "./Card";

interface IGameOverProps {
    isCreator: boolean;
    currentPlayerInfo: PlayerInfo;
    playerState: PlayerState;
    client: RtagConnection;
}

interface IGameOverState {
    edited: boolean;
}

class GameOver extends React.Component<IGameOverProps, IGameOverState> {
    state = this.getDefaultState(this.props);
    // const [show, setIs404] = useState<boolean>(false);
    private url = document.baseURI;

    componentDidUpdate(oldProps: IGameOverProps) {
        if (!isEqual(oldProps, this.props)) {
            this.setState(this.getDefaultState(this.props));
        }
    }

    render() {
        const { client, playerState, currentPlayerInfo } = this.props;
        const { edited } = this.state;
        const turnIdx = playerState.players.findIndex((p) => p.name === playerState.turn)!;
        const chooser = playerState.players[(turnIdx + 1) % playerState.players.length];

        return (
            <div>
                <strong>{playerState.players.sort((a,b) => b.score - a.score)[0].name} wins!</strong>
                {currentPlayerInfo && playerState && playerState.players.sort((a,b) => b.score - a.score).map(p => {
                    return (<>
                        <p key={p.name}>{p.name}'s: {p.score}</p>
                    </>)
                })
                }
            </div>
        );
    }

    private getDefaultState(props: IGameOverProps): IGameOverState {
        return {
            edited: false,
        };
    }

    private playAgain = () => {
    };
}

export default GameOver;
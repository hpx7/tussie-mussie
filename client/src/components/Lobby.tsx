import { isEqual } from "lodash-es";
import React from "react";
import { RtagConnection } from "../../.rtag/client";
import { Color, PlayerInfo } from "../../.rtag/types";

interface ILobbyProps {
    isCreator: boolean;
    players: PlayerInfo[];
    client: RtagConnection;
}

interface ILobbyState {
    edited: boolean;
}

class Lobby extends React.Component<ILobbyProps, ILobbyState> {
    state = this.getDefaultState(this.props);
    private url = document.baseURI;

    componentDidUpdate(oldProps: ILobbyProps) {
        if (!isEqual(oldProps, this.props)) {
            this.setState(this.getDefaultState(this.props));
        }
    }

    render() {
        const { isCreator, players } = this.props;
        const { edited } = this.state;

        return (
            <div className="Lobby">
                <h3>Game Code: {this.getSessionCode()}</h3>
                <span>
          <input className="hive-input-btn-input" type="url" value={this.url} id="urlText" readOnly />
          <button className="hive-btn hive-input-btn" onClick={this.copyUrl}>
            Copy
          </button>
        </span>
                <button className="hive-btn hive-input-btn" onClick={this.joinGame}>
                    Join Game
                </button>
                <br />
                {players.length === 0 &&
                (isCreator ? (
                    <h5>Waiting on another player to join and start the game</h5>
                ) : (
                    <h5>Waiting on game creator to finish setting up the game</h5>
                ))}
                {players.length > 1 &&
                (isCreator ? (
                    <h5>Press "Play!" to start the game</h5>
                ) : (
                    <h5>Waiting for host to start the game!</h5>
                ))}
                {players.length > 4 &&
                (isCreator ? (
                    <h5>Too many players to start! Need to remove players (max 4)</h5>
                ) : (
                    <h5>Waiting for host to start the game!</h5>
                ))}
                <div className="GameSettings">
                </div>
                <br />
                {isCreator && (
                    <button className="hive-btn" onClick={this.saveSettings} disabled={players.length !== 0 && !edited}>
                        Save
                    </button>
                )}
                {isCreator && edited && (
                    <button className="hive-btn" onClick={this.resetSettings}>
                        Reset
                    </button>
                )}
                {(isCreator && players.length > 1 && players.length <= 4) && (
                    <button className="hive-btn" onClick={this.playGame} disabled={players.length === 0}>
                        Play!
                    </button>
                )}
            </div>
        );
    }

    private getDefaultState(props: ILobbyProps): ILobbyState {
        return {
            edited: false,
        };
    }

    private saveSettings = () => {
        // const { client } = this.props;
        // const { creatorColor } = this.state;
        //
        // client
        //     .setupGame({
        //         creatorColor,
        //     })
        //     .then((result) => {
        //         if (result.type === "error") {
        //             console.error(result.error);
        //         }
        //     });
    };

    private resetSettings = () => {
        this.setState(this.getDefaultState(this.props));
    };

    private joinGame = () => {
        this.props.client.joinGame({}).then((result) => {
            if (result.type === "error") {
                console.error(result.error);
            }
        });
    };

    private playGame = () => {
        this.props.client.startGame({}).then((result) => {
            if (result.type === "error") {
                console.error(result.error);
            }
        });
    };

    // private creatorColorChanged = (event: React.ChangeEvent<HTMLSelectElement>) => {
    //     const val = event.target.value;
    //     const color = val === Color[Color.WHITE] ? Color.WHITE : val === Color[Color.BLACK] ? Color.BLACK : undefined;
    //     this.setState({ creatorColor: color, edited: true });
    // };

    // private checkboxChanged(
    //     event: React.ChangeEvent<HTMLInputElement>,
    //     key: "tournament" | "isLadybugSelected" | "isMosquitoSelected" | "isPillbugSelected"
    // ) {
    //     if (key === "tournament") {
    //         this.setState({ [key]: event.target.checked, edited: true });
    //     } else if (key === "isLadybugSelected") {
    //         this.setState({ [key]: event.target.checked, edited: true });
    //     } else if (key === "isMosquitoSelected") {
    //         this.setState({ [key]: event.target.checked, edited: true });
    //     } else if (key === "isPillbugSelected") {
    //         this.setState({ [key]: event.target.checked, edited: true });
    //     }
    // }

    private getSessionCode(): string {
        return this.url.split("game/")[1].toUpperCase();
    }

    private copyUrl(): void {
        const copyText = document.getElementById("urlText") as HTMLInputElement;
        if (copyText) {
            copyText.select();
            copyText.setSelectionRange(0, 99999); /* For mobile devices */
            document.execCommand("copy");
        }
    }
}

export default Lobby;
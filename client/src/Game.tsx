import React, { useState, useEffect } from "react";
import { useLocation, useHistory } from "react-router-dom";
import { History } from "history";
import { RtagClient, RtagConnection } from "../.rtag/client";
import { GameStatus, PlayerState } from "../.rtag/types";
import Lobby from "./components/Lobby";
import PlayerTurns from "./components/PlayerTurns";
import RoundRecap from "./components/RoundRecap";
import GameOver from "./components/GameOver";

const client = new RtagClient(import.meta.env.VITE_APP_ID as string);

interface IGameProps {}

function Game(props: IGameProps) {
  const [playerState, setPlayerState] = useState<PlayerState | undefined>(undefined);
  const [rtag, setRtag] = useState<RtagConnection | undefined>(undefined);
  const [is404, setIs404] = useState<boolean>(false);
  const path = useLocation().pathname;
  const history = useHistory();

  useEffect(() => {
    if (rtag === undefined) {
      initRtag(path, history, setRtag, setPlayerState).catch((e) => {
        console.error("Error connecting", e);
        setIs404(true);
      });
    }
  }, [path]);

  const token = sessionStorage.getItem("user");
  const currentPlayerName = token !== null ? RtagClient.getUserFromToken(token).name : "";

  if (playerState && rtag && !is404 && path !== "/game") {
    return (
      <div>
        <p>{currentPlayerName}</p>
        {playerState.status === GameStatus.LOBBY && <Lobby {...playerState} isCreator={true} client={rtag}></Lobby>}
        {playerState.status === GameStatus.PLAYER_TURNS && (
          <PlayerTurns
            isCreator={true}
            playerState={playerState}
            currentPlayerInfo={playerState.players.find((p) => p.name === currentPlayerName)!}
            client={rtag}
          />
        )}
        {playerState.status === GameStatus.ROUND_RECAP && (
          <RoundRecap
            isCreator={true}
            playerState={playerState}
            currentPlayerInfo={playerState.players.find((p) => p.name === currentPlayerName)!}
            client={rtag}
          />
        )}
        {playerState.status === GameStatus.GAME_OVER && (
          <GameOver
            isCreator={true}
            playerState={playerState}
            currentPlayerInfo={playerState.players.find((p) => p.name === currentPlayerName)!}
            client={rtag}
          />
        )}
      </div>
    );
  } else if (is404) {
    return (
      <div className="background">
        <span className="fourOhFour">Game with this Game Code does not exist</span>
      </div>
    );
  } else {
    return <div></div>;
  }
}

async function initRtag(
  path: string,
  history: History,
  setRtag: (client: RtagConnection) => void,
  onStateChange: (state: PlayerState) => void
): Promise<void> {
  const storedUserData = sessionStorage.getItem("user");
  const token: string = storedUserData
    ? JSON.parse(storedUserData).token
    : await client.loginAnonymous().then((t) => {
        sessionStorage.setItem("user", JSON.stringify({ token: t }));
        return t;
      });
  const user = RtagClient.getUserFromToken(token);
  if (path === "/game") {
    const connection = await client.connectNew(token, { nickname: user.name }, onStateChange);
    setRtag(connection);
    history.replace(`/game/${connection.stateId}`);
  } else {
    const stateId = path.split("/").pop()!;
    const connection = await client.connectExisting(token, stateId, onStateChange);
    setRtag(connection);
  }
}

export default Game;

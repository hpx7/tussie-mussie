import { isEqual } from "lodash-es";
import React, {useState} from "react";
import { RtagConnection } from "../../.rtag/client";
import { PlayerState, PlayerInfo } from "../../.rtag/types";
import CardComponent from "./Card";

interface IRoundRecapProps {
  isCreator: boolean;
  currentPlayerInfo: PlayerInfo;
  playerState: PlayerState;
  client: RtagConnection;
}

function RoundRecap (props: IRoundRecapProps) {
    const { client, playerState, currentPlayerInfo } = props;

  const [arrangementZoom, setArrangementZoom] = useState('');

    return (
      <div>
        {playerState.round === 2 && <h2>{playerState.players.sort((a,b) => b.score - a.score)[0].name} wins!</h2>}
        {playerState.round < 2 && <h3>Scores:</h3>}
        {currentPlayerInfo &&
          playerState &&
          playerState.players
            .sort((a, b) => b.score - a.score)
            .map((p) => {
              return (
                <>
                  <h4 key={p.name}>
                    <strong>{p.name}'s</strong>: {p.score}
                  </h4>
                </>
              );
            })}

        <h3>Your Arrangement:</h3>
        <button className={"tussie--button-small"} onClick={() => setZoom(currentPlayerInfo.name)}>{arrangementZoom === currentPlayerInfo.name ? 'Unzoom' : 'Zoom'}</button>
        <div style={{display:"flex", overflowX:"auto"}}>
        {currentPlayerInfo &&
          currentPlayerInfo.hand.map((hc) => {
            return (
              <CardComponent
                key={hc.card.id}
                val={hc.card}
                state={playerState}
                client={client}
                isKeepsake={hc.isKeepsake}
                isSmall={currentPlayerInfo.name !== arrangementZoom}
              />
            );
          })}
        </div>

        {currentPlayerInfo &&
          playerState &&
          playerState.players
            .filter((p) => p.name !== currentPlayerInfo.name)
            .map((p) => {
              return (
                <>
                  <h3 key={p.name}>{p.name}'s Arrangement:</h3>
                  <button className={"tussie--button-small"} onClick={() => setZoom(p.name)}>{arrangementZoom === p.name ? 'Unzoom' : 'Zoom'}</button>
                  <div style={{display:"flex", overflowX:"auto"}}>
                  {p.hand.map((hc) => {
                    return (
                      <CardComponent
                        key={hc.card.id}
                        val={hc.card}
                        state={playerState}
                        client={client}
                        isKeepsake={hc.isKeepsake}
                        isSmall={p.name !== arrangementZoom}
                      />
                    );
                  })}
                  </div>
                </>
              );
            })}
        <div>
          <button className="hive-btn" onClick={advanceRound}>
            Advance Round
          </button>
        </div>
      </div>
    );

  function setZoom(playerName : string) {
    if (arrangementZoom === playerName) {
      setArrangementZoom('');
    }
    else {
      setArrangementZoom(playerName);
    }
  }

  function advanceRound() {
    props.client.advanceRound({}).then((result) => {
      if (result.type === "error") {
        console.error(result.error);
      }
    });
  }
}

export default RoundRecap;

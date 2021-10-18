import { isEqual } from "lodash-es";
import React, { useState, useEffect } from "react";
import { RtagConnection } from "../../.rtag/client";
import {PlayerState, PlayerInfo, Card} from "../../.rtag/types";
import CardComponent from "./Card";
import {CardAction} from "../types";

interface IBeforeScoringProps {
    isCreator: boolean;
    currentPlayerInfo: PlayerInfo;
    playerState: PlayerState;
    client: RtagConnection;
}

function BeforeScoring (props: IBeforeScoringProps) {
    const { client, playerState, currentPlayerInfo } = props;
    const [arrangementZoom, setArrangementZoom] = useState('');
    const [snapdragonZoom, setSnapdragonZoom] = useState(false);
    const [marigoldZoom, setMarigoldZoom] = useState(false);

    const [hasPinkLarkspur, setHasPinkLarkspur] = useState<Card | null>(null);
    const [hasSnapdragonActive, setHasSnapdragonActive] = useState<Card | null>(null);
    const [hasMarigoldActive, setHasMarigoldActive] = useState<Card | null>(null);
    const [totalBeforeScoring, setTotalBeforeScoring] = useState(0);

    const [pinkLarkspurSelected, setPinkLarkspurSelected] = useState(false);
    const [snapdragonSelected, setSnapdragonSelected] = useState(false);
    const [marigoldSelected, setMarigoldSelected] = useState(false);

    const [pinkLarkspurCardToAdd, setPinkLarkspurCardToAdd] = useState('');
    const [pinkLarkspurCardToReplace, setPinkLarkspurCardToReplace] = useState('');
    const [snapdragonCardsToFlip, setSnapdragonCardsToFlip] = useState<string[]>([]);
    const [marigoldCardToDiscard, setMarigoldCardToDiscard] = useState('');

    useEffect(() => {
        setHasPinkLarkspur(null);
        setHasSnapdragonActive(null);
        setHasMarigoldActive(null);

        currentPlayerInfo.hand.forEach(hc => {
            if (hc.card.details) {
                if (hc.card.details.name === 'PINK_LARKSPUR' && !playerState.beforeScoring.pinkLarkspurResolved) {
                    setHasPinkLarkspur(hc.card);
                    setTotalBeforeScoring(totalBeforeScoring + 1);
                }
                if (hc.card.details.name === 'SNAPDRAGON' && !playerState.beforeScoring.snapdragonResolved) {
                    setHasSnapdragonActive(hc.card);
                    setTotalBeforeScoring(totalBeforeScoring + 1);
                }
                if (hc.card.details.name === 'MARIGOLD' && !playerState.beforeScoring.marigoldResolved) {
                    setHasMarigoldActive(hc.card);
                    setTotalBeforeScoring(totalBeforeScoring + 1);
                }
            }
        });
    },[currentPlayerInfo, playerState]);

    return (
        <div>
            {playerState.round < 2 && <h2>Before Scoring Phase</h2>}
            {currentPlayerInfo && playerState && totalBeforeScoring === 0 &&
                <h4>Other Players are resolving Before Scoring actions.</h4>
            }
            {currentPlayerInfo && playerState && totalBeforeScoring > 0  &&
            !(pinkLarkspurSelected || snapdragonSelected || marigoldSelected) &&
            <>
                <h3>Select a card to resolve:</h3>
                <div style={{display:"flex", overflowX:"auto"}}>
                    {hasPinkLarkspur && <CardComponent
                        key={hasPinkLarkspur.id}
                        val={hasPinkLarkspur}
                        state={playerState}
                        client={client}
                        clickHandler={pinkLarkspurClick}
                        isKeepsake={false}
                    />}
                    {hasSnapdragonActive && <CardComponent
                        key={hasSnapdragonActive.id}
                        val={hasSnapdragonActive}
                        state={playerState}
                        client={client}
                        clickHandler={snapdragonClick}
                        isKeepsake={false}
                    />}
                    {hasMarigoldActive && <CardComponent
                        key={hasMarigoldActive.id}
                        val={hasMarigoldActive}
                        state={playerState}
                        client={client}
                        clickHandler={marigoldClick}
                        isKeepsake={false}
                    />}
                </div>
            </>
            }
            {currentPlayerInfo && playerState && pinkLarkspurSelected && !playerState.beforeScoring.pinkLarkspurHasDrawn &&
                <>
                    <h4>PINK LARKSPUR</h4>
                    <button onClick={pinkLarkspurDrawAction}>Draw Cards</button>
                    <br />
                    <button className={"tussie--button-small"} onClick={deselectBeforeScoringCard}>Go Back</button>
                </>
            }
            {currentPlayerInfo && playerState && pinkLarkspurSelected && playerState.beforeScoring.pinkLarkspurHasDrawn &&
                <>
                    <h4>PINK LARKSPUR</h4>
                    <h3>Select one card to add:</h3>

                    <div style={{display:"flex", overflowX:"auto"}}>
                    {currentPlayerInfo.drawnCards.map((card) => {
                        return (
                            <CardComponent
                                key={card.id}
                                val={card}
                                state={playerState}
                                client={client}
                                clickHandler={(s: CardAction) => setPinkLarkspurCardToAdd(s.cardName!)}
                                isSelected={pinkLarkspurCardToAdd === card.details?.name}
                            />
                        );
                    })}
                    </div>
                    <h3>Select one card to replace:</h3>

                    <div style={{display:"flex", overflowX:"auto"}}>
                    {currentPlayerInfo.hand.map((hc) => {
                        return (
                            <CardComponent
                                key={hc.card.id}
                                val={hc.card}
                                state={playerState}
                                client={client}
                                clickHandler={(s: CardAction) => setPinkLarkspurCardToReplace(s.cardName!)}
                                isKeepsake={hc.isKeepsake}
                                isSelected={pinkLarkspurCardToReplace === hc.card.details?.name}
                            />
                        );
                    })}
                    </div>
                    {/*<p>Add: {pinkLarkspurCardToAdd}</p>*/}
                    {/*<p>Replace: {pinkLarkspurCardToReplace}</p>*/}
                    <button onClick={submitPinkLarkspurAction}>Submit</button>
                    {/*<br />*/}
                    {/*<button className={"tussie--button-small"} onClick={deselectBeforeScoringCard}>Go Back</button>*/}
                </>
            }
            {currentPlayerInfo && playerState && snapdragonSelected &&
            <>
                <h4>SNAPDRAGON</h4>
                <h3>Select 2 cards to flip (bouquet to keepsake or keepsake to bouquet):</h3>
                <button className={"tussie--button-small"} onClick={() => setSnapdragonZoom(!snapdragonZoom)}>{snapdragonZoom ? 'Unzoom' : 'Zoom'}</button>

                <div style={{display:"flex", overflowX:"auto"}}>
                {currentPlayerInfo.hand.map((hc) => {
                    return (
                        <CardComponent
                            key={hc.card.id}
                            val={hc.card}
                            state={playerState}
                            client={client}
                            clickHandler={(s: CardAction) => selectCardForSnapdragon(s.cardName!)}
                            isKeepsake={hc.isKeepsake}
                            isSelected={snapdragonCardsToFlip.includes(hc.card.details!.name)}
                            isSmall={!snapdragonZoom}
                        />
                    );
                })}
                </div>
                {/*<p>Flip: {snapdragonCardsToFlip}</p>*/}
                <br />
                <button onClick={submitSnapdragonAction}>Submit</button>
                <br />
                <button className={"tussie--button-small"} onClick={deselectBeforeScoringCard}>Go Back</button>
            </>
            }
            {currentPlayerInfo && playerState && marigoldSelected &&
            <>
                <h4>MARIGOLD</h4>
                <h3>Discard one card from your arrangement:</h3>
                <button className={"tussie--button-small"} onClick={() => setMarigoldZoom(!marigoldZoom)}>{marigoldZoom ? 'Unzoom' : 'Zoom'}</button>

                <div style={{display:"flex", overflowX:"auto"}}>
                {currentPlayerInfo.hand.map((hc) => {
                    return (
                        <CardComponent
                            key={hc.card.id}
                            val={hc.card}
                            state={playerState}
                            client={client}
                            clickHandler={(s: CardAction) => {
                                if (s.cardName !== 'MARIGOLD') {
                                    selectCardToDiscard(s.cardName!);
                                }
                            }
                            }
                            isKeepsake={hc.isKeepsake}
                            isSelected={marigoldCardToDiscard === hc.card.details?.name}
                            isSmall={!marigoldZoom}
                        />
                    );
                })}
                </div>
                {/*<p>Discard: {marigoldCardToDiscard}</p>*/}
                <button onClick={submitMarigoldAction}>Submit</button>
                <br />
                <button className={"tussie--button-small"} onClick={deselectBeforeScoringCard}>Go Back</button>
            </>
            }

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

    function deselectBeforeScoringCard() {
        setPinkLarkspurSelected(false);
        setSnapdragonSelected(false);
        setMarigoldSelected(false);

        setPinkLarkspurCardToAdd('');
        setPinkLarkspurCardToReplace('');
        setSnapdragonCardsToFlip([]);
        setMarigoldCardToDiscard('');
    }

    function pinkLarkspurClick() {
        setPinkLarkspurSelected(true);
    }

    function snapdragonClick() {
        setSnapdragonSelected(true);
    }

    function marigoldClick() {
        setMarigoldSelected(true);
    }

    function pinkLarkspurDrawAction() {
        props.client.pinkLarkspurDrawAction({}).then((result) => {
            if (result.type === "error") {
                console.error(result.error);
            }
        });
    }

    function submitPinkLarkspurAction() {
        props.client.pinkLarkspurAction({cardToPick: pinkLarkspurCardToAdd, cardToReplace: pinkLarkspurCardToReplace})
            .then((result) => {
            if (result.type === "error") {
                console.error(result.error);
            }
            // Reset state
            setPinkLarkspurCardToAdd('');
            setPinkLarkspurCardToReplace('');
            deselectBeforeScoringCard();
        });
    }

    function submitSnapdragonAction() {
        props.client.snapdragonAction({cardsToSwitch: snapdragonCardsToFlip})
            .then((result) => {
            if (result.type === "error") {
                console.error(result.error);
            }
            // Reset state
            setSnapdragonCardsToFlip([]);
            deselectBeforeScoringCard();
        });
    }

    function submitMarigoldAction() {
        props.client.marigoldAction({cardToDiscard: marigoldCardToDiscard})
            .then((result) => {
            if (result.type === "error") {
                console.error(result.error);
            }
            // Reset state
            setMarigoldCardToDiscard('');
            deselectBeforeScoringCard();
        });
    }

    function selectCardForSnapdragon(cardName: string) {
        if (snapdragonCardsToFlip.includes(cardName)) {
            setSnapdragonCardsToFlip(snapdragonCardsToFlip.filter(x => x !== cardName));
        }
        else if (snapdragonCardsToFlip.length < 2) {
            setSnapdragonCardsToFlip([...snapdragonCardsToFlip, cardName]);
        }
    }

    function selectCardToDiscard(cardName: string) {
        if (marigoldCardToDiscard !== cardName) {
            setMarigoldCardToDiscard(cardName);
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

export default BeforeScoring;

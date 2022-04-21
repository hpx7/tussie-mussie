import { Response } from "../api/base";
import {
  UserId,
  BeforeScoringActions,
  Card,
  GameStatus,
  IInitializeRequest,
  IAdvanceRoundRequest,
  IDrawForOfferRequest,
  IJoinGameRequest,
  IMakeOfferRequest,
  IPlayAgainRequest,
  IMarigoldActionRequest,
  IPinkLarkspurActionRequest,
  IPinkLarkspurDrawActionRequest,
  ISelectBeforeScoringCardRequest,
  ISelectOfferRequest,
  ISnapdragonActionRequest,
  IStartGameRequest,
  Offer,
  HandCard,
  PlayerState,
  Nickname,
} from "../api/types";
import { Context, Methods } from "./.hathora/methods";
import { scoreForCard } from "./scoring";
import { createDeck } from "./deck";

type InternalPlayerInfo = {
  id: UserId;
  score: number;
  hand: HandCard[];
  drawnCards: Card[];
  discardedCards: Card[];
};
type InternalState = {
  nicknames: Map<UserId, Nickname>;
  deck: Card[];
  round: number;
  turn?: UserId;
  offer?: Offer;
  beforeScoring: BeforeScoringActions;
  players: InternalPlayerInfo[];
};

export class Impl implements Methods<InternalState> {
  initialize(ctx: Context, request: IInitializeRequest): InternalState {
    return {
      nicknames: new Map(),
      deck: createDeck(ctx),
      round: -1,
      beforeScoring: {
        pinkLarkspurHasDrawn: false,
        pinkLarkspurResolved: false,
        snapdragonResolved: false,
        marigoldResolved: false,
      },
      players: [],
    };
  }
  joinGame(state: InternalState, userId: UserId, ctx: Context, request: IJoinGameRequest): Response {
    if (state.players.find((p) => p.id === userId) !== undefined) {
      return Response.error("Already joined");
    }
    if (state.round >= 0) {
      return Response.error("Game has started");
    }
    state.nicknames.set(userId, request.nickname);
    state.players.push({ id: userId, score: 0, hand: [], drawnCards: [], discardedCards: [] });
    return Response.ok();
  }
  startGame(state: InternalState, userId: UserId, ctx: Context, request: IStartGameRequest): Response {
    if (state.players.length < 2) {
      return Response.error("Not enough players");
    }
    state.turn = state.players[0].id;
    state.round = 0;
    return Response.ok();
  }
  drawForOffer(state: InternalState, userId: UserId, ctx: Context, request: IDrawForOfferRequest): Response {
    if (state.round < 0) {
      return Response.error("Not started");
    }
    if (state.turn !== userId) {
      return Response.error("Not your turn");
    }
    const player = state.players.find((p) => p.id === userId)!;
    player.drawnCards = [state.deck.pop()!, state.deck.pop()!];
    return Response.ok();
  }
  makeOffer(state: InternalState, userId: UserId, ctx: Context, request: IMakeOfferRequest): Response {
    if (state.turn !== userId) {
      return Response.error("Not your turn");
    }
    const player = state.players.find((p) => p.id === userId)!;
    if (player.drawnCards.find((card) => card.details!.name === request.faceupCard) === undefined) {
      return Response.error("Card not valid");
    }
    const faceupCard = player.drawnCards.find((card) => card.details!.name === request.faceupCard)!;
    const facedownCard = player.drawnCards.find((card) => card.details!.name !== request.faceupCard)!;
    state.offer = { faceupCard, facedownCard };
    player.drawnCards = [];
    return Response.ok();
  }
  selectOffer(state: InternalState, userId: UserId, ctx: Context, request: ISelectOfferRequest): Response {
    if (state.offer === undefined) {
      return Response.error("Offer not made");
    }
    const turnIdx = state.players.findIndex((p) => p.id === state.turn)!;
    const chooser = state.players[(turnIdx + 1) % state.players.length];
    if (chooser.id !== userId) {
      return Response.error("Not your turn");
    }
    const player = state.players.find((p) => p.id === userId)!;
    const offerer = state.players[turnIdx];
    if (request.faceup) {
      player.hand.push({ card: state.offer.faceupCard, isKeepsake: false });
      offerer.hand.push({ card: state.offer.facedownCard, isKeepsake: true });
    } else {
      player.hand.push({ card: state.offer.facedownCard, isKeepsake: true });
      offerer.hand.push({ card: state.offer.faceupCard, isKeepsake: false });
    }
    state.offer = undefined;

    if (getGameStatus(state) === GameStatus.PLAYER_TURNS) {
      state.turn = state.players[(turnIdx + 1) % state.players.length].id;
    } else if (getGameStatus(state) === GameStatus.ROUND_RECAP) {
      state.players.forEach((p) => {
        p.hand.forEach((handCard) => {
          p.score += scoreForCard(handCard, p.hand);
        });
      });
    }
    return Response.ok();
  }
  selectBeforeScoringCard(
    state: InternalState,
    userId: UserId,
    ctx: Context,
    request: ISelectBeforeScoringCardRequest
  ): Response {
    return Response.error("Not implemented");
  }
  pinkLarkspurDrawAction(
    state: InternalState,
    userId: UserId,
    ctx: Context,
    request: IPinkLarkspurDrawActionRequest
  ): Response {
    if (getGameStatus(state) !== GameStatus.BEFORE_SCORING) {
      return Response.error("Illegal operation");
    }
    const player = state.players.find((p) => p.id === userId)!;
    if (!player.hand.find((hc) => hc.card.details?.name === "PINK_LARKSPUR")) {
      return Response.error("Invalid Action: Player doesn't have card");
    }
    player.drawnCards = [state.deck.pop()!, state.deck.pop()!];
    state.beforeScoring.pinkLarkspurHasDrawn = true;
    return Response.ok();
  }
  pinkLarkspurAction(
    state: InternalState,
    userId: UserId,
    ctx: Context,
    request: IPinkLarkspurActionRequest
  ): Response {
    if (getGameStatus(state) !== GameStatus.BEFORE_SCORING) {
      return Response.error("Illegal operation");
    }
    const player = state.players.find((p) => p.id === userId)!;
    if (!player.hand.find((hc) => hc.card.details?.name === "PINK_LARKSPUR")) {
      return Response.error("Invalid Action: Player doesn't have card");
    }
    const replaceIndex = player.hand.findIndex((hc) => hc.card.details?.name === request.cardToReplace);
    if (replaceIndex === -1) {
      return Response.error("Invalid card to replace selection");
    }
    const newCard = player.drawnCards.find((c) => c.details?.name === request.cardToPick);
    if (newCard === undefined) {
      return Response.error("Invalid card to add selection");
    }
    player.discardedCards.push(player.hand[replaceIndex].card);
    player.hand[replaceIndex] = {
      isKeepsake: player.hand[replaceIndex].isKeepsake,
      card: newCard,
    };

    state.beforeScoring.pinkLarkspurResolved = true;

    if (getGameStatus(state) === GameStatus.ROUND_RECAP) {
      state.players.forEach((p) => {
        p.hand.forEach((handCard) => {
          p.score += scoreForCard(handCard, p.hand);
        });
      });
    }
    return Response.ok();
  }
  snapdragonAction(state: InternalState, userId: UserId, ctx: Context, request: ISnapdragonActionRequest): Response {
    if (getGameStatus(state) !== GameStatus.BEFORE_SCORING) {
      return Response.error("Illegal operation");
    }
    const player = state.players.find((p) => p.id === userId)!;
    if (!player.hand.find((hc) => hc.card.details?.name === "SNAPDRAGON")) {
      return Response.error("Invalid Action: Player doesn't have card");
    }

    player.hand.forEach((hc) => {
      if (request.cardsToSwitch.includes(hc.card.details?.name || "")) {
        hc.isKeepsake = !hc.isKeepsake;
      }
    });

    state.beforeScoring.snapdragonResolved = true;

    if (getGameStatus(state) === GameStatus.ROUND_RECAP) {
      state.players.forEach((p) => {
        p.hand.forEach((handCard) => {
          p.score += scoreForCard(handCard, p.hand);
        });
      });
    }
    return Response.ok();
  }
  marigoldAction(state: InternalState, userId: UserId, ctx: Context, request: IMarigoldActionRequest): Response {
    if (getGameStatus(state) !== GameStatus.BEFORE_SCORING) {
      return Response.error("Illegal operation");
    }
    const player = state.players.find((p) => p.id === userId)!;
    if (!player.hand.find((hc) => hc.card.details?.name === "MARIGOLD")) {
      return Response.error("Invalid Action: Player doesn't have card");
    }

    const marigoldIndex = player.hand.findIndex((hc) => hc.card.details?.name === "MARIGOLD");
    const removeIndex = player.hand.findIndex((hc) => hc.card.details?.name === request.cardToDiscard);
    if (removeIndex === -1 && removeIndex !== marigoldIndex) {
      return Response.error("Invalid card to discard selection");
    }

    player.discardedCards.push(player.hand[removeIndex].card);
    player.hand.splice(removeIndex, 1);

    state.beforeScoring.marigoldResolved = true;

    if (getGameStatus(state) === GameStatus.ROUND_RECAP) {
      state.players.forEach((p) => {
        p.hand.forEach((handCard) => {
          p.score += scoreForCard(handCard, p.hand);
        });
      });
    }
    return Response.ok();
  }
  advanceRound(state: InternalState, userId: UserId, ctx: Context, request: IAdvanceRoundRequest): Response {
    if (getGameStatus(state) !== GameStatus.ROUND_RECAP) {
      return Response.error("Illegal operation");
    }
    state.round++;
    state.deck = createDeck(ctx);
    const turnIdx = state.players.findIndex((p) => p.id === state.turn)!;
    state.turn = state.players[(turnIdx + 1) % state.players.length].id;
    state.players.forEach((p) => {
      p.drawnCards = [];
      p.discardedCards = [];
      p.hand = [];
    });
    state.beforeScoring = {
      pinkLarkspurHasDrawn: false,
      pinkLarkspurResolved: false,
      snapdragonResolved: false,
      marigoldResolved: false,
    };
    return Response.ok();
  }
  playAgain(state: InternalState, userId: UserId, ctx: Context, request: IPlayAgainRequest): Response {
    if (getGameStatus(state) < GameStatus.ROUND_RECAP || state.round < 2) {
      return Response.error("Illegal operation");
    }
    state.round = 0;
    state.deck = createDeck(ctx);
    state.players.forEach((p) => {
      p.score = 0;
      p.hand = [];
      p.drawnCards = [];
      p.discardedCards = [];
    });
    state.beforeScoring = {
      pinkLarkspurHasDrawn: false,
      pinkLarkspurResolved: false,
      snapdragonResolved: false,
      marigoldResolved: false,
    };
    return Response.ok();
  }
  getUserState(state: InternalState, userId: UserId): PlayerState {
    const status = getGameStatus(state);
    return {
      round: state.round,
      turn: state.turn !== undefined ? state.nicknames.get(state.turn)! : "",
      status,
      offer:
        state.offer !== undefined
          ? { faceupCard: state.offer.faceupCard, facedownCard: maskCard(state.offer.facedownCard) }
          : undefined,
      beforeScoring: state.beforeScoring,
      players: state.players.map((p) => {
        if (p.id === userId || status === GameStatus.ROUND_RECAP) {
          return { ...p, name: state.nicknames.get(p.id)! };
        }
        return {
          ...p,
          name: state.nicknames.get(p.id)!,
          drawnCards: p.drawnCards.map((card) => maskCard(card)),
          hand: p.hand.map((card) => (card.isKeepsake ? { card: maskCard(card.card), isKeepsake: true } : card)),
        };
      }),
      nickname: state.nicknames.get(userId) ?? "",
    };
  }
}

function getGameStatus(state: InternalState): GameStatus {
  if (state.round < 0) {
    return GameStatus.LOBBY;
  }
  if (state.round === 3) {
    return GameStatus.GAME_OVER;
  }
  if (state.players.every((p) => p.hand.length === 4 || p.hand.find((hc) => hc.card.details?.name === "MARIGOLD"))) {
    let isPinkLarkspurActive = false;
    let isSnapdragonActive = false;
    let isMarigoldActive = false;
    let totalBeforeScoring = 0;
    let totalBeforeScoringResolved = 0;

    // Count up how many beforeScoring cards were drafted
    // TODO: There is a bug because some BS cards allow players to discard or replace BefScore cards, causing early termination
    state.players.forEach((p) => {
      p.hand
        .map((hc) => hc.card)
        .concat(p.discardedCards)
        .forEach((card) => {
          if (card.details) {
            if (card.details.name === "PINK_LARKSPUR") {
              isPinkLarkspurActive = true;
              totalBeforeScoring++;
            }
            if (card.details.name === "SNAPDRAGON") {
              isSnapdragonActive = true;
              totalBeforeScoring++;
            }
            if (card.details.name === "MARIGOLD") {
              isMarigoldActive = true;
              totalBeforeScoring++;
            }
          }
        });
    });
    // Check how many have already been resolved
    if (totalBeforeScoring > 0) {
      if (state.beforeScoring?.pinkLarkspurResolved) {
        totalBeforeScoringResolved++;
      }
      if (state.beforeScoring?.snapdragonResolved) {
        totalBeforeScoringResolved++;
      }
      if (state.beforeScoring?.marigoldResolved) {
        totalBeforeScoringResolved++;
      }
    }
    if (totalBeforeScoring > 0 && totalBeforeScoring > totalBeforeScoringResolved) {
      return GameStatus.BEFORE_SCORING;
    }
    return GameStatus.ROUND_RECAP;
  }
  return GameStatus.PLAYER_TURNS;
}

function maskCard(card: Card): Card {
  return { ...card, details: undefined };
}

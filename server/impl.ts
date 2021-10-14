import { Context, Methods } from "./.rtag/methods";
import { Response, UserData } from "./.rtag/base";
import {
  Card,
  GameStatus,
  IAdvanceRoundRequest,
  ICreateGameRequest,
  IDrawForOfferRequest,
  IJoinGameRequest,
  IMakeOfferRequest,
  IPlayAgainRequest,
  ISelectOfferRequest,
  IStartGameRequest,
  Offer,
  PlayerInfo,
  PlayerState,
  Username,
} from "./.rtag/types";
import { scoreForCard } from "./scoring";
import { createDeck } from "./deck";

type UserId = string;
type InternalState = {
  nicknames: Map<UserId, Username>;
  deck: Card[];
  round: number;
  turn: Username;
  offer?: Offer;
  players: PlayerInfo[];
};

export class Impl implements Methods<InternalState> {
  createGame(user: UserData, ctx: Context, request: ICreateGameRequest): InternalState {
    return {
      nicknames: new Map([[user.id, request.nickname]]),
      deck: createDeck(ctx),
      round: -1,
      turn: user.id,
      players: [{ name: user.id, score: 0, hand: [], drawnCards: [] }],
    };
  }
  joinGame(state: InternalState, user: UserData, ctx: Context, request: IJoinGameRequest): Response {
    if (state.players.find((p) => p.name === user.id) !== undefined) {
      return Response.error("Already joined");
    }
    if (state.round >= 0) {
      return Response.error("Game has started");
    }
    state.nicknames.set(user.id, request.nickname);
    state.players.push({ name: user.id, score: 0, hand: [], drawnCards: [] });
    return Response.ok();
  }
  startGame(state: InternalState, user: UserData, ctx: Context, request: IStartGameRequest): Response {
    if (state.players.length < 2) {
      return Response.error("Not enough players");
    }
    state.round = 0;
    return Response.ok();
  }
  drawForOffer(state: InternalState, user: UserData, ctx: Context, request: IDrawForOfferRequest): Response {
    if (state.round < 0) {
      return Response.error("Not started");
    }
    if (state.turn !== user.id) {
      return Response.error("Not your turn");
    }
    const player = state.players.find((p) => p.name === user.id)!;
    player.drawnCards = [state.deck.pop()!, state.deck.pop()!];
    return Response.ok();
  }
  makeOffer(state: InternalState, user: UserData, ctx: Context, request: IMakeOfferRequest): Response {
    if (state.turn !== user.id) {
      return Response.error("Not your turn");
    }
    const player = state.players.find((p) => p.name === user.id)!;
    if (player.drawnCards.find((card) => card.details!.name === request.faceupCard) === undefined) {
      return Response.error("Card not valid");
    }
    const faceupCard = player.drawnCards.find((card) => card.details!.name === request.faceupCard)!;
    const facedownCard = player.drawnCards.find((card) => card.details!.name !== request.faceupCard)!;
    state.offer = { faceupCard, facedownCard };
    player.drawnCards = [];
    return Response.ok();
  }
  selectOffer(state: InternalState, user: UserData, ctx: Context, request: ISelectOfferRequest): Response {
    if (state.offer === undefined) {
      return Response.error("Offer not made");
    }
    const turnIdx = state.players.findIndex((p) => p.name === state.turn)!;
    const chooser = state.players[(turnIdx + 1) % state.players.length];
    if (chooser.name !== user.id) {
      return Response.error("Not your turn");
    }
    const player = state.players.find((p) => p.name === user.id)!;
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
      state.turn = state.players[(turnIdx + 1) % state.players.length].name;
    } else {
      state.players.forEach((p) => {
        p.hand.forEach((handCard) => {
          p.score += scoreForCard(handCard, p.hand);
        });
      });
    }
    return Response.ok();
  }
  advanceRound(state: InternalState, user: UserData, ctx: Context, request: IAdvanceRoundRequest): Response {
    if (getGameStatus(state) !== GameStatus.ROUND_RECAP) {
      return Response.error("Illegal operation");
    }
    state.round++;
    state.deck = createDeck(ctx);
    const turnIdx = state.players.findIndex((p) => p.name === state.turn)!;
    state.turn = state.players[(turnIdx + 1) % state.players.length].name;
    state.players.forEach((p) => {
      p.drawnCards = [];
      p.hand = [];
    });
    return Response.ok();
  }
  playAgain(state: InternalState, user: UserData, ctx: Context, request: IPlayAgainRequest): Response {
    if (getGameStatus(state) !== GameStatus.GAME_OVER || state.round < 2) {
      return Response.error("Illegal operation");
    }
    state.round = 0;
    state.deck = createDeck(ctx);
    state.players.forEach((p) => {
      p.score = 0;
      p.hand = [];
      p.drawnCards = [];
    });
    return Response.ok();
  }
  getUserState(state: InternalState, user: UserData): PlayerState {
    const status = getGameStatus(state);
    return {
      round: state.round,
      turn: state.nicknames.get(state.turn)!,
      status,
      offer:
        state.offer !== undefined
          ? { faceupCard: state.offer.faceupCard, facedownCard: maskCard(state.offer.facedownCard) }
          : undefined,
      players: state.players.map((p) => {
        if (p.name === user.id || status === GameStatus.ROUND_RECAP) {
          return { ...p, name: state.nicknames.get(p.name)! };
        }
        return {
          ...p,
          name: state.nicknames.get(p.name)!,
          drawnCards: p.drawnCards.map((card) => maskCard(card)),
          hand: p.hand.map((card) => (card.isKeepsake ? { card: maskCard(card.card), isKeepsake: true } : card)),
        };
      }),
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
  if (state.players.every((p) => p.hand.length === 4)) {
    return GameStatus.ROUND_RECAP;
  }
  return GameStatus.PLAYER_TURNS;
}

function maskCard(card: Card): Card {
  return { ...card, details: undefined };
}

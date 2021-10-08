import { Methods, Context } from "./.rtag/methods";
import { UserData, Response } from "./.rtag/base";
import {
  PlayerState,
  ICreateGameRequest,
  IJoinGameRequest,
  IStartGameRequest,
  IDrawForOfferRequest,
  IMakeOfferRequest,
  ISelectOfferRequest,
  ISelectBeforeScoringActionRequest,
  IAdvanceRoundRequest,
  Card,
  PlayerInfo,
  Username,
  Color,
  GameStatus,
  CardDetails,
  Offer,
} from "./.rtag/types";

type InternalState = {
  deck: Card[];
  round: number;
  turn: Username;
  offer?: Offer;
  players: PlayerInfo[];
};

export class Impl implements Methods<InternalState> {
  createGame(user: UserData, ctx: Context, request: ICreateGameRequest): InternalState {
    return {
      deck: createDeck(ctx),
      round: -1,
      turn: user.name,
      players: [{ name: user.name, score: 0, hand: [], drawnCards: [] }],
    };
  }
  joinGame(state: InternalState, user: UserData, ctx: Context, request: IJoinGameRequest): Response {
    if (state.players.find((p) => p.name === user.name) !== undefined) {
      return Response.error("Already joined");
    }
    if (state.round >= 0) {
      return Response.error("Game has started");
    }
    state.players.push({ name: user.name, score: 0, hand: [], drawnCards: [] });
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
    if (state.turn !== user.name) {
      return Response.error("Not your turn");
    }
    const player = state.players.find((p) => p.name === user.name)!;
    player.drawnCards = [state.deck.pop()!, state.deck.pop()!];
    return Response.ok();
  }
  makeOffer(state: InternalState, user: UserData, ctx: Context, request: IMakeOfferRequest): Response {
    const player = state.players.find((p) => p.name === user.name)!;
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
    const player = state.players.find((p) => p.name === user.name)!;
    const turnIdx = state.players.findIndex((p) => p.name === state.turn)!;
    const offerer = state.players[turnIdx];
    if (request.faceup) {
      player.hand.push({ card: state.offer.faceupCard, isKeepsake: false });
      offerer.hand.push({ card: state.offer.facedownCard, isKeepsake: true });
    } else {
      player.hand.push({ card: state.offer.facedownCard, isKeepsake: true });
      offerer.hand.push({ card: state.offer.faceupCard, isKeepsake: false });
    }
    state.turn = state.players[(turnIdx + 1) % state.players.length].name;
    return Response.ok();
  }
  selectBeforeScoringAction(
    state: InternalState,
    user: UserData,
    ctx: Context,
    request: ISelectBeforeScoringActionRequest
  ): Response {
    return Response.error("Not implemented");
  }
  advanceRound(state: InternalState, user: UserData, ctx: Context, request: IAdvanceRoundRequest): Response {
    return Response.error("Not implemented");
  }
  getUserState(state: InternalState, user: UserData): PlayerState {
    return {
      round: state.round,
      turn: state.turn,
      status: getGameStatus(state),
      offer:
        state.offer !== undefined
          ? {
              faceupCard: state.offer.faceupCard,
              facedownCard: { ...state.offer.facedownCard, details: undefined },
            }
          : undefined,
      players: state.players.map((p) => {
        if (p.name === user.name) {
          return p;
        }
        return {
          ...p,
          drawnCards: p.drawnCards.map((card) => ({ ...card, details: undefined })),
          hand: p.hand.map((card) =>
            card.isKeepsake ? { card: { ...card.card, details: undefined }, isKeepsake: true } : card
          ),
        };
      }),
    };
  }
}

function getGameStatus(state: InternalState) {
  if (state.round < 0) {
    return GameStatus.LOBBY;
  }
  if (state.players.every((p) => p.hand.length === 4)) {
    return GameStatus.BEFORE_SCORING;
  }
  return GameStatus.PLAYER_TURNS;
}

function createDeck(ctx: Context) {
  const cards = [
    createCard(ctx, {
      name: "CAMELLIA",
      color: Color.RED,
      numHearts: 1,
      ruleText: "No effect",
    }),
    createCard(ctx, {
      name: "RED_ROSE",
      color: Color.PINK,
      numHearts: 2,
      ruleText: "No effect",
    }),
    createCard(ctx, {
      name: "HYACINTH",
      color: Color.PURPLE,
      numHearts: 0,
      ruleText: "+3 points if you have no hearts",
    }),
  ];
  return shuffle(ctx.randInt, cards);
}

function createCard(ctx: Context, details: CardDetails): Card {
  return { id: ctx.randInt(), details };
}

function shuffle<T>(randInt: (limit: number) => number, items: T[]) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

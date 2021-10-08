import { Context, Methods } from "./.rtag/methods";
import { AnonymousUserData, Response, UserData } from "./.rtag/base";
import {
  Card,
  CardDetails,
  Color,
  GameStatus,
  HandCard,
  IAdvanceRoundRequest,
  ICreateGameRequest,
  IDrawForOfferRequest,
  IJoinGameRequest,
  IMakeOfferRequest,
  IMarigoldActionRequest,
  IMoveToScoreRequest,
  IPinkLarkspurActionRequest,
  ISelectBeforeScoringCardRequest,
  ISelectOfferRequest,
  ISnapdragonActionRequest,
  IStartGameRequest,
  Offer,
  PlayerInfo,
  PlayerState,
  Username,
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
    if (state.turn !== user.name) {
      return Response.error("Not your turn");
    }
    const player = state.players.find((p) => p.name === user.name)!;
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
    if (chooser.name !== user.name) {
      return Response.error("Not your turn");
    }
    const player = state.players.find((p) => p.name === user.name)!;
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
      processRecap(state);
    }
    return Response.ok();
  }
  selectBeforeScoringCard(
    state: InternalState,
    user: UserData,
    ctx: Context,
    request: ISelectBeforeScoringCardRequest
  ): Response {
    return Response.error("Not implemented");
  }
  pinkLarkspurAction(
    state: InternalState,
    user: AnonymousUserData,
    ctx: Context,
    request: IPinkLarkspurActionRequest
  ): Response {
    throw new Error("Method not implemented.");
  }
  snapdragonAction(
    state: InternalState,
    user: AnonymousUserData,
    ctx: Context,
    request: ISnapdragonActionRequest
  ): Response {
    throw new Error("Method not implemented.");
  }
  marigoldAction(
    state: InternalState,
    user: AnonymousUserData,
    ctx: Context,
    request: IMarigoldActionRequest
  ): Response {
    throw new Error("Method not implemented.");
  }
  moveToScore(state: InternalState, user: AnonymousUserData, ctx: Context, request: IMoveToScoreRequest): Response {
    throw new Error("Method not implemented.");
  }
  advanceRound(state: InternalState, user: UserData, ctx: Context, request: IAdvanceRoundRequest): Response {
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

function processRecap(state: InternalState) {
  state.players.forEach((p) => {
    p.hand.forEach((handCard) => {
      let score = scoreForCard(handCard, p.hand);
      p.score += score;
    });
  });
}

function scoreForCard(handCard: HandCard, hand: HandCard[]) {
  let score = 0;
  let card = handCard.card;
  // hearts
  score += card.details!.numHearts!;

  // custom rules
  if (card.details!.name === "RED_ROSE") {
    hand.forEach((hc) => (score += hc.card.details!.numHearts));
  } else if (card.details!.name === "RED_TULIP") {
    hand.forEach((hc) => {
      if (hc.card.details!.color === Color.RED || hc.card.details!.name === "ORCHID") {
        score += 1;
      }
    });
  } else if (card.details!.name === "AMARYLLIS") {
    hand.forEach((hc) => {
      if (!hc.isKeepsake) {
        score += 1;
      }
    });
  } else if (card.details!.name === "GARDENIA") {
    hand.forEach((hc) => {
      if (hc.isKeepsake) {
        score += 1;
      }
    });
  } else if (card.details!.name === "DAISY") {
    hand.forEach((hc) => {
      if (hc.card.details!.numHearts === 0 && card.details!.name !== "DAISY") {
        score += 1;
      }
    });
  } else if (card.details!.name === "PEONY") {
    let bcount = 0;
    hand.forEach((hc) => {
      if (!hc.isKeepsake) {
        bcount += 1;
      }
    });
    if (bcount === 2) {
      score += 2;
    }
  } else if (card.details!.name === "PINK_ROSE") {
    hand.forEach((hc) => {
      if (hc.card.details!.color === Color.PINK || hc.card.details!.name === "ORCHID") {
        score += 1;
      }
    });
  } else if (card.details!.name === "FORGET_ME_NOT") {
    let thisIdx = hand.findIndex((hc) => hc.card.details!.name === card.details!.name);
    if (thisIdx > 0) {
      score += hand[thisIdx - 1].card.details!.numHearts;
    }
    if (thisIdx < hand.length - 1) {
      score += hand[thisIdx + 1].card.details!.numHearts;
    }
  } else if (card.details!.name === "HYACINTH") {
    if (hand.every((hc) => hc.card.details!.numHearts === 0)) {
      score += 3;
    }
  } else if (card.details!.name === "VIOLET") {
    hand.forEach((hc) => {
      if (hc.card.details!.color === Color.PURPLE || hc.card.details!.name === "ORCHID") {
        score += 1;
      }
    });
  } else if (card.details!.name === "CARNATION") {
    let colors = new Set<Color>();
    let whiteCount = 0;
    let hasOrchid = false;
    let bonusPoints = 0;
    hand.forEach((hc) => {
      colors.add(hc.card.details!.color);
      if (hc.card.details!.color === Color.WHITE) {
        whiteCount++;
      }
      if (hc.card.details!.name === "ORCHID") {
        hasOrchid = true;
      }
    });
    if (colors.size < 4 && whiteCount > 1 && hasOrchid) {
      bonusPoints = 1;
    }
    score += colors.size + bonusPoints;
  }
  return score;
}

function getGameStatus(state: InternalState) {
  if (state.round < 0) {
    return GameStatus.LOBBY;
  }
  if (state.round === 3) {
    return GameStatus.GAME_OVER;
  }
  if (state.players.every((p) => p.hand.length === 4)) {
    return GameStatus.ROUND_RECAP; //TODO
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
      color: Color.RED,
      numHearts: 0,
      ruleText: "+1 point for each of your hearts",
    }),
    createCard(ctx, {
      name: "RED_TULIP",
      color: Color.RED,
      numHearts: 0,
      ruleText: "+1 point for each of your red cards, including this one",
    }),
    createCard(ctx, {
      name: "AMARYLLIS",
      color: Color.RED,
      numHearts: 0,
      ruleText: "+1 point for each card in your bouquet",
    }),
    createCard(ctx, {
      name: "GARDENIA",
      color: Color.WHITE,
      numHearts: 0,
      ruleText: "+1 point for each of your keepsakes",
    }),
    createCard(ctx, {
      name: "DAISY",
      color: Color.WHITE,
      numHearts: 0,
      ruleText: "+1 point for each of your other cards without a heart",
    }),
    createCard(ctx, {
      name: "ORCHID",
      color: Color.WHITE,
      numHearts: 0,
      ruleText: "This card counts as any of one color",
    }),
    createCard(ctx, {
      name: "PEONY",
      color: Color.PINK,
      numHearts: 1,
      ruleText: "+2 points if you have exactly two cards in your bouquet",
    }),
    createCard(ctx, {
      name: "PHLOX",
      color: Color.PINK,
      numHearts: 2,
      ruleText: "No effect",
    }),
    createCard(ctx, {
      name: "PINK_ROSE",
      color: Color.PINK,
      numHearts: 0,
      ruleText: "+1 point for each of your pink cards, including this one",
    }),
    createCard(ctx, {
      name: "PINK_LARKSPUR",
      color: Color.PINK,
      numHearts: 0,
      ruleText:
        "Before scoring, you may draw two cards. If you do, you must replace one of your cards with one of them",
    }),
    createCard(ctx, {
      name: "FORGET_ME_NOT",
      color: Color.PURPLE,
      numHearts: 1,
      ruleText: "+1 point for each heart on your cards adjacent to this one",
    }),
    createCard(ctx, {
      name: "VIOLET",
      color: Color.PURPLE,
      numHearts: 0,
      ruleText: "+1 poiint for each of your purple cards, including this one",
    }),
    createCard(ctx, {
      name: "SNAPDRAGON",
      color: Color.PURPLE,
      numHearts: 1,
      ruleText:
        "Before scoring, you may change up to 2 of your cards, each from bouquet to keepsakes or keepsakes to bouquet",
    }),
    createCard(ctx, {
      name: "HONEYSUCKLE",
      color: Color.YELLOW,
      numHearts: 1,
      ruleText: "+1 point for each card adjacent to this one in your bouquet",
    }),
    createCard(ctx, {
      name: "CARNATION",
      color: Color.YELLOW,
      numHearts: 0,
      ruleText: "+1 point for each of your different color cards",
    }),
    createCard(ctx, {
      name: "MARIGOLD",
      color: Color.YELLOW,
      numHearts: 2,
      ruleText: "Before scoring, you must discord one of your other cards",
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

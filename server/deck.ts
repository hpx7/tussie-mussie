import { Context } from "./.rtag/methods";
import { Color, CardDetails, Card } from "./.rtag/types";

export function createDeck(ctx: Context) {
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
      numHearts: 1,
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

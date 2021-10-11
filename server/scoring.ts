import { HandCard, Color } from "./.rtag/types";

export function scoreForCard(handCard: HandCard, hand: HandCard[]) {
  let score = 0;
  let card = handCard.card;
  // hearts
  score += card.details!.numHearts;

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
      if (hc.card.details!.numHearts === 0 && hc.card.details!.name !== "DAISY") {
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

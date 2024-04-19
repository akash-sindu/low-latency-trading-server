import express from "express";
import { json } from "stream/consumers";

export const app = express();
app.use(express.json());
const port = 3000;
const Balances = {};
const Order = {};
const ticker = "TSLA";
const users = [
  {
    id: "1",
    balance: {
      TSLA: 10,
      GBP: 50000,
    },
  },
  {
    id: "2",
    balance: {
      TSLA: 10,
      GBP: 50000,
    },
  },
];

const bids = [];
const asks = [];

app.post("/sendOrder", (req, res) => {
  const { side, price, quantity, userId } = req.body;

  const remainingQuantity = fillOrders(side, price, quantity, userId);

  if (remainingQuantity === 0) {
    res.json({ filledQuantity: quantity });
    return;
  }

  if (side === "bid") {
    bids.push({
      userId,
      price,
      quantity: remainingQuantity,
    });
    bids.sort((a, b) => (a.price < b.price ? -1 : 1));
  } else {
    asks.push({
      userId,
      price,
      quantity: remainingQuantity,
    });
    asks.sort((a, b) => (a.price < b.price ? 1 : -1));
  }
  res.json({
    filledQuantity: quantity - remainingQuantity,
  });
});

function fillOrders(side, price, quantity, userId) {
  let remainingQuantity = quantity;

  if (side === "bid") {
    for (let i = asks.length - 1; i >= 0; i--) {
      if (asks[i].price > price) {
        break;
      }
      if (asks[i].quantity > remainingQuantity) {
        asks[i].quantity -= remainingQuantity;
        flipBalance(asks[i].userId, userId, remainingQuantity, asks[i].price);
      } else {
        remainingQuantity -= asks[i].quantity;
        flipBalance(asks[i].userId, userId, asks[i].quantity, asks[i].price);
        asks.pop();
      }
    }
  } else {
    for (let i = bids.length - 1; i >= 0; i--) {
      if (bids[i].price < price) {
        break;
      }
      if (bids[i].quantity > remainingQuantity) {
        bids[i].quantity -= remainingQuantity;
        flipBalance(userId, bids[i].userId, remainingQuantity, price);
      } else {
        remainingQuantity -= bids[i].quantity;
        flipBalance(userId, bids[i].userId, bids[i].quantity, price);
        bids.pop();
      }
    }
  }

  return 0;
}

function flipBalance(userIdFoUserInOrderBook, incomingUserId, quantity, price) {
  let user1 = users.find((x) => x.id === userIdFoUserInOrderBook);
  let user2 = users.find((x) => x.id === incomingUserId);

  if (!user1 || !user2) {
    return;
  }

  user1.balance[ticker] -= quantity;
  user1.balance["GBP"] += price * quantity;

  user2.balance[ticker] += quantity;
  user2.balance["GBP"] -= price * quantity;
}

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

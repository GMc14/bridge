//Game Config
var gameConfig_playerCount = 3;
var gameConfig_isBridge = false;
var gameConfig_startCardsPerPlayer = 5;

var standardRanks = new Array(2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14);
var euchreRanks = new Array(9, 10, 11, 12, 13, 14);
//Variables
var deck = [];
var ranks = euchreRanks;
var suits = new Array("C", "D", "H", "");
var suitColors=[];
suitColors["C"] = "Black";
suitColors["S"] = "Black";
suitColors["H"] = "Red";
suitColors["D"] = "Red";
var cardback = "card_imgs/cardback.png";

function Card(suit, rank) {
  this.suit = suit;
  this.rank = rank;
}

function startGame() {
  if (playerNum == dealer) {
    var myHand = document.getElementById("myPlayer");
    while (myHand.firstChild) {
      myHand.removeChild(myHand.firstChild);
    }
    var otherHands = document.getElementsByClassName("otherPlayers");
    for (var i = 0; i < $("#gameBoard .otherPlayers").length; i++) {
      while (otherHands[i].firstChild) {
        otherHands[i].removeChild(otherHands[i].firstChild);
      }
    }
    createDeck();
    shuffle();
    dealCards();
  }
}

function createDeck() {
  deck = [];
  for (var i = 0; i < suits.length; i++) {
    for (var j = 0; j < ranks.length; j++) {
      deck.push(new Card(suits[i], ranks[j]));
    }
  }
}

function shuffle() {
  var m = deck.length,
    t, i, shuffled = deck;
  // While there are cards to shuffle
  while (m) {
    m--;
    //Pick a remaining element
    i = Math.floor(Math.random() * m);

    // Swap with last remaining element
    t = shuffled[m];
    shuffled[m] = shuffled[i];
    shuffled[i] = t;
  }
  deck = shuffled;
}

function dealCards() {
  //TODO: vary by player count and cards dealt per player
  var hands = [];
  var handValues = [];
  for (var i = 0; i < gameConfig_playerCount; i++) {
    hands[i] = [];
    handValues[i] = 0;
    for (var j = 0; j < gameConfig_startCardsPerPlayer; j++) {
      handValues[i] += cardValue(deck[deck.length - 1]);
      hands[i].push(deck.pop());
    }
    if (gameConfig_isBridge && handValues[i] < 4) {
      shuffle();
      dealCards();
      return;
    }
  }
  var trumpCard='';
  if(gameConfig_topDeckTrump && deck.length > 0){
    trumpCard = deck.pop();
  }
  socketio.emit('dealCards', {
    hands: hands,
    roomID: roomID,
    trumpCard: trumpCard
  });
}

function cardValue(card) {
  var value = Number(card.rank) < 10 ? 0 : Number(card.rank) - 10;
  return value;
}

function sortHand() {
  Player1.sort(function (a, b) {
    var aSuit = a.suit;
    var bSuit = b.suit;
    var aRank = a.rank;
    var bRank = b.rank;

    if (aSuit == bSuit) {
      return (aRank < bRank) ? -1 : (aRank > bRank) ? 1 : 0;
    } else {
      return aSuit < bSuit ? -1 : 1;
    }
  });
}

function displayTrumpCard(trumpCard) {
  var cardRank = String(trumpCard.rank);
  var cardSuit = String(trumpCard.suit);
  var cardID = cardSuit + cardRank;
  var card = document.createElement("div");
  var encodedI = i + 10;
  card.setAttribute("class", "trumpCard");
  card.setAttribute("id", encodedI + cardID);
  $("#" + cardID + "_img").clone().show().appendTo(card);
  card.addEventListener("click", playCard, true);
  document.getElementById("PlayerAcross").appendChild(card);
}

function displayCards() {
  for (var j = 0; j < gameConfig_startCardsPerPlayer - 1; j++) {
    displayOtherCards(j);
  }
  var hand = document.getElementById("myPlayer");
  while (hand.firstChild) {
    hand.removeChild(hand.firstChild);
  }
  for (var i = 0; i < Player1.length; i++) {
    var cardRank = String(Player1[i].rank);
    var cardSuit = String(Player1[i].suit);
    var cardID = cardSuit + cardRank;
    var card = document.createElement("div");
    var encodedI = i + 10;
    card.setAttribute("class", "myCards");
    card.setAttribute("id", encodedI + cardID);
    $("#" + cardID + "_img").clone().show().appendTo(card);
    card.addEventListener("click", playCard, true);
    hand.appendChild(card);
  }
}

function displayOtherCards(playerIndex) {
  var hand;
  if (playerIndex == 0) {
    hand = document.getElementById("PlayerRight");
  } else if (playerIndex == 1) {
    hand = document.getElementById("PlayerAcross");
  } else if (playerIndex == 2) {
    hand = document.getElementById("PosLeft");
  }
  if (hand) {
    while (hand.firstChild) {
      hand.removeChild(hand.firstChild);
    }
    for (var i = 0; i < gameConfig_startCardsPerPlayer; i++) {
      var card = document.createElement("div");
      card.setAttribute("class", "otherCards");
      $(".cardback:eq(0)").clone().show().appendTo(card);
      hand.appendChild(card);
    }
  }
}

function playCard() {
  if (currentPlayer == playerNum) {
    if (playerNum == lead) {
      $(".plays").empty();
    }
    var num = $(this).attr('id').substr(0, 2);
    var cardID = $(this).attr('id').substr(2);
    var legal = true;
    if (playerNum != lead) {
      legal = checkLegal(cardID);
    }
    if (legal) {
      Player1[Number(num) - 10].suit = "Z";
      card = document.getElementById(num + cardID);
      cardsub = card;
      card.parentNode.removeChild(card);
      myPlay = document.getElementById("myPlay");
      myPlay.appendChild(cardsub);
      socketio.emit('playCard', {
        roomID: roomID,
        card: cardID
      });
    }
  }
}

function othersPlayed(play, card) {
  var area = document.getElementById(play);
  console.log("othersPlayed++++++++++++");
  switch (play) {
    case "rightPlay":
      
      console.log("othersPlayed++++++++++++ Remove Right");
      $("#PlayerRight").find(".otherCards").first().remove();
      break;
    case "acrossPlay":
      console.log("othersPlayed++++++++++++ Remove Across");
      $("#PlayerAcross").find(".otherCards").first().remove();
      break;
    case "leftPlay":
      console.log("othersPlayed++++++++++++ Remove Left");
      $("#PosLeft").find(".otherCards").first().remove();
      break;
  }

  $("#" + card + "_img").attr("class", "myCards").clone().show().appendTo(area);
}
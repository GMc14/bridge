function Card(suit, rank) {
  this.suit = suit;
  this.rank = rank;
}

function startGame() {
  if (playerNum == dealer) {
    console.log("--------------startGame-------I'm the dealer---------"+playerNum+" == "+dealer);
    $("#myHand").empty();
    $(".otherPlayerHand").empty();
    createDeck();
    shuffle();
    dealCards();
  } else {
    console.log("--------------startGame-------not the dealer---------"+playerNum+" == "+dealer);
  }
}

function createDeck() {
  deck = [];
  for (var i = 0; i < suits.length; i++) {
    for (var j = 0; j < ranks.length; j++) {
      deck.push(new Card(suits[i], ranks[j]));
    }
  }
  for (var i = 0; i < bonusCards.length; i++) {
    deck.push(new Card(bonusCards[i].charAt(0), bonusCards[i].charAt(1)));
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
  card.setAttribute("class", "trumpCard otherCards");
  card.setAttribute("id", 'trump' + cardID);
  $("#" + cardID + "_img").clone().show().appendTo(card);
  card.addEventListener("click", playCard, true);
  document.getElementById("showCase").appendChild(card);
}

function displayCards() {
  for (var j = 0; j < gameConfig_playerCount; j++) {
    displayOtherCards(j);
  }
  $("#myHand").empty();
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
  $('#loc'+playerIndex+'Hand').empty();
  for (var i = 0; i < gameConfig_startCardsPerPlayer; i++) {
    var card = document.createElement("div");
    card.setAttribute("class", "otherCards");
    $(".cardback:eq(0)").clone().show().appendTo(card);
    $('#loc'+playerIndex+'Hand').appendChild(card);
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

  console.log("othersPlayed++++++++++++ play: "+play+" card:"+card);

  var area = document.getElementById(play);
  $("#loc"+playerIndex+"Hand").find(".otherCards").first().remove();
  $("#" + card + "_img").attr("class", "myCards").clone().show().appendTo(area);
}
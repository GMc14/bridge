//Variables
var deck = [];
var ranks = new Array(2,3,4,5,6,7,8,9,10,11,12,13,14);
var suits = new Array("C", "D", "H", "S");
var cardback = "card_imgs/cardback.png";

var Hand1 = [], Hand2 = [], Hand3 = [], Hand4 = [];
var Hand1Value = 0, Hand2Value = 0, Hand3Value = 0, Hand4Value=0;

var Player1 =[], Player2 = [], Player3 = [], Player4 = [];

function Card(suit,rank) {
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
    for (var i=0; i<$("#gameBoard .otherPlayers").length; i++) {
      while (otherHands[i].firstChild) {
        otherHands[i].removeChild(otherHands[i].firstChild);
      }
    }
    createDeck();
    shuffle();
    dealCards();
  }
}
//Functions
function createDeck(){
    deck = [];
    for (var i = 0; i < suits.length; i++) {
      for (var j = 0; j < ranks.length; j++) {
        deck.push(new Card(suits[i], ranks[j]));
      }
    }
  }

function shuffle() {
    var m = deck.length, t, i, shuffled = deck;
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
  Hand1 = []; Hand2 = []; Hand3 = []; Hand4 = [];

  while(deck.length>0) {
    Hand1Value += cardValue(deck[deck.length-1]);
    Hand1.push(deck.pop());

    Hand2Value += cardValue(deck[deck.length-1]);
    Hand2.push(deck.pop());

    Hand3Value += cardValue(deck[deck.length-1]);
    Hand3.push(deck.pop());

    Hand4Value += cardValue(deck[deck.length-1]);
    Hand4.push(deck.pop());
  }

  if ((Hand1Value < 4)||(Hand2Value < 4)||(Hand3Value < 4)||(Hand4Value < 4)) {
    shuffle();
    dealCards();
  }
  else {
  socketio.emit('dealCards', {Hand1:Hand1,Hand2:Hand2, Hand3:Hand3, Hand4:Hand4, roomID:roomID});
}
}

function cardValue(card) {
  var value = Number(card.rank)<10 ? 0 : Number(card.rank)-10;
  return value;
}

function sortHand() {
    Player1.sort(function (a,b) {
      var aSuit = a.suit;
      var bSuit = b.suit;
      var aRank = a.rank;
      var bRank = b.rank;

      if (aSuit==bSuit) {
        return (aRank<bRank) ? -1: (aRank>bRank) ? 1:0;
      }
      else {return aSuit<bSuit ? -1:1;}
    });
}

function displayCards() {
  //Other people's cards
  displayOtherCards(Player2);
  displayOtherCards(Player3);
  displayOtherCards(Player4);

  //Display My Cards
  var hand = document.getElementById("myPlayer");
  while (hand.firstChild) {
    hand.removeChild(hand.firstChild);
  }
  for (var i=0; i<Player1.length; i++) {
    var cardRank = String(Player1[i].rank);
    var cardSuit = String(Player1[i].suit);
    var cardID = cardSuit+cardRank;
    var card = document.createElement("div");
    var encodedI = i+10;
    card.setAttribute("class","myCards");
    card.setAttribute("id", encodedI+cardID);
    $("#"+cardID+"_img").clone().show().appendTo(card);
    card.addEventListener("click",playCard,true);
    hand.appendChild(card);
  }
  reset_dimensions();
}

function displayOtherCards(player) {
  var hand;
  if (player==Player2) {
    hand = document.getElementById("PlayerRight");
  }
  else if (player==Player3) {
    hand = document.getElementById("PlayerAcross");
  }
  if (player==Player4) {
    hand = document.getElementById("PlayerLeft");
  }
  while (hand.firstChild) {
    hand.removeChild(hand.firstChild);
  }
  for (var i=0; i<player.length; i++) {
    var card = document.createElement("div");
    card.setAttribute("class","otherCards");
    $(".cardback:eq(0)").clone().show().appendTo(card);
    hand.appendChild(card);
  }
}

function playCard() {
  if (currentPlayer==playerNum) {
    if (playerNum == lead) {
      $(".plays").empty();
    }
    var num = $(this).attr('id').substr(0,2);
    var cardID = $(this).attr('id').substr(2);
    var legal = true;
    if (playerNum != lead) {
      legal = checkLegal(cardID);
    }
    if (legal) {
      Player1[Number(num)-10].suit = "Z";
      card = document.getElementById(num+cardID);
      cardsub = card;
      card.parentNode.removeChild(card);
      myPlay = document.getElementById("myPlay");
      myPlay.appendChild(cardsub);
      socketio.emit('playCard', {roomID:roomID, card:cardID});
    }
  }
}

function othersPlayed(play,card) {
    var area = document.getElementById(play);
    switch (play) {
      case "rightPlay":
          $("#PlayerRight").find(".otherCards").first().remove();
          break;
      case "acrossPlay":
          $("#PlayerAcross").find(".otherCards").first().remove();
          break;
      case "leftPlay":
          $("#PlayerLeft").find(".otherCards").first().remove();
          break;
    }

    $("#"+card+"_img").attr("class","myCards").clone().show().appendTo(area);
}

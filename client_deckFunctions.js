function Card(suit, rank) {
  this.suit = suit;
  this.rank = rank;
}

var currentTrumpCards = [];
function startGame() {
  
  $("#myHand").show();
  console.log("--------------startGame-------isGameMaster?--------" + isGameMaster);
  if(isGameMaster){
    $("#gameControls").show();
    $("#tokenLegend").hide();
  }
  if (playerNum == dealer) {
    console.log("--------------startGame-------I'm the dealer---------" + playerNum + " == " + dealer);
    $("#myHand").empty();
    $(".otherPlayerHand").empty();
    createDeck();
    deck = getShuffled(deck);
    dealCards();
  } else {
    console.log("--------------startGame-------not the dealer---------" + playerNum + " == " + dealer);
  }

  console.log("[][][][][][][][][][]ClearTrumpHighlights[][][][][][][][][][][]");
  currentTrumpCards=[];
  $(".isTrump").removeClass("isTrump");
}

function preRenderImgs() {
  console.log("preRenderImgs-#0000");
  var img_src = "/card_imgs/cardback.png";
  var cardImg = document.createElement("img");
  cardImg.setAttribute("src", img_src);
  cardImg.setAttribute("class", "cardback");
  $("body").append(cardImg);

  for (var i = 0; i < suits.length; i++) {
    for (var j = 0; j < ranks.length; j++) {
      var cardID = suits[i] + ranks[j];
      console.log("===" + cardID);
      var img_src = "/card_imgs/" + cardID + ".png";
      var cardImg = document.createElement("img");
      cardImg.setAttribute("src", img_src);
      cardImg.setAttribute("id", cardID + "_img");
      $("body").append(cardImg);
    }
  }
  for (var i = 0; i < bonusCards.length; i++) {
    var cardID = bonusCards[i].charAt(0) + bonusCards[i].charAt(1);
    console.log("===" + cardID);
    var img_src = "/card_imgs/" + cardID + ".png";
    var cardImg = document.createElement("img");
    cardImg.setAttribute("src", img_src);
    cardImg.setAttribute("id", cardID + "_img");
    $("body").append(cardImg);
  }
  console.log("preRenderImgs-#1000");
}

function createDeck() {
  deck = [];
  taskDeck = [];
  for (var i = 0; i < suits.length; i++) {
    for (var j = 0; j < ranks.length; j++) {
      if (gameConfid_isCrew) {
        taskDeck.push(new Card(suits[i], ranks[j]));
      }
      deck.push(new Card(suits[i], ranks[j]));
    }
  }
  for (var i = 0; i < bonusCards.length; i++) {
    deck.push(new Card(bonusCards[i].charAt(0), bonusCards[i].charAt(1)));
  }
}

function getShuffled(inputDeck) {
  var m = inputDeck.length,
    t, i, shuffled = inputDeck;
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
  return shuffled;
}

function dealCards() {
  //TODO: vary by player count and cards dealt per player
  var hands = [];
  var handValues = [];
  var deckSize = deck.length;

  for (var i = 0; i < gameConfig_playerCount; i++) {
    hands[i] = [];
    handValues[i] = 0;
    var cardsToDeal = gameConfig_startCardsPerPlayer;
    if (cardsToDeal == -1) {
      cardsToDeal = Math.floor(deckSize / gameConfig_playerCount);
      if ((deckSize % gameConfig_playerCount) > i) {
        cardsToDeal += 1;
      }
    }
    console.log("DealCards -------deckSize:" + deckSize + "   cardsToDeal:" + cardsToDeal + "   deck.length:" + deck.length + "   i:" + i);
    for (var j = 0; j < cardsToDeal; j++) {
      handValues[i] += cardValue(deck[deck.length - 1]);
      hands[i].push(deck.pop());
    }

  }

  if (gameConfig_isBridge) {
    for (var i = 0; i < gameConfig_playerCount; i++) {
      if (handValues[i] < 4) {
        //needToRedeal
        console.log(":( ------------------ needToRedeal");

        deck = getShuffled(deck);
        dealCards();
        return;
      }
    }
  }
  var trumpCard = '';
  if (gameConfig_topDeckTrump) {
    if (deck.length > 0) {
      trumpCard = deck.pop();
    } else {
      alert("Empty Deck: no trump");
    }
  }
  socketio.emit('dealCards', {
    hands: hands,
    roomID: roomID,
    trumpCard: trumpCard
  });
  console.log("Finished dealing");
}

function cardValue(card) {
  var value = Number(card.rank) < 10 ? 0 : Number(card.rank) - 10;
  return value;
}

function sortHand() {
  myHandOfCards.sort(function (a, b) {
    var aSuit = a.suit.replace("S","E");
    var bSuit = b.suit.replace("S","E"); //Move spades between D-iamonds and H-earts
    var aRank = a.rank;
    var bRank = b.rank;
    if (aSuit == bSuit) {
      return (aRank < bRank) ? -1 : (aRank > bRank) ? 1 : 0;
    } else {
      return aSuit < bSuit ? -1 : 1;
    }
  });
}

function setTrumpCardOrderIcon(cardID, icon) {
  $("#token" + cardID).find("img").attr("src", "/token_imgs/" + icon + ".png");
}

function setTrumpCardAssignee(cardID, player) {
  console.log(">>>>>>>>>>>>> setTrumpCardAssignee " + cardID + "  :  " + player);
  $.each(playerOptions,function(){
    $("#assignment" + cardID).removeClass(this);
  });
  $("#assignment" + cardID).text(player);
  $("#assignment" + cardID).addClass(player);
}

var tokenOptions = ['x', '1', '2', '3', '4', '5', 'i', 'ii', 'iii', 'iiii', 'O', '0'];
//TODO: allow selecting specific cards
var playerOptions = ['', 'GM', 'AM', 'EM',"AP"];

function displayTrumpCard(trumpCard) {
  var cardRank = String(trumpCard.rank);
  var cardSuit = String(trumpCard.suit);
  var cardID = cardSuit + cardRank;
  currentTrumpCards.push(cardID);

  var card = document.createElement("div");
  card.setAttribute("class", "trumpCard otherCards");
  card.setAttribute("id", 'trump' + cardID);
  var cardObj = $("#" + cardID + "_img").clone().show();
  $(cardObj).addClass('isTrump');
  $(cardObj).appendTo(card);

  $("#" + cardID + "_img").addClass('isTrump');
  //card.addEventListener("click", playCard, true);
  $("#showCase").show();
  $("#showCase").append(card);
  $(card).append("<div id='token" + cardID + "' class='token'><img  src=''/></div>");
  $(card).append("<span id='assignment" + cardID + "' class='assignments'></span>");

  if (isGameMaster) {
    $(card).append("<select class='trumpDrops icnDrop' id='drpIcon" + cardID + "' name='dropdownIcon' size=1>");
    $(card).append("<select class='trumpDrops plyrDrop' id='drpPlyr" + cardID + "' name='dropdownIcon' size=1>");
    $.each(tokenOptions, function () {
      $("#drpIcon" + cardID).append('<option value="' + this + '">' + this + '</option>');
    });
    $.each(playerOptions, function () {
      $("#drpPlyr" + cardID).append('<option value="' + this + '">' + this + '</option>');
    });
    $("#drpIcon" + cardID).change(function () {

      console.log(">>>>>>>>>>>>> cycleOrderIcon selected ---------------- cardID:" + cardID + ";;" + $(this).val());
      socketio.emit('cycleOrderIcon', {
        cardID: cardID,
        roomID: roomID,
        icon: $(this).val()
      });
    });
    $("#drpPlyr" + cardID).change(function () {

      console.log(">>>>>>>>>>>>>cycleAssignee selected ---------------- cardID:" + cardID + ";;" + $(this).val());
      socketio.emit('cycleAssignee', {
        cardID: cardID,
        roomID: roomID,
        player: $(this).val()
      });
    });
  }
}

function displayCards() {
  currentTrumpCards = [];
  console.log(">>>>>>>>>>>>>displayCards----------------");
  for (var j = 1; j < gameConfig_playerCount; j++) {
    displayOtherCards(j, handSizes[j - 1]);
  }
  $("#myHand").empty();
  for (var i = 0; i < myHandOfCards.length; i++) {
    var cardRank = String(myHandOfCards[i].rank);
    var cardSuit = String(myHandOfCards[i].suit);
    var cardID = cardSuit + cardRank;
    var card = document.createElement("div");
    var encodedI = i + 10;
    card.setAttribute("class", "myCards");
    card.setAttribute("id", encodedI + cardID);
    $("#" + cardID + "_img").clone().show().appendTo(card);
    card.addEventListener("click", playCard, true);
    $("#myHand").append(card);
  }
  console.log("--------------displayCards>>>>>>>>>>>>>");
}
function highlightPlayable() {
  for (var i = 0; i < myHandOfCards.length; i++) {
      if (String(myHandOfCards[i].suit) == leadSuit) {
          var cardRank = String(myHandOfCards[i].rank);
          var cardSuit = String(myHandOfCards[i].suit);
          var cardID = cardSuit + cardRank;
          var encodedI = i + 10;
          // card.setAttribute("id", encodedI + cardID);
          $("#" + encodedI + cardID).addClass("highlighted");
      }
  }
}
function displayOtherCards(playerIndex, handSize) {
  console.log(">>>>>>>>>>>>>displayCards----in: #loc" + playerIndex + "Hand------------playerIndex: " + playerIndex + "  >>  handSize: " + handSize);
  $('#loc' + playerIndex + 'Hand').empty();
  for (var i = 0; i < handSize; i++) {
    var card = document.createElement("div");
    card.setAttribute("class", "otherCards");
    $(".cardback:eq(0)").clone().show().appendTo(card);
    $('#loc' + playerIndex + 'Hand').append(card);
  }
}

function playCard() {
  console.log("--------------playCard >>>>>>>>>>>>>" + currentPlayer + " =? " + playerNum);
  if (currentPlayer == playerNum) {
    if (playerNum == lead) {
      $(".plays").empty();
    }
    var num = $(this).attr('id').substr(0, 2);
    var cardID = $(this).attr('id').substr(2);

    console.log("--------------playCard! " + num + " : " + cardID);

    var legal = true;
    if (playerNum != lead) {
      legal = confirmLegal(cardID);
    }
    if (legal) {
      myHandOfCards[Number(num) - 10].suit = "Z";
      card = document.getElementById(num + cardID);
      cardsub = card;
      card.parentNode.removeChild(card);
      $("#myPlay").append(cardsub);
      socketio.emit('playCard', {
        roomID: roomID,
        card: cardID
      });
    }
  }
}

function isATrumpCard(card) {
  console.log("^^^^^^^^^^^^ isATrumpCard: " + card + " in:" + JSON.stringify(currentTrumpCards) + "  found at: " + jQuery.inArray(card, currentTrumpCards) + " includes?:" + currentTrumpCards.includes(card));
  return currentTrumpCards.includes(card);
}

function othersPlayed(player, card) {
  console.log("othersPlayed++++++++++++ player: " + player + " card:" + card);

  var playerIndex = inversePlayerIdMap[player];
  console.log("othersPlayed++++++++++++ playerIndex:" + playerIndex);

  $("#loc" + playerIndex + "Hand").find(".otherCards").first().remove();

  var cardObj = $("#" + card + "_img").attr("class", "myCards").clone().show();

  if (isATrumpCard(card)) {
    $(cardObj).addClass('isTrump');
  }
  $("#loc" + playerIndex + "play").append(cardObj);
}
function Card(suit, rank) {
  this.suit = suit;
  this.rank = rank;
}

var currentTrumpCards = [];
var tokenOptions = ['x', '1', '2', '3', '4', '5', 'i', 'ii', 'iii', 'iiii', 'O', '0'];
var playerOptions = ['', 'GM', 'AM', 'EM', "AP"];

function startGame() {
  console.log("--------------startGame-------isGameMaster?--------" + isGameMaster);
  $("#myHand").show();
  $("#myHand").empty();
  $(".otherPlayerHand").empty();
  $("#helpLegendTrigger").toggle(gameType == GameType.CREW);

  if (isGameMaster) {
    $("#gameControls").show();
    $("#restartGame").show();
    $("#drawTask").toggle(gameConfig_hasTasks);
    $("#chooseTask").toggle(gameConfig_hasTasks);
    $("#hideTasks").toggle(gameConfig_hasTasks);
    $("#myCommunication").toggle(gameType == GameType.CREW);

    $(".plyrDropName").show();

    createDeck();
    deck = getShuffled(deck);
    dealCards();
  }
  if (playerNum == dealer) {
    console.log("--------------startGame-------I'm the dealer---------" + playerNum + " == " + dealer);


  } else {
    console.log("--------------startGame-------not the dealer---------" + playerNum + " == " + dealer);
  }

  console.log("[][][][][][][][][][]ClearTrumpHighlights[][][][][][][][][][][]");
  currentTrumpCards = [];
  $(".isTrump").removeClass("isTrump");
}

function preRenderImgs() {
  console.log("preRenderImgs-#0000");
  var img_src = cardback;
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

function createDeck(taskOnly = false) {
  deck = [];
  taskDeck = [];
  for (var i = 0; i < suits.length; i++) {
    for (var j = 0; j < ranks.length; j++) {
      if (gameType == GameType.CREW) {
        taskDeck.push(new Card(suits[i], ranks[j]));
      }
      if (!taskOnly) {
        deck.push(new Card(suits[i], ranks[j]));
      }
    }
  }
  if (!taskOnly) {
    for (var i = 0; i < bonusCards.length; i++) {
      deck.push(new Card(bonusCards[i].charAt(0), bonusCards[i].charAt(1)));
    }
  }
}

function getSorted(inputDeck) {
  inputDeck.sort(function (a, b) {
    var aSuit = a.suit.replace("S", "E");
    var bSuit = b.suit.replace("S", "E"); //Move spades between D-iamonds and H-earts
    var aRank = a.rank;
    var bRank = b.rank;
    if (aSuit == bSuit) {
      return (aRank < bRank) ? -1 : (aRank > bRank) ? 1 : 0;
    } else {
      return aSuit < bSuit ? -1 : 1;
    }
  });
  return inputDeck;
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

  if (gameType == GameType.BRIDGE) {
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

function getEuchreCardValue(card) {
  if (trumpSuit) {
    //only after trump is determined
    if (card.rank == 11) {
      //only jacks
      if (suitColors[card.suit] == suitColors[trumpSuit]) {
        //only same color
        if (card.suit == trumpSuit) {
          //right bower higher
          card.rank += 1;
        }
        card.rank += 4;
        card.suit = trumpSuit;
      }
    }
  }
  return card;
}

function sortHand() {
  myHandOfCards.sort(function (aRef, bRef) {
    var a = aRef;
    var b = bRef;
    if (gameConfig_euchreBowers) {
      a = getEuchreCardValue(a);
      b = getEuchreCardValue(b);
    }
    var aRank = a.rank;
    var bRank = b.rank;
    var aSuit = a.suit.replace("S", "E");
    var bSuit = b.suit.replace("S", "E");
    //Move spades between D-iamonds and H-earts
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
  $.each(playerOptions, function (index, value) {
    $("#assignment" + cardID).removeClass(value);
  });
  $("#assignment" + cardID).text(player);
  $("#assignment" + cardID).addClass(player);
}

function setPlayerShortName(forPlayerNumber, shortName) {
  var _idSelector = "#loc" + inversePlayerIdMap['Player' + forPlayerNumber] + "name";
  var tempPlayerNum = playerNum.replace('Player', '');
  console.log("Is it me? " + forPlayerNumber + "  vs. " + tempPlayerNum);
  if (forPlayerNumber == tempPlayerNum) {
    console.log("That's Me");
    _idSelector = "#myName";
  }
  $.each(playerOptions, function (index, value) {
    $(_idSelector).removeClass(value);
  });
  $(_idSelector).addClass(shortName);
}

function displayTrumpCard(trumpCard) {
  var cardRank = String(trumpCard.rank);
  var cardSuit = String(trumpCard.suit);
  var cardID = cardSuit + cardRank;
  currentTrumpCards.push(cardID);

  var card = $("<div id='trump" + cardID+"' class='trumpCard otherCards'></div>");
  var cardObj = $("#" + cardID + "_img").clone().show();
  $(cardObj).addClass('isTrump');
  $(card).append(cardObj);
  $("#" + cardID + "_img").addClass('isTrump');

  $("#showCase").show();
  $("#showCase").append(card);
  $(card).append("<div id='token" + cardID + "' class='token'><img  src=''/></div>");
  $(card).append("<span id='assignment" + cardID + "' class='assignments'></span>");

  if (isGameMaster && (gameType == GameType.CREW)) {
    $(card).append("<select class='trumpDrops icnDrop' id='drpIcon" + cardID + "' name='dropdownIcon' size=1>");
    $(card).append("<i class='material-icons trumpDrops doneBut' id='doneIcon" + cardID + "'>done</i>");
    $(card).append("<select class='trumpDrops plyrDrop' id='drpPlyr" + cardID + "' name='dropdownIcon' size=1>");
    $.each(tokenOptions, function () {
      $("#drpIcon" + cardID).append('<option value="' + this + '">' + this + '</option>');
    });
    $.each(playerOptions, function () {
      $("#drpPlyr" + cardID).append('<option value="' + this + '">' + this + '</option>');
    });
    $("#doneIcon" + cardID).click(function () {
      console.log(">>>>>>>>>>>>> doneIcon selected ---------------- cardID:" + cardID + ";;");
      socketio.emit('cycleOrderIcon', {
        cardID: cardID,
        roomID: roomID,
        icon: '0'
      });
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
  sortHand();
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
  console.log("highlightPlayable");
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

function displayOtherCards(seatIndex, handSize) {
  console.log(">>>>>>>>>>>>>displayCards----in: #loc" + seatIndex + "Hand------------seatIndex: " + seatIndex + "  >>  handSize: " + handSize);
  $('#loc' + seatIndex + 'Hand').empty();
  for (var i = 0; i < handSize; i++) {
    var card = document.createElement("div");
    card.setAttribute("class", "otherCards");
    $(".cardback:eq(0)").clone().show().appendTo(card);
    $('#loc' + seatIndex + 'Hand').append(card);
  }
  var counterR=0;
  $('#loc' + seatIndex + 'Hand').children().each(function(){
    rotate($(this),(counterR - (handSize/2))*(50/handSize));
  });
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
        card: cardID,
        player: currentPlayer
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

  var seatIndex = inversePlayerIdMap[player];
  console.log("othersPlayed++++++++++++ seatIndex:" + seatIndex);

  $("#loc" + seatIndex + "Hand").find(".otherCards").first().remove();

  var cardObj = $("#" + card + "_img").attr("class", "myCards").clone().show();

  if (isATrumpCard(card)) {
    $(cardObj).addClass('isTrump');
  }
  $("#loc" + seatIndex + "play").append(cardObj);
}
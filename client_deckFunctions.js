function Card(suit, rank) {
  this.suit = suit;
  this.rank = rank;
}

var currentTrumpCards = [];
var tokenOptions = ['x', '1', '2', '3', '4', '5', 'i', 'ii', 'iii', 'iiii', 'O', '0'];
var playerOptions = ['', 'GM', 'AM', 'EM', "AP", "AB", "MJ"];

function startGame() {
  console.log("--------------startGame-------isGameMaster?--------" + isGameMaster);
  $("#myHand").show();
  $("#myHand").empty();
  $("#alternativeActions").show();
  $(".otherPlayerHand").empty();
  $("#helpLegendTrigger").toggle(gameType == GameType.CREW);
  $("#settingsTrigger").show();

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
  updateActionStates();
}

function preRenderImgs() {
  console.log("preRenderImgs-#0000");
  var cardImg = $("<img src='"+cardback+"' class='cardback'>");
  $("body").append(cardImg);
  for (var i = 0; i < suits.length; i++) {
    for (var j = 0; j < ranks.length; j++) {
      var cardID = suits[i] + ranks[j];
      console.log("===" + cardID);
      var img_src = "/card_imgs/" + cardID + ".png";
      $("body").append($("<img src='"+img_src+"' id='"+cardID+"_img'>"));
    }
  }
  for (var i = 0; i < bonusCards.length; i++) {
    var cardID = bonusCards[i].charAt(0) + bonusCards[i].charAt(1);
    console.log("===" + cardID);
    var img_src = "/card_imgs/" + cardID + ".png";
    $("body").append($("<img src='"+img_src+"' id='"+cardID+"_img'>"));
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
        i = 999;
        return;
      }
    }
  }
  var trumpCard = '';
  if (gameConfig_topDeckTrump) {
    if (deck.length > 0) {
      trumpCard = deck.pop();
      console.log("gameConfig_topDeckTrump card: "+trumpCard);
    } else {
      alert("Empty Deck: no trump");
    }
  } else {
    console.log("gameConfig_topDeckTrump: "+gameConfig_topDeckTrump+"?????????????");
  }

  

  const data = {
    hands: hands,
    trumpCard: trumpCard
  };
  console.log("dealCards: "+JSON.stringify(data));
  socketio.emit('dealCards', data);
  console.log("Finished dealing");
}

function cardValue(card) {
  var value = Number(card.rank) < 10 ? 0 : Number(card.rank) - 10;
  return value;
}

function getEuchreCardValue(card) {
  if(!gameConfig_euchreBowers){
    return card;
  }
  var rank = card.rank;
  var suit = card.suit;
  if (trumpSuit) {
    //only after trump is determined
    if (rank == 11) {
      //only jacks
      if (suitColors[suit] == suitColors[trumpSuit]) {
        //only same color
        if (suit == trumpSuit) {
          //right bower higher
          rank += 1;
        }
        rank += 4;
        suit = trumpSuit;
      }
    }
  }
  return {rank:rank, suit:suit};
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
  currentTrumpCards.push(trumpCard);
  var cardID = getCardID(trumpCard);
  var card = $("<div id='trump" + cardID + "' class='trumpCard otherCards'></div>");
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
      console.log(">>>>>>>>>>>>> doneIcon selected ---------------- card:" + cardID + ";;");
      socketio.emit('cycleOrderIcon', {
        card: trumpCard,
        icon: '0'
      });
    });
    $("#drpIcon" + cardID).change(function () {
      console.log(">>>>>>>>>>>>> cycleOrderIcon selected ---------------- card:" + cardID + ";;" + $(this).val());
      socketio.emit('cycleOrderIcon', {
        card: trumpCard,
        icon: $(this).val()
      });
    });
    $("#drpPlyr" + cardID).change(function () {
      console.log(">>>>>>>>>>>>>cycleAssignee selected ---------------- card:" + cardID + ";;" + $(this).val());
      socketio.emit('cycleAssignee', {
        card: trumpCard,
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
    var cardID = getCardID(myHandOfCards[i]);
    var encodedI = i + 10;
    var cardDiv = $("<div class='myCards' id='"+ (encodedI + cardID)+"'></div>");
    $(cardDiv).append($("#" + cardID + "_img").clone().show())
    $(cardDiv).click(playCard);
    $("#myHand").append(cardDiv);
  }
  console.log("--------------displayCards>>>>>>>>>>>>>");
}

function highlightPlayable() {
  console.log("highlightPlayable");
  for (var i = 0; i < myHandOfCards.length; i++) {
    if (String(myHandOfCards[i].suit) == leadSuit) {
      var cardID = getCardID(myHandOfCards[i]);
      var encodedI = i + 10;
      $("#" + encodedI + cardID).addClass("highlighted");
    }
  }
}

function clearComms() {
  $(".onlyOption").removeClass("onlyOption");
  $(".highestOption").removeClass("highestOption");
  $(".lowestOption").removeClass("lowestOption");
}

function highlightCommunicatable() {
  console.log("highlightCommunicatable");

  var highest = [];
  var lowest = [];

  for (var i = 0; i < myHandOfCards.length; i++) {
    const card = myHandOfCards[i];
    var cardID = getCardID(card);
    if (!highest[card.suit] || highest[card.suit] < card.rank) {
      highest[card.suit] = card.rank;
    }
    if (!lowest[card.suit] || lowest[card.suit] > card.rank) {
      lowest[card.suit] = card.rank;
    }
    var encodedI = i + 10;
    $("#" + encodedI + cardID).addClass("highlighted");
  }
  for (var i = 0; i < myHandOfCards.length; i++) {
    const card = myHandOfCards[i];
    var cardID = getCardID(card);
    var encodedI = i + 10;
    if (highest[card.suit] && highest[card.suit] == card.rank && lowest[card.suit] && lowest[card.suit] == card.rank) {
      $("#" + encodedI + cardID).addClass("onlyOption");
    } else if (highest[card.suit] && highest[card.suit] == card.rank) {
      $("#" + encodedI + cardID).addClass("highestOption");
    } else if (lowest[card.suit] && lowest[card.suit] == card.rank) {
      $("#" + encodedI + cardID).addClass("lowestOption");
    }
  }
}

function updateCardRotations(seatIndex) {
  console.log("updateCardRotations");
  var counterR = 1;
  let handSize = $('#loc' + seatIndex + 'Hand').children().length;
  $('#loc' + seatIndex + 'Hand').children().each(function () {
    let halfHand = (handSize / 2);
    var relativePosition = Math.floor(counterR - halfHand);
    //console.log("updateCardRotations card "+counterR+" / "+handSize +"    relativePosition: "+relativePosition);
    if (counterR * 2 > handSize && handSize % 2 == 0) {
      relativePosition--;
    }
    //console.log("updateCardRotations card "+counterR+" / "+handSize +"    Adjusted relativePosition: "+relativePosition);
    
    let angle = 40 * relativePosition / handSize;
    let relativeHeight = (relativePosition * relativePosition) / (halfHand * halfHand);
    rotate($(this), angle, (relativeHeight * 15) - 25);
    counterR++;
  });
}

function displayOtherCards(seatIndex, handSize) {
  console.log(">>>>>>>>>>>>>displayCards----in: #loc" + seatIndex + "Hand---- >>  handSize: " + handSize);
  $('#loc' + seatIndex + 'Hand').empty();
  for (var i = 0; i < handSize; i++) {
    var cardDiv = $("<div class='otherCards'></div>");
    $(cardDiv).append($(".cardback:eq(0)").clone().show());
    $('#loc' + seatIndex + 'Hand').append(cardDiv);
  }
  updateCardRotations(seatIndex);
}

function playCard() {
  console.log("--------------playCard >>>>>>>>>>>>>" + currentPlayer + " =? " + playerNum +"   "+JSON.stringify(this));
  if (currentPlayer == playerNum) {
    if (playerNum == lead) {
      $(".plays").empty();
    }
    var num = $(this).attr('id').substr(0, 2);
    var cardID = $(this).attr('id').substr(2);
    var card = getCardFromID(cardID);
    console.log("--------------playCard! " + num + " : " + JSON.stringify(card));
    var legal = true;
    if (playerNum != lead) {
      legal = confirmLegal(card);
    }
    if (legal) {
      myHandOfCards[Number(num) - 10].suit = "Z";

      let cardDiv = $(this).detach();
      $("#myPlay").append(cardDiv);

      socketio.emit('playCard', {
        card: card,
        player: currentPlayer
      });
    }
  }
}

function isATrumpCard(card) {
  const isATrumpCard = currentTrumpCards.some(trumpCard => trumpCard.rank == card.rank && trumpCard.suit == card.suit);
  console.log("^^^^^^^^^^^^ isATrumpCard: " + JSON.stringify(card) + " in:" + JSON.stringify(currentTrumpCards) + " includes?:" + isATrumpCard);

  return isATrumpCard;
}

function othersPlayed(player, card) {
  console.log("othersPlayed++++++++++++ player: " + player + " card:" + JSON.stringify(card));

  var seatIndex = inversePlayerIdMap[player];
  console.log("othersPlayed++++++++++++ seatIndex:" + seatIndex);

  $("#loc" + seatIndex + "Hand").find(".otherCards").first().remove();

  var cardObj = $("#" + getCardID(card) + "_img").attr("class", "myCards").clone().show();


  if (isATrumpCard(card)) {
    console.log("othersPlayed++++++++++++ NOT A TRUMP");
    $(cardObj).addClass('isTrump');
  } else {
    console.log("othersPlayed++++++++++++ NOT A TRUMP");
  }
  $("#loc" + seatIndex + "play").append(cardObj);
  updateCardRotations(seatIndex);
}
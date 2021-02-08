const lastModifiedString3 = ("Last modified: 2021/02/08 21:11:56");
const deckTS = lastModifiedString3.replace("Last ", "").replace("modified: ", "");
console.log("client_deckFunction.js " + lastModifiedString3);

function Card(suit, rank) {
  this.suit = suit;
  this.rank = rank;
}

var currentTrumpCards = [];
var tokenOptions = ['x', '1', '2', '3', '4', '5', 'i', 'ii', 'iii', 'iiii', 'O', '0'];
var playerOptions = ['', 'GM', 'AM', 'EM', "AP", "AB", "MJ", "SJ"];

function initialStartGame(data) {
  console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ initialStartGame");
  console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ initialStartGame");
  console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ initialStartGame");
  console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ initialStartGame");
  console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ initialStartGame");
  console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ initialStartGame");
  console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ initialStartGame");
  console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ initialStartGame");
  console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$$ initialStartGame");
  setGameType(data.gameType);
  gameConfig_playerCount = data.playerCount;
  cardback = $(".cardBackOption.ui-selected").prop("src");
  preRenderImgs(data.gameType);
  if (gameConfig_chooseSeats) {
    constructSeatedPlayArea();
  } else {
    constructUnseatedPlayArea();
  }
  startGame();
}

function startGame() {
  console.log("--------------startGame-------isGameMaster?--------" + isGameMaster);
  $("#myHand").show();
  $("#myHand").empty();
  $('#gameRecap').hide();
  $('.stuff').empty();
  $('.plays').empty();
  $("#playArea").show();
  $("#playerSetup").hide();
  $("#startGameButton").hide();
  $("#alternativeActions").show();
  $(".otherPlayerHand").empty();
  $("#helpLegendTrigger").toggle(gameType == GameType.CREW);
  $("#settingsTrigger").show();
  $("#missionNumberText").html("<b>Mission #: </b>" + $("#missionNumberInput").val());
  $("#handNumberText").html("<b>Attempt #: </b>" + $("#handNumberInput").val());

  if (isGameMaster) {
    $("#gameControls").show();
    $("#restartGameButton").show();
    $("#revealCards").show();
    $("#drawTask").toggle(gameConfig_hasTasks);
    $("#chooseTask").toggle(gameConfig_hasTasks);
    $("#hideTasks").toggle(gameConfig_hasTasks);
    $("#myCommunication").toggle(gameType == GameType.CREW);
    $('#handNumberInput').val(function (i, oldval) {
      return ++oldval;
    });
    $(".plyrDropName").show();
    $(".isTrump").removeClass("isTrump");
    createDeck();
    deck = getShuffled(deck);
    dealCards();
  }

  console.log("[][][][][][][][][][] IS DEALER? " + (client_playerNumString == dealer) + "[][][][][][][][][][][]");
  $('#bidOfRoundText').hide();
  $('.winCount').text(0);
  $('td').css('background-color', 'transparent');

  tricksWon = 0;
  currentTrumpCards = [];
  $(".isTrump").removeClass("isTrump");
  updateActionStates();
}

function preRenderImgs(gameType) {
  console.log("preRenderImgs-#0000");
  var cardImg = $("<img src='" + cardback + "' class='cardback'>");
  $("body").append(cardImg);
  // if (gameType == GameType.DIXIT) {
  //   for (var i = 1; i <= ranks.length; i++) {
  //     var cardID = "heartstoners" + i;

  //     $("body").append($("<img src='/card_imgs/" + cardID + ".png' id='" + cardID + "_img'>"));
  //   }
  // } else {
  for (var i = 0; i < suits.length; i++) {
    for (var j = 0; j < ranks.length; j++) {
      var cardID = suits[i] + ranks[j];
      console.log("===" + cardID);
      var img_src = "/card_imgs/" + cardID + ".png";
      $("body").append($("<img src='" + img_src + "' id='" + cardID + "_img'>"));
    }
  }
  for (var i = 0; i < bonusCards.length; i++) {
    $("body").append($("<img src='/card_imgs/" + bonusCards[i] + ".png' id='" + bonusCards[i] + "_img'>"));
  }

  $("body").append($("<img src='/card_imgs/V0.png' id='V0_img'>"));
  $("body").append($("<img src='/card_imgs/W0.png' id='W0_img'>"));
  console.log("preRenderImgs-#1000");
  // }
}

function createDeck(taskOnly = false) {
  deck = [];
  if (gameType == GameType.WEREWOLF) {
    var werewolfCount = Math.floor(Math.sqrt(gameConfig_playerCount - 1));

    for (var i = 0; i < gameConfig_playerCount; i++) {
      deck.push(new Card(i < werewolfCount ? "W" : "V", 0));
    }
    return;
  }
  taskDeck = [];
  console.log("createDeck: " + JSON.stringify(suits) + "  :  " + JSON.stringify(ranks));
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
  // }
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
    var numberOfCardsToDeal = gameConfig_startCardsPerPlayer;
    if (numberOfCardsToDeal == -1) {
      numberOfCardsToDeal = Math.floor(deckSize / gameConfig_playerCount);
      if ((deckSize % gameConfig_playerCount) > i) {
        numberOfCardsToDeal += 1;
      }
    }
    console.log("DealCards -------deckSize:" + deckSize + "   cardsToDeal:" + numberOfCardsToDeal + "   deck.length:" + deck.length + "   i:" + i);
    for (var j = 0; j < numberOfCardsToDeal; j++) {
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
      console.log("gameConfig_topDeckTrump card: " + trumpCard);
    } else {
      alert("Empty Deck: no trump");
    }
  } else {
    console.log("gameConfig_topDeckTrump: " + gameConfig_topDeckTrump + "?????????????");
  }

  const data = {
    hands: hands,
    trumpCard: trumpCard
  };
  console.log("dealCards: " + JSON.stringify(data));
  socketio.emit('dealCards', data);
  console.log("Finished dealing");
}

function cardValue(card) {
  var value = Number(card.rank) < 10 ? 0 : Number(card.rank) - 10;
  return value;
}

function getEuchreCardValue(card) {
  if (!gameConfig_euchreBowers) {
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
  return {
    rank: rank,
    suit: suit
  };
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
  console.log("--------------setTrumpCardOrderIcon----------------data.card " + cardID + ",  data.icon: " + icon);
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

function setPlayerShortName(playerToName, shortName) {
  console.log("--------------assignShortNameToClients----------------data.playerNumber " + data.playerNumber + ",  data.shortName: " + data.shortName);
  var _idSelector = "#loc" + inversePlayerIdMap['Player' + playerToName] + "name";
  var tempPlayerIndicator = client_playerNumString.replace('Player', '');
  console.log("Is it me? " + playerToName + "  vs. " + tempPlayerIndicator);
  if (playerToName == tempPlayerIndicator) {
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
var cardsConcealed = true;

function deal(data) {
  cardsConcealed = true;
  $('.plays').css('transform', 'scale(1)');
  $('.plays').css('width', '20vw');
  console.log("--------------dealToClients---------------- " + JSON.stringify(data, null, 4));
  console.log("--------------dealToClients---------------- client_playerNumString: " + client_playerNumString);
  console.log("--------------dealToClients---------------- gameType: " + gameType);
  var myPIndex = Number(client_playerNumString.slice(-1)) - 1;
  myHandOfCards = data.hands[myPIndex];
  $("#showCase").empty();
  displayMyCards();
  for (var j = 1; j < gameConfig_playerCount; j++) {
    displayOtherCards(j, data.hands[j - 1].length);
  }
  if (gameConfig_cardsPlayable) {
    if (data.trumpCard) {
      console.log("------- Trump Card: " + data.trumpCard);
      displayTrumpCard(data.trumpCard)
      trumpSuit = data.trumpCard.suit;
    } else if (gameConfig_permaTrumpSuit) {
      trumpSuit = gameConfig_permaTrumpSuit;
    }
    if (gameConfig_bidForTrump) {
      //Start with left of the dealer
      lead = getNextPlayerName(dealer);
      startBidding();
    } else {
      if (startPlayerCard) {
        console.log("------- startPlayerCard how could this go wrong?: " + startPlayerCard);
        for (var i = 0; i < data.hands.length; i++) {
          for (var j = 0; j < data.hands[i].length; j++) {
            console.log("------- startPlayerCard i: " + i + "  j:" + j);
            if (data.hands[i][j].suit == startPlayerCard.charAt(0) && data.hands[i][j].rank == startPlayerCard.charAt(1)) {

              currentPlayer = "Player" + Number(i + 1);

              console.log("------- FOUND ONE: " + i + " | " + currentPlayer);
              j = data.hands[i].length;
              i = data.hands.length;
              break;
            }
          }
        }
      } else if (gameConfig_playCardsAsync) {
        currentPlayer = -1;
      } else {
        //Start with left of the dealer
        currentPlayer = getNextPlayerName(dealer);
      }
      lead = currentPlayer;
      var leaderNum = inversePlayerIdMap[lead];
      console.log("----dealToClients getNicknameForPlayer----- ");
      commanderName = getNicknameForPlayer(lead);
      $(".highlighted").removeClass("highlighted");
      updateTurnIndicator(lead, client_playerNumString == lead, true);
      console.log("--------------commanderName---------------- #loc" + commanderName + '   lead' + lead);
      console.log("--------------markingLeader---------------- #loc" + leaderNum + 'name');
      $(".leader").removeClass("leader");
      $('#loc' + leaderNum + 'name').addClass("leader");
      $('#bidOfRoundText').show();
    }
  }
  console.log("--------------dealt...ToClients---------------- client_playerNumString: " + client_playerNumString);
}

function revealCards() {
  if (cardsConcealed) {
    cardsConcealed = false;
    $(".myCards").each(playCard);
    $('.plays').css('transform', 'scale(0.5)');
    $('.plays').css('width', '30vw');
  }
}

function displayMyCards() {
  sortHand();
  $("#myHand").empty();
  for (var i = 0; i < myHandOfCards.length; i++) {
    var cardID = getCardID(myHandOfCards[i]);
    var encodedI = i + 10;
    var cardDiv = $("<div class='myCards' id='" + (encodedI + cardID) + "'></div>");
    $(cardDiv).append($("#" + cardID + "_img").clone().show());
    if (gameConfig_cardsPlayable) {
      $(cardDiv).click(playCard);
    }
    $("#myHand").append(cardDiv);
  }
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

  $(".onlyOption").click(function () {
    socketio.emit('communicateCard', {
      player: client_playerNumString,
      cardID: $(this).prop('id').slice(0, -4),
      type: 'onlyCard'
    });
    clearComms();
    $(this).addClass("onlyCard");
  });
  $(".highestOption").click(function () {
    socketio.emit('communicateCard', {
      player: client_playerNumString,
      cardID: $(this).prop('id').slice(0, -4),
      type: 'highestCard'
    });
    clearComms();
    $(this).addClass("highestCard");
  });
  $(".lowestOption").click(function () {
    socketio.emit('communicateCard', {
      player: client_playerNumString,
      cardID: $(this).prop('id').slice(0, -4),
      type: 'lowestCard'
    });
    clearComms();
    $(this).addClass("lowestCard");
  });
}

function cardCommunicated(data) {

  console.log("cardCommunicated++++++++++++ player: " + data.player);
  console.log("cardCommunicated++++++++++++ data.cardID: " + data.cardID);
  var seatIndex = inversePlayerIdMap[data.player];
  console.log("cardCommunicated++++++++++++ seatIndex:" + seatIndex);
  let communicatedCardSrc = $("#" + data.cardID + "_img").prop("src");
  console.log("cardCommunicated++++++++++++ communicatedCardSrc:" + communicatedCardSrc);
  $("#loc" + seatIndex + "Hand .otherCards").last().find("img").prop("src", communicatedCardSrc);
  $("#loc" + seatIndex + "Hand .otherCards").last().find("img").addClass(data.type);
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
  console.log(">>>>>>>>>>>>>displayOtherCards----in: #loc" + seatIndex + "Hand---- >>  handSize: " + handSize);
  $('#loc' + seatIndex + 'Hand').empty();
  for (var i = 0; i < handSize; i++) {
    var cardDiv = $("<div class='otherCards'></div>");
    $(cardDiv).append($(".cardback:eq(0)").clone().show());
    $('#loc' + seatIndex + 'Hand').append(cardDiv);
  }
  updateCardRotations(seatIndex);
}

function playCard() {
  console.log("--------------playCard >>>>>>>>>>>>>" + currentPlayer + " =? " + client_playerNumString + "   " + JSON.stringify(this));
  if (!cardsConcealed || gameConfig_playCardsAsync || currentPlayer == client_playerNumString) {
    var num = $(this).attr('id').substr(0, 2);
    var cardID = $(this).attr('id').substr(2);
    var card = getCardFromID(cardID);
    // console.log("--------------playCard! " + num + " : " + JSON.stringify(card));
    if (!cardsConcealed || confirmLegal(card, client_playerNumString == lead)) {
      
      if (myHandOfCards[Number(num) - 10] && (!cardsConcealed || gameConfig_cardsPerTurn == 1 || $("#myPlay").children().length < gameConfig_cardsPerTurn)) {
        myHandOfCards[Number(num) - 10].suit = "Z";
        $(this).detach();
        socketio.emit('playCard', {
          card: card,
          player: client_playerNumString
        });
      }
    } else {
      console.log("playCard? not legal.");
    }
  } else {
    console.log("playCard? nope.");
  }
}

function cardPlayed(data) {
  var player = data.player;
  var card = data.card;
  console.log("socketFunctions -> cardPlayed card: " + JSON.stringify(card) + "  >>  player: " + player + "  >> getNextPlayerName: " + getNextPlayerName(client_playerNumString) + "  >>  prevPlayer: " + prevPlayer(client_playerNumString));
  if (cardsConcealed && player == lead) {
    console.log("ssocketFunctions -> cardPLayed EMPTY" + client_playerNumString + "  :  " + player + "  |  " + lead);
    $(".plays").empty();
  } else {
    console.log("ssocketFunctions -> cardPLayed " + client_playerNumString + "  :  " + player + "  |  " + lead);
  }
  console.log("othersPlayed++++++++++++ player: " + player + " card:" + JSON.stringify(card));

  var cardObj;
  if (cardsConcealed && gameConfig_playFaceDown) {
    cardObj = $(".cardback:eq(0)").clone().prop('id', getCardID(card)).show();
  } else {
    cardObj = $("#" + getCardID(card) + "_img").clone().attr("class", "myCards").show();
    if (isATrumpCard(card)) {
      console.log("othersPlayed++++++++++++ IS A TRUMP");
      $(cardObj).addClass('isTrump');
    }
  }
  if (player != client_playerNumString) {
    var seatIndex = inversePlayerIdMap[player];
    console.log("othersPlayed++++++++++++ seatIndex:" + seatIndex);
    $("#loc" + seatIndex + "Hand").find(".otherCards").first().remove();
    $("#loc" + seatIndex + "play").append(cardObj);
    updateCardRotations(seatIndex);
  } else {
    $("#myPlay").append(cardObj);
    $(".highlighted").removeClass("highlighted");
  }
  console.log("still more to play on this trick?");
  if (cardsConcealed) {
    if (!gameConfig_playCardsAsync) {
      if (currentPlayer == lead) {
        leadSuit = getEuchreCardValue(card).suit;
      }
      if (getNextPlayerName(currentPlayer) == lead) {
        console.log("not a sync, back to leader");
        resolveTrick();
      } else {
        console.log("not a sync, NOT back to leader");
      }
      currentPlayer = getNextPlayerName(currentPlayer);
      if (gameConfig_cardsPlayable) {
        updateTurnIndicator(currentPlayer, currentPlayer == client_playerNumString, false);
      }
    } else {
      if ($(".plays > img").length == gameConfig_playerCount) {
        //allPlayersHavePlayed

        console.log("allPlayersHavePlayed");
        resolveTrick();
      } else {
        console.log("allPlayersHave NOT Played");
      }
    }

    console.log("gameCongid_drawBackUp: " + gameCongid_drawBackUp);
    if (gameCongid_drawBackUp) {
      drawNewCard(player);
    }
  } else {
    //just play them all out to reveal, game is over
  }
}

function drawNewCard(player) {
  console.log("drawNewCard");
  if (isGameMaster) {
    drawnCard = deck.pop();
    socketio.emit("cardDrawn", {
      card: drawnCard,
      player: player
    });
  }
}

function cardDrawn(data) {
  console.log("cardDrawn: " + JSON.stringify(data.card));
  if (data.card) {
    var hand;
    var cardObj;
    if (data.player == client_playerNumString) {
      hand = "#myHand";
      let encodedId = (myHandOfCards.length + 10) + getCardID(data.card);
      myHandOfCards.push(data.card);
      cardObj = $("<div class='myCards' id='" + encodedId + "'></div>");
      $(cardObj).append($("#" + getCardID(data.card) + "_img").clone().show());
    } else {
      hand = "#loc" + inversePlayerIdMap[data.player] + "Hand";
      cardObj = $(".cardback:eq(0)").clone().show();
    }
    console.log("cardDrawn hand: " + hand + "     cardObj" + JSON.stringify(cardObj));
    if (gameConfig_cardsPlayable) {
      $(cardObj).click(playCard);
    }
    $(hand).append(cardObj);
  }
}

function isATrumpCard(card) {
  const isATrumpCard = currentTrumpCards.some(trumpCard => trumpCard.rank == card.rank && trumpCard.suit == card.suit);
  console.log("^^^^^^^^^^^^ isATrumpCard: " + JSON.stringify(card) + " in:" + JSON.stringify(currentTrumpCards) + " includes?:" + isATrumpCard);

  return isATrumpCard;
}
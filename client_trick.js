function confirmLegal(cardID) {
  if (!isFollowingSuit(cardID)) {
    for (var i = 0; i < myHandOfCards.length; i++) {
      if (String(myHandOfCards[i].suit) == leadSuit) {
        alert("Must Follow Suit! " + suitNames[leadSuit] + " was lead.");
        console.log("GMcCards-rules.js-confirmLegal-got something else in hand");
        return false;
      }
    }
  }
  return true;
}

function isFollowingSuit(cardID) {
  console.log("GMcCards-rules.js-isFollowingSuit-#0000");
  var cardSuit = cardID.charAt(0);
  // TODO: Change to card.rank & card.suit to allow use of getEuchreCardValue(card)
  if (gameConfig_euchreBowers && cardID.substr(1) == "11" && suitColors[cardSuit] == suitColors[leadSuit]) {
    cardSuit = leadSuit;
  }
  if (cardID.charAt(0) == leadSuit) {
    console.log("GMcCards-rules.js-isFollowingSuit-matches the lead suit");
    return true;
  } else {
    console.log("GMcCards-rules.js-isFollowingSuit-Seems legit");
    return false;
  }
}

function resolveTrick() {
  console.log("GMcCards-rules.js-resolveTrick-#0000");
  var myCard = $("#myPlay");
  var trickCards = [];
  var iaAmTheWinner = true;
  var card1ID = myCard.find("img").attr("id").slice(0, -4);
  trickCards.push(card1ID);
  $(".plays").each(function () {
    var cardImgId = $(this).find("img").attr("id");
    console.log("GMcCards-rules.js-********* iterating plays1: " + cardImgId + "       : " + JSON.stringify(trickCards));
    if (cardImgId) {
      var card2ID = cardImgId.slice(0, -4);
      trickCards.push(card2ID);
      if (!compareCard(card1ID, card2ID)) {
        iaAmTheWinner = false;
      }
    } else {
      console.log("noslice: " + cardImgId);
    }
    console.log("GMcCards-rules.js-********* iterating plays2: " + cardImgId + "       : " + JSON.stringify(trickCards));
  });
  trickCards = [...new Set(trickCards)];
  console.log("GMcCards-rules.js-resolveTrick-#0200=======" + iaAmTheWinner + "  cards:" + JSON.stringify(trickCards));
  if (iaAmTheWinner) {
    console.log("GMcCards-rules.js-iaAmTheWinner!!!!!!!!!!!!!!!!!!!!!!!!!!");
    addTrickWin("myStuff", trickCards);
    tricksWon++;
    addTrickWinText("myWin", tricksWon);
    socketio.emit('winner', {
      player: playerNum,
      roomID: roomID,
      trickCards: trickCards
    });
  }

  function compareCard(card1ID, card2ID) {
    console.log("GMcCards-rules.js-compareCard-#0000");
    if (!card1ID) {
      console.log("GMcCards-rules.js-compareCard-#0200---------------false");
      return false;
    }
    if (!card2ID) {
      console.log("GMcCards-rules.js-compareCard-#0300---------------true");
      return true;
    }
    console.log("GMcCards-rules.js-compareCard-#0500    " + card1ID + "    <<<  vs. >>>   " + card2ID);
    var card1Suit = card1ID.charAt(0);
    var card2Suit = card2ID.charAt(0);

    var card1Rank = Number(card1ID.substr(1));
    var card2Rank = Number(card2ID.substr(1));
    if (gameConfig_euchreBowers) {
      // TODO: Change to card.rank & card.suit to allow use of getEuchreCardValue(card)
      if (card1Rank == 11 && suitColors[card1Suit] == suitColors[trumpSuit]) {
        if (card1Suit == trumpSuit) {
          card1Rank += 1;
        }
        card1Rank += 4;
        card1Suit = trumpSuit;
      }
      if (card2Rank == 11 && suitColors[card2Suit] == suitColors[trumpSuit]) {
        if (card2Suit == trumpSuit) {
          card2Rank += 1;
        }
        card2Rank += 4;
        card2Suit = trumpSuit;
      }
    }
    var win = 1;
    if (card1Suit == card2Suit) {
      win = (card1Rank >= card2Rank) ? 1 : 0;
    } else if (card1Suit != trumpSuit && card2Suit == trumpSuit) {
      win = 0;
    } else if ((card1Suit != trumpSuit && card1Suit != leadSuit) && card2Suit == leadSuit) {
      win = 0;
    }
    console.log("GMcCards-rules.js-compareCard-#1000---------------  " + win);
    return win;
  }
  console.log("GMcCards-rules.js-resolveTrick-#1000");
}

function addTrickWinText(who, wins) {
  $("#" + who).text(wins);
}

function addTrickWin(who, cards) {
  console.log("[][][][][][][] addTrickWin: " + who + " cards:" + cards);
  var card = document.createElement("div");
  card.setAttribute('class', 'otherCards');
  card.setAttribute('data-cards', cards);
  $(".cardback:eq(0)").clone().show().appendTo(card);
  var wonTricks = $('#' + who);
  $(wonTricks).append(card);
  $(wonTricks).hover(
      function () {
          if (!hoveringOverWonTricks) {
              hoveringOverWonTricks = true;
              $($(this).children()[0]).attr("data-cards").split(',');
              console.log("wonTricks hover...");
              var trickDetailsDiv = $("<div id='trickDetails'></div>");
              $(this).children().each(function () {
                  console.log("wonTricks Child:  " + $(this).attr("data-cards"));
                  if ($(this).attr("data-cards")) {
                      var cardsToDraw = $(this).attr("data-cards").split(',');
                      var trick = $("<div class='trick'></div>");
                      for (var i = 0; i < cardsToDraw.length; i++) {
                          var img_src = "/card_imgs/" + cardsToDraw[i] + ".png";
                          $(trick).append("<img class='wonTrickCard' src='" + img_src + "'/>");
                      }
                      $(trickDetailsDiv).append(trick);
                  }
              });
              $(this).attr("data-cards")
              $(this).append(trickDetailsDiv);
          }
      },
      function () {
          console.log("wonTricks UNhover...");
          $("#trickDetails").remove();
          hoveringOverWonTricks = false;
      }
  );
}

function nextPlayer(currPlayer) {
  var currNumber = Number(currPlayer.slice(-1));
  currNumber += 1;
  if (currNumber > gameConfig_playerCount) {
      currNumber = 1;
  }
  return "Player" + currNumber;
}

function prevPlayer(currPlayer) {
  var currNumber = Number(currPlayer.slice(-1));
  currNumber -= 1;
  if (currNumber < 1) {
      currNumber = gameConfig_playerCount;
  }
  return "Player" + currNumber;
}

function updateTurnIndicator(playerOnTurnName, isMe = false, isLead = false) {
  console.log("updateTurnIndicator");
  if(gameType == GameType.CREW){
    $("#commanderText").html("<b>Commander:</b> "+commanderName);
  }
  $("#turnText").html("<b>"+(isLead ? "To Lead" : "To Play") + ":</b> " + playerOnTurnName);
  if (isMe) {
      $("#myHand").addClass("highlighted");
      if(!isLead){
        highlightPlayable();
      }
  }

}
function confirmLegal(card) {
  if (!isFollowingSuit(card)) {
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

function isFollowingSuit(card) {
  console.log("GMcCards-rules.js-isFollowingSuit-#0000");
  if (gameConfig_euchreBowers && card.rank == "11" && suitColors[cardSuit] == suitColors[leadSuit]) {
    card.suit = leadSuit;
  }
  if (card.suit == leadSuit) {
    console.log("GMcCards-rules.js-isFollowingSuit-matches the lead suit");
    return true;
  } else {
    console.log("GMcCards-rules.js-isFollowingSuit-Seems legit");
    return false;
  }
}

function resolveTrick() {
  console.log("GMcCards-rules.js-resolveTrick-#0000");
  var trickCards = [];
  var iaAmTheWinner = true;
  var myCard = getCardFromID($("#myPlay").find("img").attr("id").slice(0, -4));
  trickCards.push(myCard);
  $(".plays").each(function () {
    var cardImgId = $(this).find("img").attr("id");
    console.log("GMcCards-rules.js-********* iterating plays1: " + cardImgId + "       : " + JSON.stringify(trickCards));
    if (cardImgId) {
      let otherCard = getCardFromID(cardImgId.slice(0, -4));
      trickCards.push(otherCard);
      if (!compareCard(myCard, otherCard)) {
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
      trickCards: trickCards
    });
  }
}

function compareCard(card1, card2) {
  compareRawCard(getEuchreCardValue(card1), getEuchreCardValue(card2));
}

function compareRawCard(card1, card2) {
  let win = 1;
  if (card1.suit == card2.suit) {
    win = (card1.rank >= card2.rank) ? 1 : 0;
  } else if (card1.suit != trumpSuit && card2.suit == trumpSuit) {
    win = 0;
  } else if ((card1.suit != trumpSuit && card1.suit != leadSuit) && card2.suit == leadSuit) {
    win = 0;
  }
  return win;
}

function addTrickWinText(who, wins) {
  $("#" + who).text(wins);
}

function addTrickWin(who, cards) {
  console.log("[][][][][][][] addTrickWin: " + who + " cards:" + cards);
  var cardDiv = $("<div></div>");
  $(cardDiv).addClass('otherCards');
  $(cardDiv).attr('data-cards', cards);
  $(cardDiv).append($(".cardback:eq(0)").clone().show());
  var wonTricks = $('#' + who);
  $(wonTricks).append(cardDiv);
  $(wonTricks).hover(
    function () {
      if (!hoveringOverWonTricks) {
        hoveringOverWonTricks = true;

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
  console.log("nextPlayer----currPlayer:" + currPlayer);
  var currNumber = Number(currPlayer.slice(-1));
  currNumber += 1;
  if (currNumber > gameConfig_playerCount) {
    currNumber = 1;
  }
  return "Player" + currNumber;
}

function prevPlayer(currPlayer) {
  console.log("prevPlayer----currPlayer:" + currPlayer);
  var currNumber = Number(currPlayer.slice(-1));
  currNumber -= 1;
  if (currNumber < 1) {
    currNumber = gameConfig_playerCount;
  }
  return "Player" + currNumber;
}

function updateTurnIndicator(playerOnTurnName, isMe = false, isLead = false) {
  console.log("updateTurnIndicator: " + gameConfig_captainTitle);
  if (gameConfig_captainTitle) {
    $("#commanderText").html("<b>" + gameConfig_captainTitle + ":</b> " + commanderName);
    $("#commanderText").show();
  } else {
    $("#commanderText").hide();
  }


  $("#turnText").html("<b>" + (isLead ? "To Lead" : "To Play") + ":</b> " + playerOnTurnName);
  if (isMe) {
    $("#myHand").addClass("highlighted");
    if (!isLead && gameConfig_biddingState == BiddingStates.FINISHED) {
      highlightPlayable();
    }
  }

}
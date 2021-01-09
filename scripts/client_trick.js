const lastModifiedString9 = ("Last modified: 2021/01/09 02:14:37");
const trickTS = lastModifiedString9.replace("Last ", "").replace("modified: ", "");
console.log("client_trick.js " + lastModifiedString9);

function confirmLegal(card, isLead) {
  if(isVotingTime){
    alert("Cast a vote before playing another card...");
    return false;
  }
  if (!gameConfig_playCardsAsync && !isLead && !isFollowingSuit(card)) {
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
//todo, disable card play during voting

  if (gameConfig_playFaceDown) {
    console.log("GMcCards-rules.js-resolveTrick-gameConfig_playFaceDown");
    $(".plays > img").sort(function () {
      return Math.random() - 0.5;
    }).each(function () {
      $(this).prop("src", "/card_imgs/" + $(this).prop("id") + ".png");
      $("#myPlay").append($(this));
    });
    if (gameConfig_voteForTrickWinner) {
      isVotingTime = true;
      console.log("time for voting...");
      $("#myPlay > img").addClass("highlighted");
      
      $("#myPlay > img.highlighted").click(function () {
        if($(this).hasClass( "highlighted" )){
          console.log("vote Cast! ");
          $("highlighted").removeClass("highlighted");
          var cardID = $(this).attr('id');
          var card = getCardFromID(cardID);
          socketio.emit('submitVote', {
            card: card,
            player: client_playerNum
          });
        }
      });
    }
  } else {
    console.log("GMcCards-rules.js-resolveTrick-#0000");
    var trickCardIDs = [];
    var iaAmTheWinner = true;
    var myCardID = $("#myPlay").find("img").attr("id").slice(0, -4);
    trickCardIDs.push(myCardID);
    $(".plays").each(function () {
      var cardImgId = $(this).find("img").attr("id");
      console.log("GMcCards-rules.js-********* iterating plays1: " + cardImgId + "       : " + JSON.stringify(trickCardIDs));
      if (cardImgId) {
        let otherCardID = cardImgId.slice(0, -4);
        trickCardIDs.push(otherCardID);
        if (!compareCard(getCardFromID(myCardID), getCardFromID(otherCardID))) {
          iaAmTheWinner = false;
        }
      } else {
        console.log("noslice: " + cardImgId);
      }
      console.log("GMcCards-rules.js-********* iterating plays2: " + cardImgId + "       : " + JSON.stringify(trickCardIDs));
    });
    trickCardIDs = [...new Set(trickCardIDs)];
    console.log("GMcCards-rules.js-resolveTrick-#0200=======" + iaAmTheWinner + "  cards:" + JSON.stringify(trickCardIDs));
    if (iaAmTheWinner) {
      console.log("GMcCards-rules.js-iaAmTheWinner!!!!!!!!!!!!!!!!!!!!!!!!!!");
      addTrickWin("myStuff", trickCardIDs);
      tricksWon++;
      addTrickWinText("myWin", tricksWon);
      socketio.emit('winner', {
        player: client_playerNum,
        trickCards: trickCardIDs
      });
    }
  }
}

function clearVotesAndStartNewTrick(){
  $(".plays").empty();
  isVotingTime = false;
  votes=[];
};

function voteSubmitted(data){
  console.log("voteSubmitted...");
  votes.push(data);
  console.log("voteSubmitted... votes:"+JSON.stringify(votes));
  if (votes.length == gameConfig_playerCount){
    //Everyone Has Voted
    console.log("voteSubmitted... votes:"+JSON.stringify(votes));
    $(votes).each(function(){
      $(".plays > #"+getCardID(this.card)).parent().prepend("<i class='material-icons vote"+this.player+"'>gavel</i>");
    });
   window.setTimeout( clearVotesAndStartNewTrick, 2000);
  }
}

function compareCard(card1, card2) {
  let result = compareRawCard(getEuchreCardValue(card1), getEuchreCardValue(card2));
  console.log("compareCards... " + JSON.stringify(card1) + "vs." + JSON.stringify(card2) + "   =" + result);
  return result;
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
  if (gameConfig_showWonTricks) {
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
              var cardsToRender = $(this).attr("data-cards").split(',');
              console.log("wonTricks Child: more specifically... " + JSON.stringify(cardsToRender));
              var trick = $("<div class='trick'></div>");
              for (var i = 0; i < cardsToRender.length; i++) {
                console.log("--- Drawing card... " + JSON.stringify(cardsToRender[i]));
                var img_src = "/card_imgs/" + cardsToRender[i] + ".png";
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
}

function getNextPlayerName(currPlayer) {
  if (currPlayer == -1) {
    return -1;
  }
  console.log("getNextPlayerName----currPlayer:" + currPlayer);
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

function updateTurnIndicator(playerOnTurn, isMe = false, isLead = false) {
  let playerOnTurnName = getNicknameForPlayer(playerOnTurn)
  console.log("updateTurnIndicator gameConfig_captainTitle: " + gameConfig_captainTitle);
  if (gameConfig_captainTitle) {
    $("#commanderText").html("<b>" + gameConfig_captainTitle + ": </b>" + commanderName);
    $("#commanderText").show();
  } else {
    $("#commanderText").hide();
  }


  $("#turnText").html("<b>" + (isLead ? "Lead" : "Turn") + ": </b>" + playerOnTurnName);
  console.log("updateTurnIndicator isMe " + isMe);
  if (isMe) {
    $("#myHand").addClass("highlighted");
    console.log("highlight My Hand 1");
    if (!isLead && gameConfig_biddingState == BiddingStates.FINISHED) {
      highlightPlayable();
    }
  }

}
function checkLegal(cardID) {
  console.log("GMcCards-rules.js-checkLegal-#0000");
  var cardSuit = cardID.charAt(0);
  if(gameConfig_euchreBowers && cardID.substr(1) == "11" && suitColors[cardSuit] == suitColors[leadSuit]){
    cardSuit = leadSuit;
  }

  if (cardID.charAt(0) == leadSuit) {
    console.log("GMcCards-rules.js-checkLegal-#0300");
    return true;
  } else {
    for (var i = 0; i < Player1.length; i++) {
      if (String(Player1[i].suit) == leadSuit) {
        alert("Must Follow Suit!");
        console.log("GMcCards-rules.js-checkLegal-#0600");
        return false;
      }
    }
    console.log("GMcCards-rules.js-checkLegal-#1000");
    return true;
  }
}

function resolveTrick() {
  console.log("GMcCards-rules.js-resolveTrick-#0000");
  var myCard = $("#myPlay");
  var trickCards = [];
  var isWinner = true;
  var card1ID = myCard.find("img").attr("id").slice(0, -4);
  trickCards.push(card1ID);
  $(".plays").each(function(){
    var cardImgId = $(this).find("img").attr("id"); 
    if (cardImgId) {
      var card2ID = cardImgId.slice(0, -4);
      trickCards.push(card2ID);
      if(!compareCard(card1ID, card2ID)){
        isWinner=false;
      }
    } else {
      console.log("noslice: "+cardImgId);
    }
  });
  console.log("GMcCards-rules.js-resolveTrick-#0200======="+isWinner+"  cards:"+ JSON.stringify(trickCards));
  if (isWinner) {
    console.log("GMcCards-rules.js-resolveTrick-#0300");
    addWin("myStuff", trickCards);
    tricksWon++;
    socketio.emit('winner', {
      player: playerNum,
      roomID: roomID,
      trickCards: trickCards
    });
  }

  function compareCard(card1ID, card2ID) {
    console.log("GMcCards-rules.js-compareCard-#0000");
    if(!card1ID){
      console.log("GMcCards-rules.js-compareCard-#0200---------------false");
      return false;
    }
    if(!card2ID){
      console.log("GMcCards-rules.js-compareCard-#0300---------------true");
      return true;
    }
    console.log("GMcCards-rules.js-compareCard-#0500    "+ card1ID+ "    <<<  vs. >>>   "+ card2ID);
    var card1Suit = card1ID.charAt(0);
    var card2Suit = card2ID.charAt(0);

    var card1Rank = Number(card1ID.substr(1));
    var card2Rank = Number(card2ID.substr(1));
    if(gameConfig_euchreBowers){
      if(card1Rank == 11 && suitColors[card1Suit] == suitColors[trumpSuit]){
          if(card1Suit == trumpSuit){
            card1Rank += 1;
          }
          card1Rank += 4;
          card1Suit = trumpSuit;
      }
      if(card2Rank == 11 && suitColors[card2Suit] == suitColors[trumpSuit]){
        if(card2Suit == trumpSuit){
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
    console.log("GMcCards-rules.js-compareCard-#1000---------------  "+win);
    return win;
  }
  console.log("GMcCards-rules.js-resolveTrick-#1000");
}
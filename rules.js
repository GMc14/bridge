var dealer = "Player1";
var currentPlayer;
var lead;
var leadSuit;
var trumpSuit;
var handsNeeded;
var roundWins = 0;

function checkLegal(cardID) {

  console.log("GMcCards-rules.js-checkLegal-#0000");
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

function winRound() {
  console.log("GMcCards-rules.js-winRound-#0000");
  var myCard = $("#myPlay");

  var isWinner = true;

  $(".plays").each(function(){
    if(!compareCard(myCard, $(this))){
      isWinner=false;
    }
  });

  if (isWinner) {
    console.log("GMcCards-rules.js-winRound-#0300");
    addWin("myStuff");
    roundWins++;
    socketio.emit('winner', {
      player: playerNum,
      roomID: roomID
    });
  }

  function compareCard(card1, card2) {
    console.log("GMcCards-rules.js-compareCard-#0000");
    if(!card1.find("img").attr("id")){
      console.log("GMcCards-rules.js-compareCard-#0200---------------false");
      return false;
    }
    if(!card2.find("img").attr("id")){
      console.log("GMcCards-rules.js-compareCard-#0300---------------true");
      return true;
    }
    console.log("GMcCards-rules.js-compareCard-#0500"+ JSON.stringify(card1)+ " vs. "+ JSON.stringify(card2));
    var card1ID = card1.find("img").attr("id").slice(0, -4);
    var card2ID = card2.find("img").attr("id").slice(0, -4);

    const card1Suit = card1ID.charAt(0);
    const card2Suit = card2ID.charAt(0);
    const card1Rank = Number(card1ID.substr(1));
    const card2Rank = Number(card2ID.substr(1));

    var win = 1;
    if (card1Suit == card2Suit) {
      win = (card1Rank > card2Rank) ? 1 : 0;
    } else if (card1Suit != trumpSuit && card2Suit == trumpSuit) {
      win = 0;
    } else if ((card1Suit != trumpSuit && card1Suit != leadSuit) && card2Suit == leadSuit) {
      win = 0;
    }
    return win;
  }

  console.log("GMcCards-rules.js-winRound-#1000");
}
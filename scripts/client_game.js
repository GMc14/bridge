const lastModifiedString4 = ("Last modified: 2021/01/09 02:21:07");
const gameTS=lastModifiedString4.replace("Last ","").replace("modified: ","");
console.log("client_game.js "+lastModifiedString4);


//Room
var roomID;
var playerIdMap = [];
var inversePlayerIdMap = [];

//Game
var gameType;
var bonusCards;
var isVotingTime = false;
var gameConfig_gameName;
var gameConfig_permaTrumpSuit;
var gameConfig_hasTeams;
var gameConfig_topDeckTrump;
var gameConfig_euchreBowers;
var gameConfig_bidForTrump;
var gameConfig_missions;
var gameConfig_playerCount;
var gameConfig_stickTheDealer;
var gameConfig_mustFollowSuit;
var gameConfig_showWonTricks;
var gameConfig_biddingState;
var gameConfig_playFaceDown;
var gameCongid_drawBackUp;
var gameConfig_cardsPerTurn;
var gameConfig_playCardsAsync;
var gameConfig_minPlayerCount = 1;
var gameConfig_maxPlayerCount = 4;
var gameConfig_padTrickWithRandoms;
var gameConfig_voteForTrickWinner;
var gameConfig_startCardsPerPlayer; //-1 == Deal All
var gameConfig_numberOfRounds; //-1 == Play all cards in hand
var ranks;
var startPlayerCard;
var gameConfig_captainTitle;
var gameConfig_hasTasks;
const BiddingStates = {
    "PREBID": 0,
    "ORDERING_UP": 1,
    "SUIT_SELECTION": 2,
    "BETTING": 3,
    "FINISHED": -1
};
const CommunicationTypes = {
    "ONLY": 0,
    "LOWEST": 1,
    "HIGHEST": 2,
    "ANY": -1
};

function setGameType(gT) {
    gameType = gT;
    bonusCards = [];
    gameConfig_missions = [];

    gameConfig_gameName = 'Unknown';
    gameConfig_permaTrumpSuit = '';
    startPlayerCard = '';
    gameConfig_captainTitle = '';

    gameConfig_hasTeams = false;
    gameConfig_topDeckTrump = false;
    gameConfig_euchreBowers = false;
    gameConfig_bidForTrump = false;
    gameConfig_stickTheDealer = false;
    gameConfig_playFaceDown = false;
    gameConfig_hasTasks = false;
    gameConfig_playCardsAsync = false;
    gameCongid_drawBackUp = false;
    gameConfig_padTrickWithRandoms = false;
    gameConfig_voteForTrickWinner = false;
    gameConfig_chooseSeats = true;
    gameConfig_cardsPlayable = true;
    gameConfig_mustFollowSuit = true;
    gameConfig_showWonTricks = true;

    gameConfig_startCardsPerPlayer = -1;
    gameConfig_numberOfRounds = -1;
    gameConfig_cardsPerTurn = 1;
    gameConfig_minPlayerCount = 1;
    gameConfig_maxPlayerCount = 100;

    gameConfig_biddingState = BiddingStates.FINISHED;
    ranks = standardRanks;

    console.log("-------A------" + gameType);
    console.log("-------B------" + GameType.CREW);

    if (gameType == GameType.CREW) {
        gameConfig_gameName = 'The Crew';
        bonusCards = crewBonusCards;
        gameConfig_permaTrumpSuit = 'R';
        ranks = crewRanks;
        startPlayerCard = crewStartCard;
        gameConfig_missions = crewMissions;
        gameConfig_hasTasks = true;
        gameConfig_minPlayerCount = 1;
        gameConfig_maxPlayerCount = 5;
        gameConfig_captainTitle = 'Commander'
    } else if (gameType == GameType.BRIDGE) {
        gameConfig_gameName = 'Bridge';
        gameConfig_bidForTrump = true;
        gameConfig_biddingState = BiddingStates.PREBID;
        gameConfig_hasTeams = true;
        gameConfig_minPlayerCount = 4;
        gameConfig_maxPlayerCount = 4;
    } else if (gameType == GameType.EUCHRE) {
        gameConfig_gameName = 'Euchre';
        gameConfig_bidForTrump = true;
        gameConfig_biddingState = BiddingStates.PREBID;
        gameConfig_hasTeams = true;
        gameConfig_topDeckTrump = true;
        gameConfig_stickTheDealer = true;
        gameConfig_euchreBowers = true;
        ranks = euchreRanks;
        gameConfig_startCardsPerPlayer = 5;
        gameConfig_minPlayerCount = 3;
        gameConfig_maxPlayerCount = 4;
    } else if (gameType == GameType.DIXIT) {
        gameConfig_gameName = 'Dixit';
        gameConfig_playFaceDown = true;
        gameConfig_playCardsAsync = true;
        gameConfig_chooseSeats = false;
        gameCongid_drawBackUp = true;
        gameConfig_voteForTrickWinner = true;
        gameConfig_padTrickWithRandoms = true; //TODO: implement before card reveal
        gameConfig_showWonTricks = false;
        gameConfig_mustFollowSuit = false;
        gameConfig_startCardsPerPlayer = 5;
        gameConfig_minPlayerCount = 1;
        gameConfig_maxPlayerCount = 5;
        //suits = new Array("heartstoners");
        //ranks = [...Array(25).keys()].map(x => x++);;
    } else if (gameType == GameType.WEREWOLF) {
        gameConfig_startCardsPerPlayer = 1;
        gameConfig_cardsPlayable = false;      
        gameConfig_minPlayerCount = 3;
        gameConfig_maxPlayerCount = 99;
        gameConfig_chooseSeats = false;
    } else {
        alert("Unknown GameType: " + gameType);
    }
}

//Deck Setup
var deck = [];
var taskDeck = [];
var roomState;
var suits = new Array("C", "D", "S", "H");
var suitNames = {
    "C": "Clubs",
    "D": "Diamonds",
    "S": "Spades",
    "H": "Hearts",
    "R": "Rockets"
}
var suitColors = {
    "C": "Black",
    "S": "Black",
    "H": "Red",
    "D": "Red"
}
var votes = [];
const standardRanks = new Array(2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14);
const euchreRanks = new Array(9, 10, 11, 12, 13, 14);

var commanderName;
//Player values
var nickname;
var client_username
var client_playerNum;
var seatIndex;
var clientPlayerId;
var myHandOfCards;
//Play values
var dealer = "Player1";
var currentPlayer;
var lead;
var leadSuit;
var trumpSuit;
var tricksWon = 0;
var roundNumber = 0;
var handsNeeded;

var hoveringOverWonTricks = false;

const GameType = {
    "CREW": 1,
    "BRIDGE": 2,
    "EUCHRE": 3,
    "DIXIT": 4,
    "WEREWOLF":5,
    "SECRETHITLER":6,
    "AVALON":7,
    "TWOROOMS":8,
    "ONENIGHT":9
};

function constructUnseatedPlayArea(){
    
}

function constructSeatedPlayArea() {
  var clientNumber = Number(client_playerNum.slice(-1));
  for (var j = 1; j < gameConfig_playerCount; j++) {
      var pNumber = Number((clientNumber + j - 1) % gameConfig_playerCount) + 1;

      var stuff = $('<div alt="loc' + j + 'stuff" id="loc' + j + 'stuff" class="stuff"></div>');
      var plays = $('<div alt="loc' + j + 'play" id="loc' + j + 'play" class="plays"></div>');
      var name = $('<div alt="loc' + j + 'name" id="loc' + j + 'name" class="name"></div>');
      var winCounter = $('<div alt="loc' + j + 'wins" id="loc' + j + 'wins" class="winCount">0</div>');
      var playerHand = $('<div alt="loc' + j + 'Hand" class="otherPlayerHand" id="loc' + j + 'Hand" ></div>');
      var playerContainer = $("<div alt='loc" + j + "Container' id='loc" + j + "Container' class='locationContainer'></div>");

      $(playerContainer).append(playerHand);
      $(playerContainer).append(stuff);
      $(playerContainer).append(plays);
      $(playerContainer).append("<select class='trumpDrops plyrDrop plyrDropName' pNum='" + pNumber + "' id='drpPlyrName" + j + "' name='dropdownIcon' size=1>");
      $(playerContainer).append(name);
      $(playerContainer).append(winCounter);

      $("#gameBoard").append(playerContainer);

      var positionRelativeToCenter = j - ((gameConfig_playerCount) / 2);
      $(playerContainer).css({
          "left": ((j - 1) * 90 / (gameConfig_playerCount - 1) + 15.5) + "vw",
          "top": "12vh",
          "transform": "rotate(" + positionRelativeToCenter * 15 + "deg) translateY(" + Math.abs(positionRelativeToCenter) * 4 + "vmax)"
      });
      playerIdMap[j] = 'Player' + pNumber;
      inversePlayerIdMap['Player' + pNumber] = j;
      $("#loc" + j + "name").html('Player' + pNumber + ': ' + playerNickNames[pNumber - 1]);
      $.each(playerOptions, function () {
          $("#drpPlyrName" + j).append('<option value="' + this + '">' + this + '</option>');
      });
      $("#drpPlyrName" + j).change(function () {
          var shortName = $(this).val();
          var tempPNumber = $(this).attr("pNum");
          console.log(">>>>>>>>>>>>>drpPlyrName selected ----------------tempPNumber:" + tempPNumber + " : " + shortName);
          socketio.emit('assignShortName', {
              playerNumber: tempPNumber,
              shortName: shortName
          });
      });
  }
  $.each(playerOptions, function () {
      $("#myDrpPlyrName").append('<option value="' + this + '">' + this + '</option>');
  });
  $("#myDrpPlyrName").change(function () {
      var playerNumber = client_playerNum.replace('Player', '');
      var shortName = $(this).val();
      console.log(">>>>>>>>>>>>>myDrpPlyrName selected ---------------- playerNumber:" + playerNumber + " : " + shortName);
      socketio.emit('assignShortName', {
          playerNumber: playerNumber,
          shortName: shortName
      });
  });
}

function calculateGameWinner() {
  var win = tricksWon < handsNeeded ? 0 : 1;
  if (win) {
      $('#winners').html('<b>WINNER:</b> YOU');
  } else {
      $('#winners').html('<b>WINNER:</b> NOT YOU');
  }
  $('#gameBid').html('<b>BID:</b> ' + currentBid + ' (' + currentBidder + ')');
  $('#wins').html('<b>YOU WON:</b> ' + tricksWon + ' tricks');
  refreshTeamWins(win);
  //Dealer Moves to the left
  dealer = getNextPlayerName(dealer);
  currentPlayer = '', lead = '', leadSuit = '', trumpSuit = '', handsNeeded = '', tricksWon = 0, roundNumber = 0;
  $('#gameRecap').show();
}

function refreshTeamWins(win) {
  console.log("refreshTeamWins rewrite this with locations instead of 'left/right/across'");
  switch (win) {
      case 0:
          // var numWins = $('#leftWin').html();
          // numWins = Number(numWins) + 1;
          // $('#leftWin').html(numWins);
          // $('#rightWin').html(numWins);
          break;
      case 1:
          // var numWins = $('#acrossWin').html();
          // numWins = Number(numWins) + 1;
          // $('#myWin').html(numWins);
          break;
  }
}
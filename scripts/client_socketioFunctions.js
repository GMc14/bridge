const lastModifiedString8 = ("Last modified: 2020/11/27 15:40:09");
const socketTS = lastModifiedString8.replace("Last ", "").replace("modified: ", "");
console.log("client_socketioFunction.js " + lastModifiedString8);

//Meta
var socketio = io.connect();

//Room
var roomID;
var playerIdMap = [];
var inversePlayerIdMap = [];

//Game
var gameType;
var bonusCards;
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
        gameCongid_drawBackUp = true;
        gameConfig_voteForTrickWinner = true;
        gameConfig_padTrickWithRandoms = true; //TODO: implement before card reveal
        gameConfig_showWonTricks = false;
        gameConfig_mustFollowSuit = false;
        gameConfig_startCardsPerPlayer = 5;
        gameConfig_minPlayerCount = 1;
        gameConfig_maxPlayerCount = 5;
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
var votes=[];
const standardRanks = new Array(2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14);
const euchreRanks = new Array(9, 10, 11, 12, 13, 14);

var commanderName;
//Player values
var nickname;
var playerNum;
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

$(function () {
    socketio.on('updateRoom', function (room) {
        updateRoom(room);
    });
    socketio.on('leftInGame', function (nickname) {
        alert(nickname + " left the room. Kicking everybody out... ");
        window.location.reload();
    });
    socketio.on('startGame', function (data) {
        initialStartGame(data);
    });
    socketio.on('restartGame', function () {
        startGame();
    });
    socketio.on('dealToClients', function (data) {
        deal(data);
    });
    socketio.on('cardPlayed', function (data) {
        cardPlayed(data);
    });
    socketio.on('winnerOfRound', function (data) {
        winnerOfRound(data);
    });
    socketio.on('some1Bid', function (data) {
        someoneBid(data);
    });
    socketio.on('some1Passed', function () {
        someonePassed();
    });
    socketio.on('declareSuit', function (suit) {
        suitDeclared(suit);
    });
    socketio.on('orderUp', function () {
        orderedUp();
    });
    socketio.on('communicateCard', function (data) {
        cardCommunicated(data);
    });
    socketio.on('setMission', function (data) {
        $("#missionNumberText").html("<b>Mission #: </b>" + data);
    });
    socketio.on('setHand', function (data) {
        $("#handNumberText").html("<b>Attempt #: </b>" + data);
    });
    socketio.on('cardDrawn', function (data) {
        cardDrawn(data);
    });
    socketio.on('voteSubmitted', function (data) {
        console.log("voteSubmitted...");
        voteSubmitted(data);
    });
});
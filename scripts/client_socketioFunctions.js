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
var gameConfig_playCardsAsync;
var gameConfig_minPlayerCount = 1;
var gameConfig_maxPlayerCount = 4;
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

    gameConfig_mustFollowSuit = true;
    gameConfig_showWonTricks = true;
    
    gameConfig_startCardsPerPlayer = -1;
    gameConfig_numberOfRounds = -1;
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
var handSizes = [];
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

const standardRanks = new Array(2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14);
const euchreRanks = new Array(9, 10, 11, 12, 13, 14);


var commanderName;
//Player values
var nickname;
var playerNum;
var seatIndex;
var clientPlayerId;
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
    $("#helpLegendTrigger").click(function () {
        console.log("show THINGSSSS");
        $("#helpLegend").toggle();
    });
    $("#settingsTrigger").click(function () {
        console.log("show Settings");
        $("#settings").toggle();
    });
    $("#settings").click(function () {
        $("#settings").hide();
    });
    $("#helpLegend").click(function () {
        $("#helpLegend").hide();
    });
    $("#boxTop").on("click", function () {
        $('#boxBottom').toggle();
    });
    $('#textArea').bind('keyup', function (e) {
        if (e.keyCode === 13) { // 13 is enter key
            var msg = $(this).val();
            socketio.emit('sendMessage', {
                msg: msg,
                nickname: nickname
            });
            $(this).val('');
        }
    });
    socketio.on('updateRoom', function (room) {
        updateRoom(room);
    });
    socketio.on('leftInGame', function (nickname) {
        alert(nickname + " left the room. Kicking everybody out... ");
        window.location.reload();
    });
    socketio.on('startGame', function (data) {
        setGameType(data.gameType);
        gameConfig_playerCount = data.playerCount;
        cardback = $(".cardBackOption.ui-selected").prop("src");

        $("#playArea").show();
        console.log("client_socket :: startGame");
        preRenderImgs();

        $("#playerSetup").hide();

        $("#startGameButton").hide();
        constructPlayArea();
        startGame();
    });
    socketio.on('restartGame', function () {
        $('#gameRecap').hide();
        $('.stuff').empty();
        $('.plays').empty();
        $('#bidOfRoundText').hide();
        $('.winCount').text(0);
        $('td').css('background-color', 'transparent');
        tricksWon = 0;
        currentTrumpCards = [];
        $(".isTrump").removeClass("isTrump");

        startGame();
    });
    socketio.on('dealToClients', function (data) {
        console.log("--------------dealToClients---------------- " + JSON.stringify(data, null, 4));
        console.log("--------------dealToClients---------------- playerNum: " + playerNum);
        console.log("--------------dealToClients---------------- gameType: " + gameType);

        var myPIndex = Number(playerNum.slice(-1)) - 1;
        myHandOfCards = data.hands[myPIndex];

        for (var i = 0; i < data.hands.length; i++) {
            handSizes[i] = data.hands[i].length;
        }
        $("#showCase").empty();

        if (data.trumpCard) {
            console.log("------- Trump Card: " + data.trumpCard);
            displayTrumpCard(data.trumpCard)
            trumpSuit = data.trumpCard.suit;
        } else if (gameConfig_permaTrumpSuit) {
            trumpSuit = gameConfig_permaTrumpSuit;
        }
        displayCards(); //Display cards before & after trump determined, sort may have changed

        if (gameConfig_bidForTrump) {
            lead = nextPlayer(dealer);
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
            } else {
                currentPlayer = nextPlayer(dealer);
            }
            lead = currentPlayer;
            var leaderNum = inversePlayerIdMap[lead];
            console.log("----dealToClients getNicknameForPlayer----- ");
            commanderName = getNicknameForPlayer(lead);
            $(".highlighted").removeClass("highlighted");
            updateTurnIndicator(getNicknameForPlayer(lead), playerNum == lead, true);
            console.log("--------------commanderName---------------- #loc" + commanderName + '   lead' + lead);
            console.log("--------------markingLeader---------------- #loc" + leaderNum + 'name');
            $(".leader").removeClass("leader");
            $('#loc' + leaderNum + 'name').addClass("leader");
            $('#bidOfRoundText').show();
        }
        console.log("--------------dealt...ToClients---------------- playerNum: " + playerNum);
    });
    socketio.on('cardPlayed', function (data) {
        cardPlayed(data);
    });
    socketio.on('winnerOfRound', function (data) {
        var trickWinner = data.player;
        var trickCardIDs = data.trickCards;
        roundNumber++;
        lead = trickWinner;
        currentPlayer = trickWinner;
        $(".highlighted").removeClass("highlighted");
        console.log("----winnerOfRound getNicknameForPlayer----- ");
        updateTurnIndicator(getNicknameForPlayer(lead), playerNum == currentPlayer, true);

        console.log("[][][][][][][] winner of round: " + trickWinner + " cards:" + trickCardIDs);
        var winnerIndex = inversePlayerIdMap[trickWinner];
        if (winnerIndex) {
            console.log("[][][][][][][] put trick in... loc" + winnerIndex + "stuff");
            addTrickWin("loc" + winnerIndex + "stuff", trickCardIDs);
            var winsId = "loc" + winnerIndex + "wins";
            var currentWins = Number($("#" + winsId).text());
            console.log("OOOOOOOOOOOOOOOOOOOOO}}}}}}}}}}}}  currentWins: " + currentWins);
            addTrickWinText(winsId, currentWins + 1);
        } else {
            console.log("[][][][][][][] no bueno winner mustBeMe");
        }
        // if (gameConfig_hasTeams && gameConfig_playerCount == 4 && trickWinner == nextPlayer(nextPlayer(playerNum))) {
        //     tricksWon++;
        // }
        if (roundNumber == gameConfig_numberOfRounds) {
            calculateGameWinner();
        } else if (gameConfig_numberOfRounds == -1) {
            //TODO: check it any players still have card 
        }
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
});

var path = window.location.pathname;
console.log("window.location.pathname: " + path);
// if(path.length==4){
//     console.log("AutoJoiner: "+path);             
//     joinRoom();
// }
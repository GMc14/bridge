//Meta
var socketio = io.connect();

//Room
var roomID;
var playerIdMap = [];
var inversePlayerIdMap = [];

//Game
var gameType;
var bonusCards;
var gameConfig_permaTrumpSuit;
var gameConfig_hasTeams;
var gameConfig_topDeckTrump;
var gameConfig_euchreBowers;
var gameConfig_bidForTrump;
var gameConfig_missions;
var gameConfig_playerCount;
var gameConfig_minPlayerCount=1;
var gameConfig_maxPlayerCount=4;
var gameConfig_startCardsPerPlayer; //-1 == Deal All
var gameConfig_numberOfRounds; //-1 == Play all cards in hand
var ranks;
var startPlayerCard;
var gameConfig_hasTasks;

const GameType = {
    "CREW": 1,
    "BRIDGE": 2,
    "EUCHRE": 3
};

function setGameType(gT) {
    gameType = gT;
    bonusCards = [];
    gameConfig_permaTrumpSuit = '';
    gameConfig_hasTeams = false;
    gameConfig_topDeckTrump = false;
    gameConfig_euchreBowers = false;
    gameConfig_bidForTrump = false;
    gameConfig_missions = [];
    gameConfig_startCardsPerPlayer = -1;
    gameConfig_numberOfRounds = -1;
    gameConfig_minPlayerCount = 1;
    gameConfig_maxPlayerCount = 100;
    ranks = standardRanks;
    startPlayerCard = '';
    gameConfig_hasTasks = false;
    alert("Compare: " + gameType + " : " + GameType.CREW);

    console.log("-------A------" + gameType);
    console.log("-------B------" + GameType.CREW);

    if (gameType == GameType.CREW) {
        bonusCards = crewBonusCards;
        gameConfig_permaTrumpSuit = 'R';
        ranks = crewRanks;
        startPlayerCard = crewStartCard;
        gameConfig_missions = crewMissions;
        gameConfig_hasTasks = true;
        gameConfig_minPlayerCount = 1;
        gameConfig_maxPlayerCount = 5;
    } else if (gameType == GameType.BRIDGE) {
        gameConfig_hasTeams = true;
        gameConfig_bidForTrump = true;
        gameConfig_minPlayerCount = 4;
        gameConfig_maxPlayerCount = 4;
    } else if (gameType == GameType.EUCHRE) {
        gameConfig_hasTeams = true;
        gameConfig_topDeckTrump = true;
        gameConfig_euchreBowers = true;
        ranks = euchreRanks;
        gameConfig_startCardsPerPlayer = 5;
        gameConfig_minPlayerCount = 3;
        gameConfig_maxPlayerCount = 4;
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

var cardback = "card_imgs/cardback.png";
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
    socketio.on('startGame', function (playerCount) {

        alert("LLLegit: " + $("#gameDrop").val());
        setGameType($("#gameDrop").val());
        gameConfig_playerCount = playerCount;
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
        $('#bidOfRound').hide();
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
        var myPIndex = Number(playerNum.slice(-1)) - 1;
        myHandOfCards = data.hands[myPIndex];

        for (var i = 0; i < data.hands.length; i++) {
            handSizes[i] = data.hands[i].length;
        }
        $("#showCase").empty();

        if (gameConfig_bidForTrump) {
            displayCards(); //Display cards before & after trump determined, sort may have changed
            startBidding();
        } else {
            if (data.trumpCard) {
                console.log("------- Trump Card: " + data.trumpCard);
                displayTrumpCard(data.trumpCard)
                trumpSuit = data.trumpCard.suit;
            } else {
                trumpSuit = gameConfig_permaTrumpSuit;
            }
            displayCards(); //Display cards before & after trump determined, sort may have changed
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
            commanderName = getNicknameForPlayer(lead);
            $(".highlighted").removeClass("highlighted");
            if (playerNum == currentPlayer) {
                updateTurnIndicator("You", true, true);
            } else {
                updateTurnIndicator(getNicknameForPlayer(lead), false, true);
            }
            console.log("--------------commanderName---------------- #loc" + commanderName + '   lead' + lead);
            console.log("--------------markingLeader---------------- #loc" + leaderNum + 'name');
            $(".leader").removeClass("leader");
            $('#loc' + leaderNum + 'name').addClass("leader");
            $('#bidOfRound').show();
        }
        console.log("--------------dealt...ToClients---------------- playerNum: " + playerNum);
    });
    socketio.on('cardPlayed', function (data) {
        var player = data.player;
        var card = data.card;
        console.log("socketFunctions -> cardPayed card: " + card + "  >>  player: " + player + "  >> nextPlayer: " + nextPlayer(playerNum) + "  >>  prevPlayer: " + prevPlayer(playerNum));
        if (playerNum != lead && player == lead) {
            console.log("ssocketFunctions -> cardPLayed EMPTY" + playerNum + "  :  " + player + "  |  " + lead);
            $(".plays").empty();
        } else {
            console.log("ssocketFunctions -> cardPLayed " + playerNum + "  :  " + player + "  |  " + lead);
        }

        othersPlayed(player, card);
        if (currentPlayer == lead) {
            leadSuit = card.charAt(0);
            // TODO: Change to card.rank & card.suit to allow use of getEuchreCardValue(card)
            if (gameConfig_euchreBowers && card.substr(1) == "11" && suitColors[leadSuit] == suitColors[trumpSuit]) {
                leadSuit = trumpSuit;
            }
        }
        if (nextPlayer(currentPlayer) == lead) {
            resolveTrick();
        }

        currentPlayer = nextPlayer(currentPlayer);

        $(".highlighted").removeClass("highlighted");
        if (currentPlayer == playerNum) {
            updateTurnIndicator("You!", true, false);
        } else {
            updateTurnIndicator(getNicknameForPlayer(currentPlayer), false, false);
        }

    });
    socketio.on('winnerOfRound', function (data) {
        var trickWinner = data.player;
        var trickCards = data.trickCards;
        roundNumber++;
        lead = trickWinner;
        currentPlayer = trickWinner;
        $(".highlighted").removeClass("highlighted");

        if (playerNum == currentPlayer) {
            updateTurnIndicator("You", true, true);
        } else {
            updateTurnIndicator(getNicknameForPlayer(lead), false, true);
        }
        console.log("[][][][][][][] winner of round: " + trickWinner + " cards:" + trickCards);
        var winnerIndex = inversePlayerIdMap[trickWinner];
        if (winnerIndex) {
            console.log("[][][][][][][] put trick in... loc" + winnerIndex + "stuff");
            addTrickWin("loc" + winnerIndex + "stuff", trickCards);
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
});

var path = window.location.pathname;
console.log("window.location.pathname: " + path);
// if(path.length==4){
//     console.log("AutoJoiner: "+path);             
//     $("#roomID").val(path);
//     joinRoom();
// }
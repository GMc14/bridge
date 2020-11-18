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
var gameConfig_startCardsPerPlayer; //-1 == Deal All
var gameConfig_numberOfRounds; //-1 == Play all cards in hand
var ranks;
var startPlayerCard;
var gameConfig_hasTasks;

const GameType = Object.freeze({
    CREW: Symbol("CREW"),
    BRIDGE: Symbol("BRIDGE"),
    EUCHRE: Symbol("EUCHRE")
});

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
    ranks = standardRanks;
    startPlayerCard = '';
    gameConfig_hasTasks = false;

    switch (gameType) {
        case GameType.CREW:
            bonusCards = crewBonusCards;
            gameConfig_permaTrumpSuit = 'R';
            ranks = crewRanks;
            startPlayerCard = crewStartCard;
            gameConfig_missions = crewMissions;
            gameConfig_hasTasks = true;
            break;
        case GameType.BRIDGE:
            gameConfig_hasTeams = true;
            gameConfig_bidForTrump = true;
            break;
        case GameType.EUCHRE:
            gameConfig_hasTeams = true;
            gameConfig_topDeckTrump = true;
            gameConfig_euchreBowers = true;
            ranks = euchreRanks;
            gameConfig_startCardsPerPlayer = 5;
            break;
        default:
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

    $('#restartGame').on('click', function () {
        console.log("[][][][][][][][][][]Need to ClearTrumpHighlights here?[][][][][][][][][][][]");
        socketio.emit('restartGame');
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

    socketio.on('leftInGame', function (nickname) {
        alert(nickname + " left the room. Kicking everybody out... ");
        window.location.reload();
    });
    socketio.on('startGame', function (playerCount) {
        setGameType(Symbol($("#gameDrop").val()));
        gameConfig_playerCount = playerCount;
        $("#playArea").show();
        console.log("client_socket :: startGame");
        preRenderImgs();
        clearSetupModule();
        $("#playersInRoom").hide();
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
        $(".setupModule").hide();

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
            addWin("loc" + winnerIndex + "stuff", trickCards);
            var winsId = "loc" + winnerIndex + "wins";
            var currentWins = Number($("#" + winsId).text());
            console.log("OOOOOOOOOOOOOOOOOOOOO}}}}}}}}}}}}  currentWins: " + currentWins);
            addWinText(winsId, currentWins + 1);
        } else {
            console.log("[][][][][][][] no bueno winner mustBeMe");
        }
        // if (gameConfig_hasTeams && gameConfig_playerCount == 4 && trickWinner == nextPlayer(nextPlayer(playerNum))) {
        //     tricksWon++;
        // }
        if (roundNumber == gameConfig_numberOfRounds) {
            calculateWinner();
        } else if (gameConfig_numberOfRounds == -1) {
            //TODO: check it any players still have card 
        }
    });
});

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
function getNicknameForPlayer(player) {
    var myPIndex = Number(player.slice(-1)) - 1;
    return playerNickNames[myPIndex];
}
function updateTurnIndicator(playerOnTurnName, isMe = false, isLead = false) {
    var spaces = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
    var commanderText = (gameType == GameType.CREW) ? "<b>Commander:</b> " + commanderName + spaces + "<b>" : "";
    $("#turnIndicator").html(commanderText + (isLead ? "To Lead" : "To Play") + ":</b> " + playerOnTurnName);
    if (isMe) {
        $("#myHand").addClass("highlighted");
        highlightPlayable();
    }
}
function clearSetupModule() {
    console.log("--------------clearSetupModule----------------");
    var setupModule = document.getElementsByClassName("setupModule")[0];
    while (setupModule.firstChild) {
        setupModule.removeChild(setupModule.firstChild);
    }
}
function addWinText(who, wins) {
    $("#" + who).text(wins);
}
function addWin(who, cards) {
    console.log("[][][][][][][] addWin: " + who + " cards:" + cards);
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
function calculateWinner() {
    var win = tricksWon < handsNeeded ? 0 : 1;
    if (win) {
        $('#winners').html('<b>WINNER:</b> YOU');
    } else {
        $('#winners').html('<b>WINNER:</b> NOT YOU');
    }
    $('#gameBid').html('<b>BID:</b> ' + currentBid + ' (' + currentBidder + ')');
    $('#wins').html('<b>YOU WON:</b> ' + tricksWon + ' tricks');
    refreshTeamWins(win);
    dealer = nextPlayer(dealer);
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
function constructPlayArea() {
    var clientNumber = Number(playerNum.slice(-1));
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
            console.log(">>>>>>>>>>>>>drpPlyrName selected ---------------- cardID:" + tempPNumber + " : " + shortName);
            socketio.emit('assignShortName', {
                playerNumber: tempPNumber,
                roomID: roomID,
                shortName: shortName
            });
        });
    }
    $.each(playerOptions, function () {
        $("#myDrpPlyrName").append('<option value="' + this + '">' + this + '</option>');
    });
    $("#myDrpPlyrName").change(function () {
        var playerNumber = playerNum.replace('Player', '');
        var shortName = $(this).val();
        console.log(">>>>>>>>>>>>>myDrpPlyrName selected ---------------- cardID:" + playerNumber + " : " + shortName);
        socketio.emit('assignShortName', {
            playerNumber: playerNumber,
            roomID: roomID,
            shortName: shortName
        });
    });
}

var path = window.location.pathname;
console.log("window.location.pathname: " + path);
// if(path.length==4){
//     console.log("AutoJoiner: "+path);             
//     $("#roomID").val(path);
//     joinRoom();
// }
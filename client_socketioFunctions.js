var socketio = io.connect();
var roomID;
var xoob;
//Meta
var playerNickNames = ['', '', '', '', '', '', '', ''];
var playerColors = ['#004499', '#770011', '#666600', '#116600', '#440099', '#883300', '#006666', '#660066'];

//Game Config
var gameConfig_playerCount = 3;
var gameConfig_startCardsPerPlayer = -1; //-1==Deal All
var gameConfig_numberOfRounds = gameConfig_startCardsPerPlayer; //Plya all cards in hand

var gameConfid_isCrew = true;
var gameConfig_permaTrumpSuit = gameConfid_isCrew ? "R" : '';
var crewBonusCards = new Array("R1", "R2", "R3", 'R4');
var bonusCards = gameConfid_isCrew ? crewBonusCards : [];
var crewMissions = [
    "_->_",
    "_->_ & _->_",
    "_->_ then _->_",
    "_->_ & _->_ & _->_",
    "_ must not win any tricks", //One player receives no tricks (Captain decides)
    "(_->_ then _->_) & _->_ & noone can communicate high/low/only (just show the card)",
    "(_->_ & _->_) then _->_",
    "_->_ then _->_ then _->_",
    "Someone->with a '1'",
    "_->_&_->_&_->_&_->_",
    "_->_then(_->_&_->_&_->_) & _can't communicate",
    "12***requires passing",
    "13 don't understand win with each rocket, seems trivial",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
]
var gameConfig_isBridge = false;
var gameConfig_bidForTrump = gameConfig_isBridge;
var gameConfig_hasTeams = gameConfig_isBridge;

var gameConfig_isEuchre = false;
var gameConfig_topDeckTrump = gameConfig_isEuchre;
var gameConfig_euchreBowers = gameConfig_isEuchre;


//Deck Setup
var deck = [];
var taskDeck = [];
var handSizes = [];

var suits = new Array("C", "D", "H", "S");
var suitNames = {
    "C": "Clubs",
    "D": "Diamonds",
    "H": "Hearts",
    "S": "Spades",
    "R": "Rockets"
}
var suitColors = {
    "C": "Black",
    "S": "Black",
    "H": "Red",
    "D": "Red"
}

var standardRanks = new Array(2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14);
var euchreRanks = new Array(9, 10, 11, 12, 13, 14);
var crewRanks = new Array(1, 2, 3, 4, 5, 6, 7, 8, 9);
var crewStartCard = 'R4';
var startPlayerCard = '';
var ranks = standardRanks;
if (gameConfig_isEuchre) {
    ranks = euchreRanks;
    gameConfig_startCardsPerPlayer = 5;
} else if (gameConfid_isCrew) {
    ranks = crewRanks;
    startPlayerCard = crewStartCard;
}
var cardback = "card_imgs/cardback.png";

//Player values
var nickname;
var remainingPlayers;
var playerNum;
var playerIndex;

//Play values
var dealer = "Player1";
var currentPlayer;
var lead;
var leadSuit;
var trumpSuit;
var tricksWon = 0;
var roundNumber = 0;
var handsNeeded;

$(function () {
    $("#tokenQmark").click(function () {
        console.log("show THINGSSSS");
        $("#tokenLegend").toggle();
    });
    $("#tokenLegend").click(function () {
        $("#tokenLegend").hide();
    });
    $("#tokenLegend").hide();
    console.log("auto join room...");
    joinRoom();
    $('#drawTask').on('click', function () {
        if (taskDeck.length > 0) {
            taskDeck = getShuffled(taskDeck);
            socketio.emit('drawTask', taskDeck.pop());
        } else {
            alert("No Tasks Available");
        }
    });
    $('#hideTasks').on('click', function () {
        socketio.emit('hideTasks');
    });
    $('#restartGame').on('click', function () {
        socketio.emit('restartGame');
    });
    $("#roomForm").on('submit', function (e) {
        e.preventDefault();
        joinRoom();
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
    socketio.on('wait4Players', function (numPlayers) {
        if (numPlayers < gameConfig_playerCount) {
            waitRoom(numPlayers);
        } else {
            playerModule();
        }
    });
    socketio.on('fullRoom', function (data) {
        clearSetupModule();
        $(".setupModule:eq(0)").html("Room is Full. Try Again Later");
    })
    socketio.on('playerDataToClient', function (data) {
        var nickname = data.nickname;
        var playerIndex = data.playerIndex;
        remainingPlayers = data.remainingPlayers;

        console.log("playerDataToClient---- >> playerIndex: " + playerIndex + "  >> nickname: " + nickname + "  >>  remainingPlayers: " + remainingPlayers);
        $("#btnPlayer" + playerIndex).remove();
        playerNickNames[playerIndex - 1] = nickname;
    });
    socketio.on('leftInGame', function (nickname) {
        alert(nickname + " left the room. Kicking everybody out... ");
        window.location.reload();
    });
    socketio.on('startGame', function () {
        $("#playArea").show();
        console.log("client_socket :: startGame");
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

        startGame();
    });
    socketio.on('drawTask', function (card) {
        displayTrumpCard(card);
    });
    socketio.on('hideTasks', function (card) {
        $("#showCase").empty();
        $("#showCase").hide();
    });
    socketio.on('some1Bid', function (data) {
        passCount = 0;
        currentBidder = nextPlayer(currentBidder);
        currentBid = data.bid;
        otherColor = data.color;
        $('#' + data.bid).trigger('click');
        if (playerNum == currentBidder) {
            alert("Your Turn to Bid");
        }
    });
    socketio.on('some1Passed', function () {
        passCount++;
        if (passCount == 4) {
            $('#bidOfRound').html('<b>' + currentBidder + ": " + currentBid + '</b>');
            trumpSuit = currentBid.charAt(1);
            if (playerNum == currentBidder || playerNum == nextPlayer(nextPlayer(currentBidder))) {
                handsNeeded = 6 + Number(currentBid.charAt(0));
            } else {
                handsNeeded = 14 - (6 + Number(currentBid.charAt(0)));
            }
            currentPlayer = nextPlayer(currentBidder);
            lead = currentPlayer;
            $('#bidArea').hide();
            if (playerNum == currentPlayer) {
                alert("You lead");
                $("#turnIndicator").text("Your Turn");
                $("#myHand").addClass("highlighted");
            }
            $('#bidOfRound').show();
        } else {
            currentBidder = nextPlayer(currentBidder);
            if (playerNum == currentBidder) {
                alert("Your Turn to Bid");
            }
        }
    });
    socketio.on('cycleClientOrderIcon', function (data) {
        console.log("--------------cycleClientOrderIcon----------------data.cardID " + data.cardID + ",  data.icon: " + data.icon);
        setTrumpCardOrderIcon(data.cardID, data.icon);
    });
    socketio.on('cycleClientOrderAssignee', function (data) {
        console.log("--------------cycleClientOrderAssignee----------------data.cardID " + data.cardID + ",  data.player: " + data.player);
        setTrumpCardAssignee(data.cardID, data.player);
    });
    socketio.on('dealToClients', function (data) {
        xoob = data;
        console.log("--------------dealToClients---------------- " + JSON.stringify(data, null, 4));
        console.log("--------------dealToClients---------------- playerNum: " + playerNum);
        $("#tokenQmark").click(function () {
            $("#tokenLegend").show();
        });
        $("#tokenLegend").click(function () {
            $("#tokenLegend").hide();
        });
        $("#tokenLegend").hide();
        var myPIndex = Number(playerNum.slice(-1)) - 1;
        myHandOfCards = data.hands[myPIndex];

        for (var i = 0; i < data.hands.length; i++) {
            handSizes[i] = data.hands[i].length;
        }
        sortHand();
        displayCards();
        $("#showCase").empty();

        $(".setupModule").hide();
        if (gameConfig_bidForTrump) {
            currentBidder = nextPlayer(dealer);
            listenToBids();
            $("#bidArea").show();
            if (playerNum == currentBidder) {
                alert("Your Turn to Bid");
            }
        } else {
            if (data.trumpCard) {
                console.log("------- Trump Card: " + data.trumpCard);
                displayTrumpCard(data.trumpCard)
                trumpSuit = data.trumpCard.suit;
            } else {
                trumpSuit = gameConfig_permaTrumpSuit;
            }

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

            if (playerNum == currentPlayer) {
                $("#turnIndicator").text("Your lead!");
                $("#myHand").addClass("highlighted");
            } else {
                $("#turnIndicator").text(getNicknameForPlayer(lead) + "  leads");
                $(".highlighted").removeClass("highlighted");
            }
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
            if (gameConfig_euchreBowers && card.substr(1) == "11" && suitColors[leadSuit] == suitColors[trumpSuit]) {
                leadSuit = trumpSuit;
            }
        }
        if (nextPlayer(currentPlayer) == lead) {
            resolveTrick();
        }

        currentPlayer = nextPlayer(currentPlayer);
        if (currentPlayer == playerNum) {
            $("#turnIndicator").text("Your Turn");
            $("#myHand").addClass("highlighted");
        } else {
            $("#turnIndicator").text(getNicknameForPlayer(currentPlayer) + "'s Turn");
            $(".highlighted").removeClass("highlighted");
        }
    });
    socketio.on('winnerOfRound', function (trickWinner, trickCards) {
        roundNumber++;
        lead = trickWinner;
        currentPlayer = trickWinner;
        if (playerNum == currentPlayer) {
            $("#turnIndicator").text("Your lead!");
            $("#myHand").addClass("highlighted");
        } else {
            $("#turnIndicator").text(getNicknameForPlayer(lead) + "  leads");
            $(".highlighted").removeClass("highlighted");
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
        if (gameConfig_isBridge && gameConfig_playerCount == 4 && trickWinner == nextPlayer(nextPlayer(playerNum))) {
            tricksWon++;
        }
        if (roundNumber == gameConfig_numberOfRounds) {
            calculateWinner();
        } else if (gameConfig_numberOfRounds == -1) {
            //TODO: check it any players still have card 
        }
    });
    socketio.on('message', function (data) {
        var msg = data.msg;
        var nickname = data.nickname;
        var chatBox = $("#chatBox");
        var textBox = $("#msgBox");
        textBox.append("<span><b>" + nickname + ":</b>&emsp;" + msg + "</span><br><br>");
        scrollToBottom();
        $('#boxBottom').show();
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

function clearSetupModule() {
    console.log("--------------clearSetupModule----------------");
    var setupModule = document.getElementsByClassName("setupModule")[0];
    while (setupModule.firstChild) {
        setupModule.removeChild(setupModule.firstChild);
    }
}

function joinRoom() {
    roomID = $("#roomID").val();
    remainingPlayers = gameConfig_playerCount;
    if (roomID == '') {
        alert('RoomID must be 1-4 characters long');
    } else {
        socketio.emit('create', roomID);
        clearSetupModule();
        var roomText = document.createElement("span");
        roomText.setAttribute("id", "roomText");
        roomText.appendChild(document.createTextNode("Room Code: " + roomID));
        $("#topbar").prepend(roomText);
        $("#leaveRoom").show();
    }
}

function leaveRoom() {
    socketio.emit('leave', roomID);
    $("#leaveRoom").hide();
    // $("#roomText").remove();
    // clearSetupModule();
    // roomModule();
    window.location.reload();
}

function waitRoom(num) {
    clearSetupModule();
    $(".setupModule:eq(0)").html("<div class='loading'>Current Players in Room: " + num + " <br> Waiting for Players</div>");
}

function playerModule() {
    console.log("--------------playerModule----------------");
    clearSetupModule();
    var playerSetup = document.createElement("div");
    playerSetup.setAttribute("id", "playerSetup");

    var nickname = document.createElement("input");
    nickname.setAttribute("type", "text");
    nickname.setAttribute("id", "nickname");
    var span1 = document.createElement("span");
    span1.appendChild(document.createTextNode("NICKNAME:"));

    var teamInfo = '';
    if (gameConfig_isBridge || gameConfig_hasTeams) {
        teamInfo = "(TEAMS: 1 & 3 and 2 & 4)"
    }
    var span2 = document.createElement("span");
    span2.appendChild(document.createTextNode("SELECT PLAYER: " + teamInfo));
    playerSetup.appendChild(span2);

    playerSetup.appendChild(span1);
    playerSetup.appendChild(document.createElement("br"));
    playerSetup.appendChild(nickname);
    playerSetup.appendChild(document.createElement("br"));
    playerSetup.appendChild(document.createElement("br"));

    for (var j = 1; j <= gameConfig_playerCount; j++) {
        var currPlayer = document.createElement("input");
        currPlayer.setAttribute("type", "button");
        currPlayer.setAttribute("id", "btnPlayer" + j);
        currPlayer.setAttribute("data-player-number", j);
        currPlayer.setAttribute("class", "playerBtns");
        currPlayer.setAttribute("value", "Player" + j);

        playerSetup.appendChild(document.createElement("br"));
        playerSetup.appendChild(currPlayer);
    }
    $(".setupModule:eq(0)").append(playerSetup);
    playerSelect();
}

function playerSelect() {
    $(".playerBtns").on("click", function () {
        console.log("--------------playerBtns Click----------------");
        playerNum = $(this).val();
        nickname = String($("#nickname").val());
        playerIndex = Number($(this).attr("data-player-number"));
        console.log("playerSelect >> playerNum: " + playerNum + "  >> nickname: " + nickname + "  >>  playerIndex: " + playerIndex);
        if (nickname == '' || playerNickNames.indexOf(nickname) > -1) {
            alert('Pick a unique Nickname!');
        } else {
            $("#playerSetup").hide();
            $(".setupModule:eq(0)").html("<div class='loading'>Waiting for Teams</div>");
            var boldNames = document.createElement("b");
            boldNames.appendChild(document.createTextNode(playerNum + ': ' + nickname));
            $("#myName").append(boldNames);
            remainingPlayers--;

            console.log("--------------playerBtns emit selPlayer...----------------");
            socketio.emit('selPlayer', {
                nickname: nickname,
                playerNum: playerNum,
                playerIndex: playerIndex,
                roomID: roomID,
                remainingPlayers: remainingPlayers
            });
            //TODO: show chat if want to use it $('#chat').show();
            playerColor = playerColors[playerIndex - 1];

        }
    });
}

function addWinText(who, wins) {
    $("#" + who).text(wins);
}
var hovering = false;

function addWin(who, cards) {
    console.log("[][][][][][][] addWin: " + who + " cards:" + cards);
    var card = document.createElement("div");
    card.setAttribute('class', 'otherCards');
    card.setAttribute('data-cards', cards);
    $(".cardback:eq(0)").clone().show().appendTo(card);
    var stuff = $('#' + who);
    $(stuff).append(card);
    $(stuff).hover(
        function () {
            if (!hovering) {
                hovering = true;
                $($(this).children()[0]).attr("data-cards").split(',');
                console.log("stuff hover...");
                var trickDetailsDiv = $("<div id='trickDetails'></div>");
                $(this).children().each(function () {
                    console.log("Stuff Child:  " + $(this).attr("data-cards"));
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
            console.log("stuff UNhover...");
            $("#trickDetails").remove();
            hovering = false;
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

function scrollToBottom() {
    var divObj = $("#msgBox");
    divObj.scrollTop($(divObj)[0].scrollHeight);
}
var playerIdMap = [];
var inversePlayerIdMap = [];

function constructPlayArea() {
    var clientNumber = Number(playerNum.slice(-1));
    for (var j = 1; j < gameConfig_playerCount; j++) {
        var stuff = $('<div alt="loc' + j + 'stuff" id="loc' + j + 'stuff" class="stuff"></div>');
        var plays = $('<div alt="loc' + j + 'play" id="loc' + j + 'play" class="plays"></div>');
        var name = $('<div alt="loc' + j + 'name" id="loc' + j + 'name" class="name"></div>');
        var winCounter = $('<div alt="loc' + j + 'wins" id="loc' + j + 'wins" class="winCount">0</div>');
        var playerHand = $('<div alt="loc' + j + 'Hand" class="otherPlayerHand" id="loc' + j + 'Hand" ></div>');
        var playerContainer = $("<div alt='loc" + j + "Container' id='loc" + j + "Container' class='locationContainer'></div>");

        $(playerContainer).append(playerHand);
        $(playerContainer).append(stuff);
        $(playerContainer).append(plays);
        $(playerContainer).append(name);
        $(playerContainer).append(winCounter);

        $("#gameBoard").append(playerContainer);

        var positionRelativeToCenter = j - ((gameConfig_playerCount) / 2);
        $(playerContainer).css({
            "left": ((j - 1) * 90 / (gameConfig_playerCount - 1) + 15.5) + "vw",
            "top": "12vh",
            "transform": "rotate(" + positionRelativeToCenter * 15 + "deg) translateY(" + Math.abs(positionRelativeToCenter) * 4 + "vmax)"
        });

        var pNumber = Number((clientNumber + j - 1) % gameConfig_playerCount) + 1;
        playerIdMap[j] = 'Player' + pNumber;
        inversePlayerIdMap['Player' + pNumber] = j;
        $("#loc" + j + "name").html('Player' + pNumber + ': ' + playerNickNames[pNumber - 1]);
    }
}

function rotate($el, degrees) {
    $el.css({
        '-webkit-transform': 'rotate(' + degrees + 'deg)',
        '-moz-transform': 'rotate(' + degrees + 'deg)',
        '-ms-transform': 'rotate(' + degrees + 'deg)',
        '-o-transform': 'rotate(' + degrees + 'deg)',
        'transform': 'rotate(' + degrees + 'deg)',
        'zoom': 1

    });
}

function getNicknameForPlayer(player) {
    var myPIndex = Number(player.slice(-1)) - 1;
    return playerNickNames[myPIndex];
}
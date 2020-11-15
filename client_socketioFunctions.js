var socketio = io.connect();
var roomID;
var xoob;
//Meta
var playerNickNames = ['', '', '', '', '', '', '', ''];
var playerColors = ['#004499', '#770011', '#666600', '#116600', '#440099', '#883300', '#006666', '#660066'];

//Game Config
var gameConfig_playerCount = 1;
var gameConfig_startCardsPerPlayer = -1; //-1==Deal All
var gameConfig_numberOfRounds = gameConfig_startCardsPerPlayer; //Plya all cards in hand
var isGameMaster = false;
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
var commanderName;
//Player values
var nickname;
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

let codeCandidates = "234689ABCEFJKMNPQRTVWXY"
var playerModuleIsShowing = false;
var hovering = false;
var playerIdMap = [];
var inversePlayerIdMap = [];

$(function () {
    $("#tokenQmark").click(function () {
        console.log("show THINGSSSS");
        $("#tokenLegend").toggle();
    });
    $("#tokenLegend").click(function () {
        $("#tokenLegend").hide();
    });
    $('#drawTask').on('click', function () {
        if (taskDeck.length > 0) {
            taskDeck = getShuffled(taskDeck);
            socketio.emit('drawTask', taskDeck.pop());
        } else {
            alert("No Tasks Available");
        }
    });
    $('#chooseTask').on('click', function () {
        taskDeck = getSorted(taskDeck);
        var previousSuit;
        $.each(taskDeck, function (index, trumpCard) {

            var cardRank = String(trumpCard.rank);
            var cardSuit = String(trumpCard.suit);
            var cardID = cardSuit + cardRank;
            var cardObj = $("#" + cardID + "_img").clone().show();
            $(cardObj).attr('task-index', index);
            $(cardObj).addClass('potentialTask');
            if (previousSuit && previousSuit != cardSuit) {
                $("#taskOptions").append("<br/>");
            }
            $("#taskOptions").append(cardObj);
            previousSuit = cardSuit;
        });
        $(".potentialTask").click(function () {
            var selectedCardIndex = $(this).attr("task-index");
            console.log("emitting " + JSON.stringify(taskDeck[selectedCardIndex]) + " base on " + selectedCardIndex);
            socketio.emit('drawTask', taskDeck[selectedCardIndex]);
            taskDeck.splice(selectedCardIndex, 1);
            $("#taskOptions").empty();
        });
    });
    $('#hideTasks').on('click', function () {
        createDeck(true);
        socketio.emit('hideTasks');
    });
    $('#restartGame').on('click', function () {
        console.log("[][][][][][][][][][]Need to ClearTrumpHighlights here?[][][][][][][][][][][]");
        socketio.emit('restartGame');
    });
    $("#joinRoomForm").on('submit', function (e) {
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
    $("#myCommunication").click(function () {
        updateComms(new Date().getTime() % 3);
    });
    socketio.on('updateRoom', function (room) {
        console.log("--------updateRoom-----------"+JSON.stringify(room));
        clearSetupModule();
        playerModule();
        var standingPlayersHTMLString = "Waiting for... <br />";
        $.each(room.players,function(){
            var nickname = this.nickname;
            var seatIndex = room.seats.indexOf(this.id);
            if(seatIndex>-1){
                if(this.nickName > 0){
                    this.nickName = this.id;
                }
                standingPlayersHTMLString = standingPlayersHTMLString.concat(this.nickName);
                standingPlayersHTMLString = standingPlayersHTMLString.concat("<br />"); 
            } else {
                addSeatToTable(seatIndex);
                $("#btnPlayer" + seatIndex).val(nickname);
                $("#btnPlayer" + seatIndex).prop('disabled', true);
                playerNickNames[seatIndex - 1] = nickname;
            }
        });
        $("#playersInRoom").html(standingPlayersHTMLString);
        gameConfig_playerCount = playerCount;
    });
    socketio.on('fullRoom', function () {
        console.log("--------fullRoom-----------");
        alert("Room is Full. Try Again Later");
    });
    socketio.on('makeGameMaster', function () {
        console.log("--------makeGameMaster-----------");
        isGameMaster = true;
    });
    socketio.on('leftInGame', function (nickname) {
        alert(nickname + " left the room. Kicking everybody out... ");
        window.location.reload();
    });
    socketio.on('startGame', function (playerCount) {
        gameConfig_playerCount = playerCount;
        $("#playArea").show();
        console.log("client_socket :: startGame");
        preRenderImgs();
        clearSetupModule();
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
    socketio.on('drawTask', function (card) {
        console.log("--------------drawTask----------------card" + JSON.stringify(card));
        displayTrumpCard(card);
    });
    socketio.on('hideTasks', function () {
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
                updateTurnIndicator("You", true, true);
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
    socketio.on('assignShortNameToClients', function (data) {
        console.log("--------------assignShortNameToClients----------------data.playerNumber " + data.playerNumber + ",  data.shortName: " + data.shortName);
        setPlayerShortName(data.playerNumber, data.shortName);
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
            $(".highlighted").removeClass("highlighted");
            if (playerNum == currentPlayer) {
                updateTurnIndicator("You", true, true);
            } else {
                updateTurnIndicator(getNicknameForPlayer(lead), false, true);
            }
            var leaderNum = inversePlayerIdMap[lead];
            commanderName = getNicknameForPlayer(lead);
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
        var trickCards=  data.trickCards;
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
    console.log("--------joinRoom-----------");
    roomID = $("#roomID").val();
    while (roomID.length < 4) {
        roomID = roomID.concat(codeCandidates.charAt(Math.floor(Math.random() * codeCandidates.length)));
    }
    roomID = roomID.toUpperCase()
    socketio.emit('enterRoom', roomID);
    clearSetupModule();
    var roomText = document.createElement("span");
    roomText.setAttribute("id", "roomText");
    roomText.appendChild(document.createTextNode("Room Code: " + roomID));
    $("#topbar").prepend(roomText);
    $("#leaveRoom").show();
}

function leaveRoom() {
    socketio.emit('leaveRoom', roomID);
    $("#leaveRoom").hide();
    // $("#roomText").remove();
    // clearSetupModule();
    // roomModule();
    window.location.reload();
}

function isOkayToStartTheGame() {
    var lowestOpen = 999;
    var highestReadied = 0;
    $('.playerBtns').each(function () {
        var number = Number($(this).data("player-number"));
        var isReadied = $(this).prop("disabled");
        console.log("P#:" + number);
        if (isReadied && number > highestReadied) {
            highestReadied = number;
        }
        if (!isReadied && number < lowestOpen) {
            lowestOpen = number;
        }
    });
    var isOkay = lowestOpen > highestReadied;
    console.log("LO: " + lowestOpen + "   HR: " + highestReadied + "  okay? " + isOkay);
    return isOkay;
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

function getNicknameForPlayer(player) {
    var myPIndex = Number(player.slice(-1)) - 1;
    return playerNickNames[myPIndex];
}

function updateTurnIndicator(playerOnTurnName, isMe = false, isLead = false) {
    $("#turnIndicator").html("<b>Commander</b>: " + commanderName + "    <b>" + (isLead ? "To Lead" : "On Duty") + "</b>: " + playerOnTurnName);
    if (isMe) {
        $("#myHand").addClass("highlighted");
        highlightPlayable();
    }
}

function updateComms(status) {
    if (status == 1) {
        $("#myCommunication").html('mic_none');
    } else if (status == 2) {
        $("#myCommunication").html('mic_off');
    } else {
        $("#myCommunication").html('mic');
    }
}
var path =window.location.pathname;
console.log("window.location.pathname: "+path);
// if(path.length==4){
//     console.log("AutoJoiner: "+path);             
//     $("#roomID").val(path);
//     joinRoom();
// }
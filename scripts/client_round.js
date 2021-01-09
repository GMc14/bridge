const lastModifiedString7 = ("Last modified: 2021/01/09 02:25:12");
const roundTS = lastModifiedString7.replace("Last ", "").replace("modified: ", "");
console.log("client_round.js " + lastModifiedString7);

function winnerOfRound(data) {
    var trickWinner = data.player;
    var trickCardIDs = data.trickCards;
    roundNumber++;
    lead = trickWinner;
    currentPlayer = trickWinner;
    endRound();
    updateTurnIndicator(lead, client_playerNumString == currentPlayer, true);

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
    // if (gameConfig_hasTeams && gameConfig_playerCount == 4 && trickWinner == getNextPlayerName(getNextPlayerName(client_playerNumString))) {
    //     tricksWon++;
    // }
    if (roundNumber == gameConfig_numberOfRounds) {
        calculateGameWinner();
    } else if (gameConfig_numberOfRounds == -1) {
        //TODO: check it any players still have card 
    }
}

function endRound() {
    console.log("remove highlighted");
    $(".highlighted").removeClass("highlighted");
}
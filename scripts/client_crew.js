const lastModifiedString2 = ("Last modified: 2020/11/26 17:13:07");
const crewTS=lastModifiedString2.replace("Last ","").replace("modified: ","");
console.log("client_crew.js "+lastModifiedString2);

const crewRanks = new Array(1, 2, 3, 4, 5, 6, 7, 8, 9);
const crewBonusCards = new Array("R1", "R2", "R3", 'R4');
const crewStartCard = 'R4';
const crewMissions = [
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
];
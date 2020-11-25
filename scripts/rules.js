var rulesFrame = "#rulesFrame"; 


$( document ).on( 'keydown', function ( e ) {
	if (e.keyCode === 27) { // ESC
		console.log("common/rules esc hideRules");
		$(rulesFrame).hide();
	}
});
$('html').click(function() {
	console.log("common/rules hideRules");
	$(rulesFrame).hide();
});
$(rulesFrame).click(function(event){
	event.stopPropagation();
});
$("#rules").click(function(event){
	event.stopPropagation();
});
$("#rulesButton").click(function(event){
	event.stopPropagation();
});

function showRules(){
	console.log("common/rules showRules");
	$(rulesFrame).show();
}
function goToRules(filePathOverride) {
	console.log("common/rules goToRules");
	var win;
	if(filePathOverride){
		win = window.open(filePathOverride, '_blank');
	} else {
		win = window.open('./files/rules.pdf', '_blank');
	}

	win.focus();
}

$("body").append('<iframe id="rulesFrame" title="Game Rules" src="./files/rules.pdf"></iframe>');
document.getElementById('rulesFrame').style.cssText = 'position:absolute;top:2vh;left:2vw;display:none;width:96vw;height:96vh;'
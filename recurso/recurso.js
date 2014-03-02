"use strict"

var recurso;
var init = function(tiles){
    console.log("called with "+tiles)
    if ( (! !!window.parentCallback) && (! !!window.globals) ){
        console.error("parentCallback or globals were not passed into the window!");
    } else {
        recurso = new Recurso(window.globals.playerNames, tiles);
        initWindow();
    }
}

var playTurnButton, autoPlayButton;
var initWindow = function(){
    playTurnButton = document.getElementById("playTurn");
    playTurnButton.onclick = function(){recurso.playTurn();};

    autoPlayButton = document.getElementById("autoPlay");
    autoPlayButton.onclick = function(){onAutoPlay();};
    
    recurso.displayGame();
}

var autoSpeed = 200;
var timeOut;
var isAutoPlaying = false;
var onAutoPlay = function(){
    isAutoPlaying = true;
    clearTimeout(timeOut);
    recurso.playTurn();
    timeOut = setTimeout(onAutoPlay, autoSpeed);
}


var diceRoll = function(){
    return Math.ceil(Math.random()*6)
}

var makePlayerArray = function(names){
    var l = [];
    for (var i = 0; i < names.length; ++i){
        l.push({name:names[i], tile: 0});
    }
    return l;
}

// RECURSO ///////////////////////////////////////////////

var Recurso = function(playerNames, tiles) {
    this.playerNames = playerNames;
    this.players = makePlayerArray(playerNames);
    this.tiles = parseInt(tiles);
    this.currentTurn = 0;
    
    this.isRecursoGameActive = false;
};

Recurso.prototype = {
    constructor: Recurso,
    playTurn: function(){
        if (this.isRecursoGameActive){
            // recurso game in progress: do not play turn
            return;
        }
        globals.incrementMoves();

        var p = this.players[this.currentTurn];
        var roll = diceRoll();
        p.tile += roll;

        if (p.tile >= this.tiles-1){
            this.onGameEnd();
            return;
        }

        document.getElementById("rollResult").textContent = this.players[this.currentTurn].name + " rolled a " + roll + "!";
        this.displayGame();

        if (p.tile != 0 && p.tile % 2 != 0){
            this.onChallenge();
            // note that currentTurn is not incremented in this case
            // the result of the challenge determines whether or not the player gets to roll twice
            return;
        }
        
        this.currentTurn = (this.currentTurn+1) % this.players.length;
    },
    onGameEnd: function(){
        console.log(this.players[this.currentTurn].name + " won");
        parentCallback({winner: this.currentTurn, winnerName: this.players[this.currentTurn].name});
        window.close();
    },
    onChallenge: function(){
        document.getElementById("lastEvent").textContent = (this.players[this.currentTurn].name + " set off a challenge square!");
        globals.addInstances(1);
        globals.incrementTotalInstances();

        this.isRecursoGameActive = true;

        var childWindow = window.open("index.html", "Recurso #"+globals.totalInstances, "width=300, height=400");
        childWindow.window.globals = globals;
        childWindow.window.parentCallback = function(results){recurso.childCallback(results);};
        var tileAm = this.tiles;
        childWindow.window.onload = function(){
            childWindow.window.init(tileAm-1);
            childWindow.document.title = "Recurso #"+globals.totalInstances;
            
            if (isAutoPlaying){
                childWindow.window.isAutoPlaying = true;
                childWindow.window.onAutoPlay();
            }
        };

    },
    childCallback: function(results){
        if (results.winner === -1){
            document.getElementById("lastEvent").textContent = "challenge board size <3, ignored.";
            return;
        }
        if (results.winner != this.currentTurn){
            this.currentTurn = (this.currentTurn+1)%this.players.length;
        }
        globals.addInstances(-1);
        this.isRecursoGameActive = false;
        document.getElementById("lastEvent").textContent = results.winnerName + " won the challenge!";
        this.displayGame();
    },
    displayGame: function(){
        document.getElementById("boardState").textContent = this.toString();
    },
    toString: function(){
        var s = "";

        s += "< ";
        for (var i = 0; i < this.players.length; ++i){
            if (this.players[i].tile === 0){
                    s += (i+1) + " ";
            }
        }
        s += ">";

        for (var j = 1; j < this.tiles-1; ++j){
            s += (j%2 === 0) ? "{ " : "[ ";
            for (var k = 0; k < this.players.length; ++k){
                if (this.players[k].tile === j){
                    s += (k+1) + " ";
                }
            }
            s += (j%2 === 0) ? "}" : "]";
        }

        s += "< ";
        for (var i = 0; i < this.players.length; ++i){
            if (this.players[i].tile === this.tiles-1){
                    s += (i+1) + " ";
            }
        }
        s += ">";

        return s;
    }
};

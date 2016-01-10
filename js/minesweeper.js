/*
	Minesweeper constructor
*/

function Minesweeper(config) {
	// config
	this.width = config.width || 9;
	this.height = config.height || 9;
	this.numCells = this.width * this.height;
	this.numMines = config.numMines || Math.floor(
		// (Math.sqrt(this.numCells) + 0.25 * this.numCells) / 2
		0.15 * this.numCells
	);

	// for subscribable.js
	this.subscribers = {};

	// state variables
	this.numFlagged = 0;
	this.numRevealed = 0;

	// generate a data object for each cell
	this.cellObjs = [];
	this.generateCells();

	// set mines randomly in cellObjs
	this.setupMines();
}




/*
	Minesweeper methods
*/

// Eventing with subscribable.js: https://github.com/Daniel-Hug/subscribable.js
//
// Subscribe to events with Minesweeper.prototype.on():
//
//  - .on('win', function(event){})
//  - .on('cellExplode', function(event, explodedCell){})
//  - .on('cellFlagToggle', function(event, cell){})
//  - .on('cellReveal', function(event, cell){})
Minesweeper.prototype = new Subscribable();


Minesweeper.prototype.generateCells = function generateCells() {
	for (var i = this.numCells; i--;) {
		this.cellObjs.push(new Cell(this));
	}
};


Minesweeper.prototype.setupMines = (function() {
	function randomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	return function setupMines() {
		var nonMines = this.cellObjs.slice(0);
		var mines = [];

		// place mines
		for (var i = 0; i < this.numMines; i++) {
			// place a mine randomly on a cell without a mine
			var mineI = randomInt(0, this.numCells - 1 - i);
			nonMines[mineI].isMine = true;

			// update arrays: mines and nonMines
			mines.push(nonMines[mineI]);
			nonMines.splice(mineI, 1);
		}

		// get indices of mines
		this.setupNumbers(mines);
	};
})();


// increment cell.numAdjMines for each adjacent mine
Minesweeper.prototype.setupNumbers = function setupNumbers(mines) {
	function incrementNumAdj(cell) {
		cell.numAdjMines++;
	}

	mines.forEach(function(mine) {
		return mine.getAdj().forEach(incrementNumAdj);
	});
};




/*
	Cell constructor
*/

function Cell(game) {
	if (!(this instanceof Cell)) return new Cell(game);
	this.game = game;
	this.isRevealed = false;
	this.isMine = false;
	this.isFlagged = false;
	this.numAdjMines = 0;
}




/*
	Cell methods
*/

Cell.prototype.toggleFlag = function toggleCellFlag(event) {
	this.isFlagged = !this.isFlagged;

	// update game.numFlagged
	if (this.isFlagged) {
		this.game.numFlagged++;
	} else {
		this.game.numFlagged--;
	}
	this.game.trigger('cellFlagToggle', this);
};


Cell.prototype.reveal = (function() {
	function revealCell(cell) {
		if (cell.isRevealed) return;
		
		// set revealed state
		cell.isRevealed = true;
		cell.game.numRevealed++;
		cell.game.trigger('cellReveal', cell);

		// You win when all non-mine cells are revealed
		if (cell.game.numRevealed === cell.game.numCells - cell.game.numMines) {
			cell.game.trigger('win');
		}

		// if no adjacent mines
		if (cell.numAdjMines === 0) {

			// reveal adjacent cells
			cell.getAdj().forEach(revealCell);
		}
	};

	return function explodeOrRevealCell() {
		if (this.isMine) {
			this.game.trigger('cellExplode', this);
		} else {
			revealCell(this);
		}
	};
})();


// i is the index of a cell in a width*height grid
// returns array containing the index of each adjacent cell in that grid
Cell.prototype.getAdj = function getAdjCells() {
	var cell = this;
	var game = cell.game;
	var width = game.width;
	var height = game.height;
	var i = game.cellObjs.indexOf(cell);

	// x and y coordinates of cell in grid (starts at 0,0)
	var xy = {
		x: i % width,
		y: Math.floor(i / width)
	};

	// coordinates of adjacent cells
	var adjacentCells = [
		{ x: xy.x - 1, y: xy.y     }, // left
		{ x: xy.x + 1, y: xy.y     }, // right
		{ x: xy.x    , y: xy.y - 1 }, // top
		{ x: xy.x    , y: xy.y + 1 }, // bottom
		{ x: xy.x - 1, y: xy.y - 1 }, // top left
		{ x: xy.x + 1, y: xy.y - 1 }, // top right
		{ x: xy.x - 1, y: xy.y + 1 }, // bottom left
		{ x: xy.x + 1, y: xy.y + 1 }, // bottom right
	];

	function validXy(xy) {
		return xy.x >= 0 && xy.x < width && xy.y >= 0 && xy.y < height;
	}

	// return adjacent cells that exist in grid
	return adjacentCells.filter(validXy).map(function(xy) {
		var i = xy.y * width + xy.x;
		return game.cellObjs[i];
	});
};
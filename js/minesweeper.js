/*
	helper functions
*/

function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function renderMultiple(arr, renderer, parent) {
	var docFrag = document.createDocumentFragment();
	[].map.call(arr, renderer).forEach(function(el) {
		docFrag.appendChild(el);
	});
	parent.appendChild(docFrag);
}




/*
	Minesweeper constructor
*/

function Minesweeper(config) {
	// config
	this.width = config.width || 9;
	this.height = config.height || 9;
	this.field = config.field;
	this.numCells = this.width * this.height;
	this.numMines = config.numMines || Math.floor(
		// (Math.sqrt(this.numCells) + 0.25 * this.numCells) / 2
		0.15 * this.numCells
	);
	this.numFlagged = 0;
	this.numRevealed = 0;

	// generate a data object for each cell
	this.cellObjs = [];
	this.generateCells();

	// set mines randomly around field
	this.setupMines();

	// render minefield
	this.field.style.width = 24 * this.width + 'px';
	renderMultiple(this.cellObjs, function(cell) {
		return cell.render();
	}, this.field);
}




/*
	Minesweeper methods
*/

Minesweeper.prototype.generateCells = function generateCells() {
	for (var i = this.numCells; i--;) {
		this.cellObjs.push(new Cell(this));
	}
};


Minesweeper.prototype.setupMines = function setupMines() {
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


// increment cell.numAdjMines for each adjacent mine
Minesweeper.prototype.setupNumbers = function setupNumbers(mines) {
	function incrementNumAdj(cell) {
		cell.numAdjMines++;
	}

	mines.forEach(function(mine) {
		return mine.getAdj().forEach(incrementNumAdj);
	});
};


Minesweeper.prototype.win = function winGame(i) {
	console.log('You win!');
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
	this.element = null;
}




/*
	Cell methods
*/

// returns <li>
Cell.prototype.render = function renderCell() {
	var cell = this;
	var li = document.createElement('li');

	if (cell.isMine) {
		li.classList.add('mine');
	}

	if (!cell.isMine && cell.numAdjMines) {
		li.dataset.numAdj = cell.numAdjMines;
	}

	// right click to toggle flag
	li.addEventListener('contextmenu', cell.toggleFlag.bind(cell), false);

	// left click may explode or reveal
	li.addEventListener('click', function() {
		if (cell.isRevealed) return;
		event.preventDefault();

		if (cell.isMine) {
			cell.explode();
		} else {
			cell.reveal();
		}
	}, false);

	cell.element = li;

	return li;
};


Cell.prototype.toggleFlag = function toggleCellFlag(event) {
	if (this.isRevealed) return;

	event.preventDefault();
	this.isFlagged = !this.isFlagged;
	if (this.element.classList.toggle('flagged')) {
		this.game.numFlagged++;
	} else {
		this.game.numFlagged--;
	}
	numFlagged.textContent = this.game.numFlagged;
};


Cell.prototype.reveal = function revealCell(event) {
	if (this.isRevealed) return;
	
	// set revealed state
	this.isRevealed = true;
	this.element.classList.add('revealed');
	this.game.numRevealed++;
	console.log(this.game.numRevealed);

	// You win when all non-mine cells are revealed
	if (this.game.numRevealed === this.game.numCells - this.game.numMines) {
		this.game.win();
	}

	// if no adjacent mines
	if (this.numAdjMines === 0) {

		// reveal adjacent cells
		this.getAdj().forEach(function(cell) {
			cell.reveal();
		});
	}
};


Cell.prototype.explode = function explodeCell(event) {
	this.game.field.classList.add('exploded');
};


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
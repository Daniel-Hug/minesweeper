(function() {
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
		this.cells = [];
		this.generateCells();

		// set mines randomly in cells
		// this.setupMines();
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
			this.cells.push(new Cell(this));
		}
	};


	Minesweeper.prototype.setupMines = (function() {
		function getRandomInt(min, max) {
			return Math.floor(Math.random() * (max - min + 1)) + min;
		}

		function getRandomI(collection) {
			return getRandomInt(0, collection.length - 1);
		}

		// call fn up to cap or collection.length times
		// pass a random unique item from collection each time
		function loopRandom(collection, fn, cap) {
			var untouched = collection.slice(0);
			cap = typeof cap === 'number' ? cap : collection.length;

			// loop through up to cap items
			for (var i = 0; i < cap; i++) {
				// pick a random index in untouched
				var randomI = getRandomI(untouched);

				// pass the item to fn
				fn(untouched[randomI], collection);

				// remove the item from untouched
				untouched.splice(randomI, 1);
			}
		}

		// return items from minuend that are not in subtrahend
		function diffArrays(minuend, subtrahend) {
			return minuend.filter(function(item) {
				return subtrahend.indexOf(item) < 0;
			});
		}

		return function setupMines(safeCells) {
			var mines = [];
			var unsafeCells = diffArrays(this.cells, safeCells);
			console.log('unsafe: ', unsafeCells);

			// loop through random cells up to this.numMines
			loopRandom(unsafeCells, function(cell) {
				// make it a mine
				cell.isMine = true;

				// add new mine to mines
				mines.push(cell);
			}, this.numMines);

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
		var game = this.game;
		var width = game.width;
		var height = game.height;
		var i = game.cells.indexOf(this);

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
			return game.cells[i];
		});
	};
})();
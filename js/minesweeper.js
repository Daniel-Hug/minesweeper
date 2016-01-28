(function(global) {




	/*
		helpers
	*/

	function extend(destination, source) {
		for (var key in source) {
			if (source.hasOwnProperty(key)) {
				destination[key] = source[key];
			}
		}
		return destination;
	}

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




	/*
		Minesweeper constructor
	*/

	var Minesweeper = function Minesweeper(config) {
		// config defaults
		this.width = 9;
		this.height = 9;
		this.safeFirstClick = true;

		// for Snoopy
		this.snoopers = {};

		// config overrides
		extend(this, config);

		// computed config
		this.numCells = this.width * this.height;
		this.numMines = this.numMines || Math.floor(0.15 * this.numCells);

		// fill this.cells with new Cell() objects
		this.cells = [];
		for (var i = this.numCells; i--;) {
			this.cells.push(new Cell(this));
		}

		// set initial game state and generate cells
		this.init();
	};




	/*
		Minesweeper methods
	*/

	// live DOM updates with Snoopy and DOM Builder
	extend(Minesweeper.prototype, Snoopy.prototype);


	extend(Minesweeper.prototype, {
		init: function init() {
			// initialize game state variables
			this.set('isWon', false);
			this.set('isLost', false);
			this.set('numFlagged', 0);
			this.set('numRevealed', 0);

			// initialize state variables for each cell
			this.cells.forEach(function(cell) {
				cell.init();
			});

			// set mines randomly in cells
			if (!this.safeFirstClick) {
				this.setupMines();
			}
		},


		setupMines: function setupMines(safeCells) {
			var mines = [];
			var unsafeCells = safeCells ? diffArrays(this.cells, safeCells) : this.cells;

			// loop through random cells up to this.numMines
			loopRandom(unsafeCells, function(cell) {
				// make it a mine
				cell.set('isMine', true);

				// add new mine to mines
				mines.push(cell);
			}, this.numMines);

			// get indices of mines
			this.setupNumbers(mines);
		},


		// increment cell.numAdjMines for each adjacent mine
		setupNumbers: function setupNumbers(mines) {
			function incrementNumAdj(cell) {
				cell.set('numAdjMines', cell.numAdjMines + 1);
			}

			mines.forEach(function(mine) {
				return mine.getAdj().forEach(incrementNumAdj);
			});
		}
	});




	/*
		Cell constructor
	*/

	var Cell = function Cell(game) {
		if (!(this instanceof Cell)) return new Cell(game);
		this.game = game;

		// for Snoopy
		this.snoopers = {};
	};




	/*
		Cell methods
	*/

	// live DOM updates with Snoopy and DOM Builder
	extend(Cell.prototype, Snoopy.prototype);

	extend(Cell.prototype, {
		init: function init() {
			this.set('isRevealed', false);
			this.set('isMine', false);
			this.set('isFlagged', false);
			this.set('numAdjMines', 0);
		},

		toggleFlag: function toggleCellFlag() {
			this.set('isFlagged', !this.isFlagged);

			// update game.numFlagged
			var game = this.game;
			game.set('numFlagged', game.numFlagged + (this.isFlagged ? 1 : -1) );
		},


		reveal: (function() {
			function revealCell(cell) {
				if (cell.isRevealed || cell.isFlagged) return;
				var game = cell.game;

				// if first click
				if (game.numRevealed === 0 && game.safeFirstClick) {

					// setup mines excluding this cell and adjacent cells
					var safeCells = cell.getAdj().concat(cell);
					game.setupMines(safeCells);
				}

				// set revealed state
				cell.set('isRevealed', true);
				game.set('numRevealed', game.numRevealed + 1);

				// You win when all non-mine cells are revealed
				if (game.numRevealed === game.numCells - game.numMines) {
					game.set('isWon', true);
				}

				// if no adjacent mines
				if (cell.numAdjMines === 0) {

					// reveal adjacent cells
					cell.getAdj().forEach(revealCell);
				}
			};

			return function explodeOrRevealCell() {
				if (this.isMine) {
					this.game.set('isLost', true);
				} else {
					revealCell(this);
				}
			};
		})(),


		// i is the index of a cell in a width*height grid
		// returns array containing the index of each adjacent cell in that grid
		getAdj: function getAdjCells() {
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
		}
	});




	/*
		export globals
	*/
	global.Minesweeper = Minesweeper;
	global.Cell = Cell;
})(this);
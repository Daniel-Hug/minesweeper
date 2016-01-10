// removes all of an element's childNodes
function removeChilds(el) {
	var last;
	while ((last = el.lastChild)) el.removeChild(last);
}

function renderMultiple(arr, renderer, parent) {
	var docFrag = document.createDocumentFragment();
	[].map.call(arr, renderer).forEach(function(el) {
		docFrag.appendChild(el);
	});
	parent.appendChild(docFrag);
}

// gather elements
var field = document.getElementById('field');
var w = document.getElementById('w');
var h = document.getElementById('h');
var numMines = document.getElementById('numMines');
var ms;

// sets cell.element = li;
function renderCell(cell) {
	var li = document.createElement('li');

	// 'mine' className
	if (cell.isMine) {
		li.classList.add('mine');
	}

	// data-num-adj attribute
	if (!cell.isMine && cell.numAdjMines) {
		li.dataset.numAdj = cell.numAdjMines;
	}

	// right click to toggle flag
	li.addEventListener('contextmenu', function() {
		if (!this.isRevealed) {
			event.preventDefault();
			cell.toggleFlag();
		}
	}, false);

	// left click to reveal
	li.addEventListener('click', function() {
		if (cell.isRevealed) return;
		event.preventDefault();
		cell.reveal();
	}, false);

	cell.element = li;

	return li;
}

// generate minesweeper
function start() {

	// setup game
	ms = new Minesweeper({
		width: w.value || 9,
		height: h.value || 9,
		cellRenderer: Cell.prototype.render
		// numMines: 4
	});

	// setup game field element
	ms.field = document.getElementById('field');
	ms.field.classList.remove('game-won', 'exploded');
	ms.field.style.width = 24 * ms.width + 'px';
	removeChilds(field);

	// render cells and append to game field
	renderMultiple(ms.cellObjs, renderCell, ms.field);


	// toggle 'flagged' class on cell
	ms.on('cellFlagToggle', function(event, cell) {
		cell.element.classList.toggle('flagged');
	});

	// keep flag count element updated
	(function() {
		var numFlagged = document.getElementById('numFlagged');

		function updateFlagCount() {
			numFlagged.textContent = ms.numFlagged;
		}
		updateFlagCount();
		ms.on('cellFlagToggle', updateFlagCount);
	})();

	// add 'revealed' class to cell
	ms.on('cellReveal', function(event, cell) {
		cell.element.classList.add('revealed');
	});

	// add 'exploded' class to game field
	ms.on('cellExplode', function(event, cell) {
		this.field.classList.add('exploded');
	});

	// add 'game-won' class to game field
	ms.on('win', function() {
		this.field.classList.add('game-won');
	});

	// show number of mines
	numMines.textContent = ms.numMines
}
start();

// set initial input values
w.value = ms.width;
h.value = ms.height;

// regenerate minesweeper when inputs change
[w,h].forEach(function(input) {
	input.addEventListener('input', start);
});
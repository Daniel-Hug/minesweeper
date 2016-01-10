/*
	helpers
*/

// Get element by CSS selector
function qs(selector, scope) {
	return (scope || document).querySelector(selector);
}

// removes all of an element's childNodes
function removeChilds(el) {
	var last;
	while ((last = el.lastChild)) el.removeChild(last);
}

// renderer will be called for each item in arr, and should return a DOM node.
// all DOM nodes returned will be appended to parent in batch
function renderMultiple(arr, renderer, parent) {
	var docFrag = document.createDocumentFragment();
	[].map.call(arr, renderer).forEach(function(el) {
		docFrag.appendChild(el);
	});
	parent.appendChild(docFrag);
}




/*
	render cell
*/

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




/*
	generate minesweeper
*/

function generateMinesweeper(config) {
	// setup game
	var ms = new Minesweeper(config);

	// setup game field element
	ms.field = qs('#field');
	ms.field.classList.remove('game-won', 'exploded');
	ms.field.style.width = 24 * ms.width + 'px';
	removeChilds(field);

	// render cells and append to game field
	renderMultiple(ms.cellObjs, renderCell, ms.field);

	// show number of mines
	qs('#numMines').textContent = ms.numMines;

	// keep flag count element updated
	(function() {
		var numFlagged = qs('#numFlagged');

		ms.on('cellFlagToggle', function updateFlagCount() {
			numFlagged.textContent = ms.numFlagged;
		}, true);
	})();

	// toggle 'flagged' class on cell
	ms.on('cellFlagToggle', function(event, cell) {
		cell.element.classList.toggle('flagged');
	});

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
}




/*
	generate minesweeper now and again when width and height inputs change
*/

(function() {
	var w = qs('#w');
	var h = qs('#h');

	function start() {
		generateMinesweeper({
			width: w.value || 9,
			height: h.value || 9
			// numMines: 4
		});
	}

	start();
	[w, h].forEach(function(input) {
		input.addEventListener('input', start);
	});
})();
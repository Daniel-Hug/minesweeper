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

//	Accepts a number, a singular noun, and a plural noun:
//		pluralize(3, 'apple', 'apples')
//	Returns the number paired with the correct noun:
//		"3 apples"
function pluralize(num, singular, plural) {
	var noun = num === 1 ? singular : plural;
	return num + ' ' + noun;
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
		if (!cell.isRevealed) {
			event.preventDefault();
			cell.toggleFlag();
		}
	}, false);

	// left click to reveal
	li.addEventListener('click', function() {
		if (cell.isRevealed || cell.isFlagged) return;
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

	// setup game container
	var gameEl = qs('.ms');
	gameEl.classList.remove('won', 'exploded');

	// setup cell container
	var cellParent = qs('.cell-parent');
	cellParent.style.width = 24 * ms.width + 'px';
	removeChilds(cellParent);

	// render and append cells
	renderMultiple(ms.cells, renderCell, cellParent);

	// show number of mines
	qs('.numMines').textContent = pluralize(ms.numMines, 'mine', 'mines');

	// keep flag count element updated
	(function() {
		var numFlagged = qs('.numFlagged');

		ms.on('cellFlagToggle', function updateFlagCount() {
			numFlagged.textContent = pluralize(ms.numFlagged, 'flag', 'flags');
		}, true);
	})();

	ms.on('cellFlagToggle', function(event, cell) {
		cell.element.classList.toggle('flagged');
	});

	ms.on('cellReveal', function(event, cell) {
		cell.element.classList.add('revealed');
	});

	ms.on('cellExplode', function(event, cell) {
		gameEl.classList.add('exploded');
	});

	ms.on('win', function() {
		gameEl.classList.add('won');

		// flag all mines
		ms.cells.forEach(function(cell) {
			if (cell.isMine) {
				cell.element.classList.add('flagged');
			}
		})
	});
}




/*
	generate minesweeper now,
	when width and height inputs change,
	and when 'start' is clicked
*/

(function() {
	var w = qs('.w');
	var h = qs('.h');

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

	qs('.start').addEventListener('click', start);
})();
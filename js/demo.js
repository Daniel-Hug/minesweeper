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
	var li = dom({
		el: 'li',
		class_mine: cell.snoop('isMine'),
		class_revealed: cell.snoop('isRevealed'),
		class_flagged: cell.snoop('isFlagged'),
		'data-num-adj': cell.snoop('numAdjMines', function(numAdjMines) {
			return cell.isMine ? null : numAdjMines || null;
		}),

		// right click to toggle flag
		on_contextmenu: function(event) {
			if (!cell.isRevealed) {
				event.preventDefault();
				cell.toggleFlag();
			}
		},

		// left click to reveal
		on_click: function(event) {
			if (!cell.isRevealed && !cell.isFlagged) {
				event.preventDefault();
				cell.reveal();
			}
		}
	});

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
	dom({
		el: qs('.ms'),
		class_won: ms.snoop('isWon'),
		class_lost: ms.snoop('isLost')
	});

	// setup cell container
	var cellParent = qs('.cell-parent');
	cellParent.style.width = 24 * ms.width + 'px';
	removeChilds(cellParent);

	// render and append cells
	renderMultiple(ms.cells, renderCell, cellParent);

	// show number of mines
	dom({
		el: qs('.numMines'),
		text: ms.snoop('numMines', function(numMines) {
			return pluralize(numMines, 'mine', 'mines');
		})
	});

	// keep flag count element updated
	dom({
		el: qs('.numFlagged'),
		text: ms.snoop('numFlagged', function(numFlagged) {
			return pluralize(numFlagged, 'flag', 'flags');
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
			// numMines: 4,
			// safeFirstClick: true,
			width: w.value || 9,
			height: h.value || 9
		});
	}

	start();
	[w, h].forEach(function(input) {
		input.addEventListener('input', start);
	});

	qs('.start').addEventListener('click', start);
})();
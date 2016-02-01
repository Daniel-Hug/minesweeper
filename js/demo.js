



/*
	helpers
*/

// Get element by CSS selector
function qs(selector, scope) {
	return (scope || document).querySelector(selector);
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

var ms = (function() {
	var w = qs('.w');
	var h = qs('.h');

	// setup game
	var ms = new Minesweeper({
		// numMines: 4,
		// safeFirstClick: true,
		width: +w.value || 9,
		height: +h.value || 9
	});

	// update width and height when inputs change
	w.addEventListener('input', function() {
		ms.set('width', this.value);
	});

	h.addEventListener('input', function() {
		ms.set('height', this.value);
	});

	return ms;
})();

// setup game container
dom({
	el: qs('.ms'),
	class_won: ms.snoop('isWon'),
	class_lost: ms.snoop('isLost')
});

// setup cell container
(function() {
	var cellParent = qs('.cell-parent');

	// keep element width updated
	ms.snoop('width', function(width) {
		cellParent.style.width = 24 * width + 'px';
	});

	// render and append new cells when they're pushed to ms.cells
	ms.cells.addDomObserver(cellParent, renderCell);
})();

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

// re-initialize minesweeper when 'start' is clicked
qs('.start').addEventListener('click', function restart() {
	ms.init();
});
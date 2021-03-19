const io = require('io');
const stream = require('stream');

const term = {};

// See https://en.wikipedia.org/wiki/ANSI_escape_code
const CSI = String.fromCharCode(0x1B) + '['; 
const stdin = stream.create(0);

term.clear = function() {
	term.print(CSI + '2J');
	term.move_to(1, 1);
}

term.bg = function(r, g, b) {
	term.print(CSI + '48;2;' + r + ';' + g + ';' + b + 'm');
}

term.fg = function(r, g, b) {
	term.print(CSI + '38;2;' + r + ';' + g + ';' + b + 'm');
}

term.hide_cursor = function() {
	term.print(CSI + '?25l');
}

term.move_to = function(row, column) {
	term.print(CSI + row + ';' + column + 'H');
}

term.print2 = function() {
	var str = '';

	for (var i=0; i<arguments.length; i++) {
		if (i > 0) {
			str += ' ';
		}

		str += term._toString(arguments[i]);
	}

	io.write_string(2, str);
}

term.print = function() {
	var str = '';

	for (var i=0; i<arguments.length; i++) {
		if (i > 0) {
			str += ' ';
		}

		str += term._toString(arguments[i]);
	}

	io.write_string(1, str);
}

term.println = function() {
	const things = [];

	for (var i=0; i<arguments.length; i++) {
		things.push(arguments[i]);
	}
	
	things.push('\n');

	term.print.apply(null, things);
}

term.println2 = function() {
	const things = [];

	for (var i=0; i<arguments.length; i++) {
		things.push(arguments[i]);
	}
	
	things.push('\n');

	term.print2.apply(null, things);
}

term.read_line = function() {
	return stream.read_line(stdin);
}

term.reset = function() {
	term.print(CSI + 'm');
}

term.show_cursor = function() {
	term.print(CSI + '?25h');
}

term._toString = function(thing) {
	const str = '';

	if (thing === null) {
		str += '(null)';
	} else if (thing === undefined) {
		str += '(undefined)';
	} else if (Array.isArray(thing)) {
		str += '[';

		for (var i = 0; i < thing.length; i++) {
			if (i > 0) {
				str += ', ';
			}

			str += term._toString(thing[i]);
		}

		str += ']';
	} else if (thing.toString() === '[object Object]') {
		str += '{';

		const keys = Object.keys(thing);
		for (var i = 0; i < keys.length; i++) {
			const key = keys[i];

			if (i > 0) {
				str += ', ';
			}

			str += key + ': ';
			str += term._toString(thing[key]);
		}

		str += '}';
	} else {
		str += thing.toString();
	}

	return str;
}

return term;

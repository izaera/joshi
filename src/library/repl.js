const crypto = require('crypto');
const errno = require('errno');
const fs = require('fs');
const io = require('io');
const kern = require('kern');
const perf = require('perf');
const proc = require('proc');
const $ = require('shell');
const stream = require('stream');
const term = require('term');
const tui = require('tui');

while (true) {
	term.print('> ');

	var last_cmd;
	var current_cmd = term.read_line();

	if (current_cmd === null) {
		term.println('');
		proc.exit(0);
	}

	var last_cmd_value;

	try {
		last_cmd_value = undefined;
		last_cmd_value = eval(current_cmd);
	} catch (err) {
		term.println2(err.message);
	}

	last_cmd = current_cmd;

	term.println(last_cmd_value);
}

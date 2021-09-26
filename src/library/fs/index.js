const crypto = require('crypto');
const errno = require('errno');
const io = require('io');
const proc = require('proc');

/**
 * Return from {module:fs.stat} function holding information of a file node
 *
 * @typedef {object} StatBuf
 * @property {number} gid Owner group id
 * @property {number} mode File type and access mode
 * @property {number} size Size in bytes
 * @property {TimeSpec} time Time statistics
 * @property {number} uid Owner user id
 *
 * @see {@link module:fs.S_IFMT}
 * @see {@link module:fs.S_IFBLK}
 * @see {@link module:fs.S_IFCHR}
 * @see {@link module:fs.S_IFDIR}
 * @see {@link module:fs.S_IFIFO}
 * @see {@link module:fs.S_IFLNK}
 * @see {@link module:fs.S_IFREG}
 * @see {@link module:fs.S_IFSOC}
 */

/**
 * Time statistics of a file node (with a resolution of one second)
 *
 * @typedef {object} TimeSpec
 * @property {number} access Last access time
 * @property {number} change Change time
 * @property {number} creation Creation time (same as change)
 * @property {number} modification Last modification time
 */

/**
 * Callback for {@link module:fs.list_dir} method
 *
 * @callback ListDirCallback
 * @param {string} item Directory item (file name)
 * @param {number} index Index of item in directory
 * @returns {boolean|undefined} Return `false` to stop listing
 */

const decoder = new TextDecoder();

/**
 * @exports fs
 * @readonly
 * @enum {number}
 */
const fs = {
	/* stat flags */

	/** Used to & return of {@link module:fs.stat} to extract inode type */
	S_IFMT: 0170000,
	/** File node type: block device */
	S_IFBLK: 0060000,
	/** File node type: char device */
	S_IFCHR: 0020000,
	/** File node type: directory */
	S_IFDIR: 0040000,
	/** File node type: FIFO */
	S_IFIFO: 0010000,
	/** File node type: symbolic link */
	S_IFLNK: 0120000,
	/** File node type: regular file */
	S_IFREG: 0100000,
	/** File node type: socket */
	S_IFSOC: 0140000,
};

/**
 * Get the filename part of a path
 *
 * @param {string} path
 * @returns {string}
 */
fs.basename = function (path) {
	return path.substring(1 + path.lastIndexOf('/'));
};

/**
 * Change file owner and group of a file or symbolic link
 *
 * @param {number} uid The new owner
 * @param {number} [gid] The new group (default is to leave untouched)
 * @returns {0}
 * @throws {SysError}
 */
fs.chown = function (path, uid, gid) {
	if (gid === undefined) {
		gid = fs.stat(path).gid;
	}

	return j.lchown(path, uid, gid);
};

/**
 * Copy file.
 *
 * Note that if the copy fails, the target file is left in an undefined state.
 *
 * @param {string} from Source file path
 * @param {string} to Destination file path
 *
 * @param {number} [mode=same as source file]
 * File creation mode.
 *
 * Note that if the file exists its mode is left untouched.
 *
 * @returns {void}
 * @throws {SysError}
 */
fs.copy_file = function (from, to, mode) {
	if (mode === undefined) {
		mode = fs.stat(from).mode & 07777;
	}

	var fdFrom;
	var fdTo;

	try {
		fdFrom = io.open(from);
		fdTo = io.truncate(to, mode);

		const buf = new Uint8Array(4096);

		var count;
		while ((count = io.read(fdFrom, buf, buf.length)) !== 0) {
			io.write(fdTo, buf, count);
		}
	} catch (err) {
		throw err;
	} finally {
		io.close(fdFrom, false);
		io.close(fdTo, false);
	}
};

/**
 * Create a temporary file with a random name
 *
 * @param {string} [contents=''] Initial file contents
 * @param {number} [mode=0600] Creation mode
 * @returns {string} The temporary file path
 * @throws {SysError}
 */
fs.create_temp_file = function (contents, mode) {
	if (typeof contents === 'number') {
		mode = contents;
		contents = undefined;
	}

	contents = contents || '';
	mode = Number(mode || 0600);

	const rnd = crypto.get_random_bytes(4);
	const filename =
		'/tmp/joshi_' +
		proc.getpid().toString(16) +
		'_' +
		rnd[0].toString(16) +
		rnd[1].toString(16) +
		rnd[2].toString(16) +
		rnd[3].toString(16);

	fs.write_file(filename, contents, mode);

	return filename;
};

/**
 * Get the directory part of a path
 *
 * @param {string} path
 * @returns {string} A directory or '.' if none was present in parameter
 */
fs.dirname = function (path) {
	const i = path.lastIndexOf('/');

	if (i === -1) {
		return '.';
	} else if (i === 0) {
		return '/';
	} else {
		return path.substring(0, i);
	}
};

/**
 * Check if a file path exists
 *
 * @param {string} pathname
 * @returns {boolean}
 * @throws {SysError} If anything goes wrong
 */
fs.exists = function (pathname) {
	try {
		fs.stat(pathname);

		return true;
	} catch (err) {
		if (err.errno === errno.ENOENT) {
			return false;
		}

		throw err;
	}
};

/**
 * Check if a path points to a block device
 *
 * @param {string} pathname
 * @returns {boolean}
 * @throws {SysError} If anything goes wrong or the path does not exist
 */
fs.is_block_device = function (pathname) {
	return (fs.stat(pathname).mode & fs.S_IFMT) === fs.S_IFBLK;
};

/**
 * Check if a path points to a char device
 *
 * @param {string} pathname
 * @returns {boolean}
 * @throws {SysError} If anything goes wrong or the path does not exist
 */
fs.is_char_device = function (pathname) {
	return (fs.stat(pathname).mode & fs.S_IFMT) === fs.S_IFCHR;
};

/**
 * Check if a path points to a directory
 *
 * @param {string} pathname
 * @returns {boolean}
 * @throws {SysError} If anything goes wrong or the path does not exist
 */
fs.is_directory = function (pathname) {
	return (fs.stat(pathname).mode & fs.S_IFMT) === fs.S_IFDIR;
};

/**
 * Check if a file is executable by current process given its effective gid and
 * uid.
 *
 * @param {string} pathname
 * @returns {boolean}
 * @throws {SysError} If anything goes wrong or the path does not exist
 */
fs.is_executable = function (pathname) {
	return matches_mode(pathname, 01);
};

/**
 * Check if a path points to a FIFO
 *
 * @param {string} pathname
 * @returns {boolean}
 * @throws {SysError} If anything goes wrong or the path does not exist
 */
fs.is_fifo = function (pathname) {
	return (fs.stat(pathname).mode & fs.S_IFMT) === fs.S_IFIFO;
};

/**
 * Check if a path points to a regular file
 *
 * @param {string} pathname
 * @returns {boolean}
 * @throws {SysError} If anything goes wrong or the path does not exist
 */
fs.is_file = function (pathname) {
	return (fs.stat(pathname).mode & fs.S_IFMT) === fs.S_IFREG;
};

/**
 * Check if a path points to a symbolic link
 *
 * @param {string} pathname
 * @returns {boolean}
 * @throws {SysError} If anything goes wrong or the path does not exist
 */
fs.is_link = function (pathname) {
	return (fs.stat(pathname).mode & fs.S_IFMT) === fs.S_IFLNK;
};

/**
 * Check if a file is readable by current process given its effective gid and
 * uid.
 *
 * @param {string} pathname
 * @returns {boolean}
 * @throws {SysError} If anything goes wrong or the path does not exist
 */
fs.is_readable = function (pathname) {
	return matches_mode(pathname, 04);
};

/**
 * Check if a path points to a socket
 *
 * @param {string} pathname
 * @returns {boolean}
 * @throws {SysError} If anything goes wrong or the path does not exist
 */
fs.is_socket = function (pathname) {
	return (fs.stat(pathname).mode & fs.S_IFMT) === fs.S_IFSOCK;
};

/**
 * Check if a file is writable by current process given its effective gid and
 * uid.
 *
 * @param {string} pathname
 * @returns {boolean}
 * @throws {SysError} If anything goes wrong or the path does not exist
 */
fs.is_writable = function (pathname) {
	return matches_mode(pathname, 02);
};

/**
 * Join several path parts and normalize the result
 *
 * @param {...string} paths Path parts to join
 * @returns {string}
 * @throws {SysError}
 * @see {module:fs.normalize_path}
 */
fs.join = function () {
	var path = arguments[0];

	for (var i = 1; i < arguments.length; i++) {
		if (arguments[i][0] === '/') {
			errno.fail(errno.EINVAL);
		}

		if (!path.endsWith('/')) {
			path += '/';
		}

		path += arguments[i];
	}

	return fs.normalize_path(path);
};

/**
 * List items of a directory (not including `.` and `..`).
 *
 * The order of listing is determined by the underlying filesystem.
 *
 * @param {string} name Path of directory
 *
 * @param {ListDirCallback} [callback]
 * A callback function invoked for each directory item. Use this idiom to avoid
 * having to wait for the whole listing to finish.
 *
 * @return {boolean|string[]}
 * The list of items or, if a callback is provided, a boolean indicating if the
 * listing finished (true) or was cancelled (false).
 *
 * @throws {SysError}
 */
fs.list_dir = function (name, callback) {
	const items = callback ? undefined : [];
	var finished = false;

	var dirp;

	try {
		const cb = callback
			? callback
			: function (item) {
					items.push(item);
			  };

		dirp = j.opendir(name);

		var index = 0;
		while (true) {
			const dirent = j.readdir(dirp);
			const name = dirent.d_name;

			if (name === '.' || name === '..') {
				continue;
			}

			if (cb(name, index++) === false) {
				break;
			}
		}
	} catch (err) {
		if (err.errno) {
			err.message += ' (' + name + ')';
			throw err;
		}

		finished = true;
	} finally {
		if (dirp) {
			j.closedir(dirp);
		}
	}

	return callback ? finished : items;
};

/**
 * Create a directory
 *
 * @param {string} pathname Path of directory
 * @param {number} [mode=0755] Creation mode
 * @returns {0}
 * @throws {SysError}
 */
fs.mkdir = function (pathname, mode) {
	if (mode === undefined) {
		mode = 0755;
	}

	try {
		return j.mkdir(pathname, mode);
	} catch (err) {
		err.message += ' (' + pathname + ')';
		throw err;
	}
};

/**
 * Create a directory and all parents that are necessary
 *
 * @param {string} pathname Path of directory
 * @param {number} [mode=0755] Creation mode of new directories
 * @returns {0}
 * @throws {SysError}
 */
fs.mkdirp = function (pathname, mode) {
	var dirname = '';
	var initialIndex = 1;

	if (!pathname.startsWith('/')) {
		dirname = '.';
		initialIndex = 0;
	}

	const parts = pathname.split('/');

	for (var i = initialIndex; i < parts.length; i++) {
		dirname += '/' + parts[i];

		if (!fs.exists(dirname)) {
			fs.mkdir(dirname, mode);
		} else if (!fs.is_directory(dirname)) {
			errno.fail(errno.ENOTDIR);
		}
	}

	return 0;
};

/**
 * Create a FIFO at a given path
 *
 * @param {string} pathname Path of FIFO
 * @param {number} [mode=0644] Creation mode of FIFO
 * @returns {0}
 * @throws {SysError}
 */
fs.mkfifo = function (pathname, mode) {
	if (mode === undefined) {
		mode = 0644;
	}

	return j.mkfifo(pathname, mode);
};

/**
 * Normalize a path resolving any `.` or `..` inside and making sure it is an
 * absolute path.
 *
 * Note that this function does not return the canonical path (resolving
 * symbolic links), just an absolute path in normalized form.
 *
 * The path does NOT need to exist for the function to work (as opposed to
 * {@link module:fs.realpath}.
 *
 * @param {string} path The path to normalize
 * @returns {string} An absolute path without any `.` or `..` inside
 */
fs.normalize_path = function (path) {
	if (path[0] !== '/') {
		path = fs.realpath('.') + '/' + path;
	}

	const nparts = [];

	path.split('/')
		.filter(function (part) {
			return part !== '.';
		})
		.forEach(function (part) {
			if (part === '..') {
				nparts.pop();
			} else {
				nparts.push(part);
			}
		});

	return nparts.join('/');
};

/**
 * Get the path referenced by a symbolic link
 *
 * @param {string} path Path to symbolic link
 *
 * @param {boolean} [dereference=true]
 * Whether to dereference link if it is relative
 *
 * @returns {string} The target path
 * @throws {SysError}
 */
fs.read_link = function (path, dereference) {
	if (dereference === undefined) {
		dereference = true;
	}

	// We need to use a buffer because readlink does not add the trailing \0
	const buf = new Uint8Array(384);

	const length = j.readlink(path, buf, buf.length);

	buf = buf.subarray(0, length);

	const val = decoder.decode(buf);

	if (val[0] === '/' || !dereference) {
		return val;
	}

	const dir = fs.dirname(path);

	return (dir === '/' ? '' : dir) + '/' + val;
};

/**
 * Read the contents of a file as an UTF-8 string.
 *
 * @param {string} path Path of file to read
 * @returns {string} The contents of the file as a string
 * @throws {SysError}
 * @see {module:io.read_string}
 */
fs.read_file = function (path) {
	const fd = io.open(path, 'r');

	try {
		return io.read_string(fd);
	} finally {
		io.close(fd);
	}
};

/**
 * Get the canonical form of a path (resolving `.`, `..`, and symbolic links)
 *
 * @example
 * // Get the absolute path of the current working directory
 * const cwd = fs.realpath('.');
 *
 * @param {string} path
 * @returns {string} The canonical path
 * @throws {SysError} If anything goes wrong or path does not exist
 */
fs.realpath = function (path) {
	return j.realpath(path);
};

/**
 * Move a file or directory
 *
 * @param {string} oldpath Path to rename
 * @param {string} newpath New path of renamed file/dir
 * @returns {0}
 * @throws {SysError}
 */
fs.rename = function (oldpath, newpath) {
	return j.rename(oldpath, newpath);
};

/**
 * Delete a directory
 *
 * @param {string} path Path of directory
 * @param {boolean} [recursive=false] Delete even if not empty
 * @returns {0}
 * @throws {SysError}
 */
fs.rmdir = function (path, recursive) {
	if (recursive === undefined) {
		recursive = false;
	}

	if (recursive && !fs.exists(path)) {
		return 0;
	}

	if (recursive) {
		fs.list_dir(path, function (item) {
			const item_path = path + '/' + item;

			if (fs.is_directory(item_path)) {
				fs.rmdir(item_path, true);
			} else {
				fs.unlink(item_path);
			}
		});
	}

	return j.rmdir(path);
};

/**
 * Obtain information of a file node
 *
 * @param {string} pathname Path of file node
 * @returns {StatBuf} Information on file node
 * @throws {SysError}
 */
fs.stat = function (pathname) {
	const statbuf = j.lstat(pathname).statbuf;

	return {
		gid: statbuf.st_gid,
		mode: statbuf.st_mode,
		size: statbuf.st_size,
		time: {
			access: statbuf.st_atim.tv_sec,
			change: statbuf.st_ctim.tv_sec,
			creation: statbuf.st_ctim.tv_sec,
			modification: statbuf.st_mtim.tv_sec,
		},
		uid: statbuf.st_uid,
	};
};

/**
 * Create a symbolic link at path2 pointing to path1
 *
 * @param {string} path1 Symlink target path
 * @param {string} path2 Symlink file path
 * @returns {0}
 * @throws {SysError}
 */
fs.symlink = function (path1, path2) {
	return j.symlink(path1, path2);
};

/**
 * Delete a file node
 *
 * @param {string} pathname Path of file node
 *
 * @param {boolean} [fail_if_not_found=true]
 * Pass `false` to ignore ENOENT errors
 *
 * @returns {0}
 * @throws {SysError}
 */
fs.unlink = function (pathname, fail_if_not_found) {
	if (fail_if_not_found === undefined) {
		fail_if_not_found = true;
	}

	try {
		return j.unlink(pathname);
	} catch (err) {
		if (!fail_if_not_found && err.errno === errno.ENOENT) {
			return 0;
		}

		err.message += ' (' + pathname + ')';
		throw err;
	}
};

/**
 * Write a string in UTF-8 format to a file
 *
 * @param {string} path Path to file
 * @param {string} contents Contents of file
 * @param {number} [mode=0644] Creation mode if file needs to be created
 * @returns {number} The number of bytes written
 * @throws {SysError}
 * @see {@link module:io.write_string}
 */
fs.write_file = function (path, contents, mode) {
	if (mode === undefined) {
		mode = 0644;
	}

	var fd;

	try {
		fd = io.truncate(path, mode, 'w');

		return io.write_string(fd, contents);
	} catch (err) {
		err.message += ' (' + path + ')';
		throw err;
	} finally {
		if (fd) {
			io.close(fd);
		}
	}
};

/**
 * Check if a file matches a mode bit given current process' effective gid and
 * uid.
 *
 * @param {string} pathname
 * @returns {boolean}
 * @throws {SysError} If anything goes wrong or the path does not exist
 * @private
 */
function matches_mode(pathname, modebit) {
	const umask = modebit;
	const gmask = modebit << 3;
	const omask = modebit << 6;

	try {
		const stat = fs.stat(pathname);

		if (stat.mode & umask) {
			return true;
		}

		if (stat.mode & gmask && proc.getegid() === stat.gid) {
			return true;
		}

		if (stat.mode & omask && proc.geteuid() === stat.uid) {
			return true;
		}
	} catch (err) {
		if (
			[
				undefined,
				errno.EFAULT,
				errno.ENAMETOOLONG,
				errno.ENOMEM,
				errno.EOVERFLOW,
				errno.EBADFD,
				errno.EINVAL,
			].includes(err.errno)
		) {
			throw err;
		} else {
			// ignore
		}
	}

	return false;
}

return fs;

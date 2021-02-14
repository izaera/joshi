#ifndef _JOSHI_CORE_H
#define _JOSHI_CORE_H

#include "duktape.h"

typedef struct {
	const char* name;
	void* func;
	int argc;
} BUILTIN;

extern size_t joshi_core_builtins_count;
extern BUILTIN joshi_core_builtins[]; 

duk_ret_t _joshi_read_file(duk_context* ctx);

#endif

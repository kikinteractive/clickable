#!/bin/sh

VERSION="1.0.0"
LICENSE="LICENSE.txt"

JS_COMPILER="closure-compiler"
CSS_COMPILER="yuicompressor --type css"

mkdir -p ${VERSION}

compress () {
	cat ${LICENSE} ${3} | ${1} > ${VERSION}/${2}
}

compress "${JS_COMPILER} " "clickable.js" "clickable.js"

#!/bin/sh

VERSION="1.0"
LICENSE="LICENSE.txt"

compressJS () {
	REGULAR="${1}.js"
	MINIFIED="${1}.min.js"
	cp ${LICENSE} ${REGULAR}
	cp ${LICENSE} ${MINIFIED}
	cat - >> ${REGULAR}
	cat ${REGULAR} | closure-compiler >> ${MINIFIED}
}

compressCSS () {
	REGULAR="${1}.css"
	MINIFIED="${1}.min.css"
	cp ${LICENSE} ${REGULAR}
	cp ${LICENSE} ${MINIFIED}
	cat - >> ${REGULAR}
	cat ${REGULAR} | yuicompressor --type css >> ${MINIFIED}
}

cat clickable.js | compressJS ${VERSION}

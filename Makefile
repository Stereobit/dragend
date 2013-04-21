VERSION = $(shell cat VERSION)

JS_OUTPUT = "dist/jquery.dragend-${VERSION}.js"

JS_FILE = jquery.dragend.js

all: bundle minify

bundle:
	@@echo "Bundling..."
	@@touch ${JS_OUTPUT}
	@@echo "Create output file"
	@@cat ${JS_FILE} >> ${JS_OUTPUT}
	@@echo "Merge JS file into output file"
	@@cat ${JS_OUTPUT} | sed "s/@VERSION/${VERSION}/" > "${JS_OUTPUT}.tmp"
	@@mv "${JS_OUTPUT}.tmp" ${JS_OUTPUT}

minify:
	@@echo "Minifying... (this requires node.js)"
	@@node build/minify.js ${JS_OUTPUT}
	@@echo "Done."

clean:
	@@git co ${JS_OUTPUT}
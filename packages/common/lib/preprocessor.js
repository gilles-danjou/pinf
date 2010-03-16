
var AnnotationParser = exports.AnnotationParser = function() {
    if (!(this instanceof exports.AnnotationParser))
        return new exports.AnnotationParser();
}

AnnotationParser.prototype.process = function(text, path) {
    
    // Look for:
    //
    //   / * *
    //    * @deprecated
    //    * /
    //   X.prototype.Y = function(...) {
    //
    // and insert deprecation log message
    
    
    var re = /\/\*\*\s*\n(.*?)\s*\*\s*@deprecated\s*\n(.*?)\s*\*\/\s*\n(.*?\s*function\s*\(.*?\))(\s*\n?\s*\{)/g,
        m;

    while(m = re.exec(text)) {
        text = text.replace(m[3]+m[4], m[3]+m[4] + 
            "system.log.warn('Calling DEPRECATED function: "+m[3]+" declared in "+path+"');"
        );
    }

    return text;
}


// register the preprocessor
var processor = {
    annotationParser: exports.AnnotationParser(),
    process: function(text, topId, path) {
        text = this.annotationParser.process(text, path);
        return text;
    }
};
if(require.loader.preprocessors)
    require.loader.preprocessors.unshift(processor);

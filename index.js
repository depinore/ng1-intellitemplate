if(process.argv.length >= 3)//if we have arguments passed into this script, that means we're in cli mode.
    runCli();

function runCli() {
    var configuration = getArguments();
    console.log(replace(configuration, require('fs').readFileSync(configuration.inFile, 'utf8')));
}

function getArguments() {
    if(process.argv[2] && process.argv[2].toLowerCase() === '-h' || process.argv[2].toLowerCase() === '--help') {
        console.log('USAGE: intellitemplate.js <inFile> [--es5] [--modulevar <value>]');
        process.exit();
    }

    var moduleVarIndex = process.argv.indexOf('--modulevar')

    return {
        inFile: process.argv[2],
        es5: process.argv.indexOf("--es5") > -1,
        moduleVar : process.argv[moduleVarIndex > -1 && moduleVarIndex + 1] || 'ngModule'
    }
}

//Will perform a series of replacements after identifying which parts of the file are intellitemplates.
function replace(config, contents, commentsPattern, commentsReplacePattern, es5EscapePattern, es6EscapePattern, unescapeReplacePattern) {
    //will find all intellitemplate strings.

    commentsPattern = commentsPattern || /(["'`]\s*)tpl(:? *(.*?)["'`];?)([\s\S]*?)(;?\s*?['"`]\/)tpl(['`"];?)/gm;
    var hasTemplateUrl = /['"`]\s*tpl: *(.+?)['"`];?/;
    var insertTemplateCache = `${config.moduleVar}.run(['$templateCache', function($templateCache){ $templateCache.insert('$1', $2); }]);`
    var noTemplateCache = '$1---$2$4$5---$6';//alters intellitemplate blocks such that whenever it finds "tpl" and "/tpl", it'll replace those with "---" and "/---" to mark them as done.

    //replaces all intellitemplate strings with templateCache insertions
    commentsReplacePattern = commentsReplacePattern || insertTemplateCache;

    //This pattern is to be used on es5 code generated from typescript.
    es5EscapePattern = es5EscapePattern || /" \+ (.*?) \+ "/gm;
    const es5ReplacePattern = `   $1   `;   //make sure that the + and the spaces are replaced with the same number of spaces.  This will preserve ts sourceMaps.

    //this pattern is to be used on es6+ code.
    es6EscapePattern = es6EscapePattern || /\${([\s\S]*?)}/gm;
    const es6ReplacePattern = `  $1 `;      //make sure to replace the $, {, and } with spaces, so as to not disrupt typescript source maps.

    var unescapePattern = config.es5 ? es5EscapePattern : es6EscapePattern;
    unescapeReplacePattern = unescapeReplacePattern || (config.es5 ? es5ReplacePattern : es6ReplacePattern);

    var templateCacheMutator = getMutator(commentsPattern, commentsReplacePattern)
    var noTemplateCacheMutator = getMutator(commentsPattern, noTemplateCache)

    //find intellitemplates
    return (contents.match(commentsPattern) || []).map(toMatches)
        .map(function(replacement) {
            return (hasTemplateUrl.test(replacement.before)
                        ? templateCacheMutator
                        : noTemplateCacheMutator)(replacement);
        })
        .map(getMutator(unescapePattern, unescapeReplacePattern))
        .reduce(function(result, replacement) {
            return result.replace(replacement.before, replacement.after);
        }, contents)
}

function toMatches(match) {
    return {
        before: match,
        after: match
    }
}
function getMutator(findPattern, replacePattern) {
    //the returned function is a mutator.  Will take a code block (before), mutate it, and save it under "after".
    return function(replacement) {
        return {
            before: replacement.before,
            after: replacement.after.replace(findPattern, replacePattern)
        }
    };
}

module.exports = {
    replace: replace
}

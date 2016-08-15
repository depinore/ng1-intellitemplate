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
    commentsPattern = commentsPattern || /\/\/tpl:\s*(.*?)\s([\s\S]*?);?\s*\/\/endtpl/gm;

    //replaces all intellitemplate strings with templateCache insertions
    commentsReplacePattern = commentsReplacePattern || `${config.moduleVar}.run(['$templateCache', function($templateCache){ $templateCache.insert('$1', $2); }]);` 

    //This pattern is to be used on es5 code generated from typescript.
    es5EscapePattern = es5EscapePattern || /" \+ (.*?) \+ "/gm;

    //this pattern is to be used on es6+ code.
    es6EscapePattern = es6EscapePattern || /\${([\s\S]*?)}/gm;

    var unescapePattern = config.es5 ? es5EscapePattern : es6EscapePattern;
    unescapeReplacePattern = unescapeReplacePattern || '$1';

    //find intellitemplates
    return contents.match(commentsPattern).map(toMatches)
        .map(processMatches(commentsPattern, commentsReplacePattern))
        .map(processMatches(unescapePattern, unescapeReplacePattern))
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
function processMatches(findPattern, replacePattern) {
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
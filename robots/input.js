const readline = require('readline-sync')
const state = require('./state.js')

function robot() {
    const content = {
        maximumSentences: 7
    }

    content.searchTerm = askAndReturnSearchTerm();
    content.prefix = askAndReturnPrefix();
    content.lang = askAndReturnLanguage()
    
    state.save(content)

    function askAndReturnSearchTerm(){
        return readline.question('Termo para busca no Wikipedia: ')
    }
    function askAndReturnPrefix(){
        const prefixes = ['Quem e', 'O que e', 'A historia do', 'A historia da'];
        const selectdPrefixIndex = readline.keyInSelect(prefixes);
        const selectdPrefixText = prefixes[selectdPrefixIndex];
        return selectdPrefixText;
    }
    function askAndReturnLanguage(){
        const language = ['pt','en']
        const selectedLangIndex = readline.keyInSelect(language,'Choice Language: ')
        const selectedLangText = language[selectedLangIndex]
        return selectedLangText
    }

}

module.exports = robot
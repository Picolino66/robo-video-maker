const readline = require('readline-sync');
function start(){
    const content = {}
    content.searchTerm = askAndReturnSearchTerm();
    content.prefix = askAndReturnPrefix();
    function askAndReturnSearchTerm(){
        return readline.question('Termo para busca no Wikipedia: ')
    }
    function askAndReturnPrefix(){
        const prefixes = ['Quem e', 'O que e', 'A historia do', 'A historia da'];
        const selectdPrefixIndex = readline.keyInSelect(prefixes);
        const selectdPrefixText = prefixes[selectdPrefixIndex];
        return selectdPrefixText;
    }
    console.log(content); 
}
start()
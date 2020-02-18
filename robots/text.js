const algorithmia = require('algorithmia')
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey
const sentenceBoundaryDetection = require('sbd');

const watsonApiKey = require("../credentials/watson-nlu.json").apikey;
const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
const { IamAuthenticator } = require('ibm-watson/auth');
 
const nlu = new NaturalLanguageUnderstandingV1({
  authenticator: new IamAuthenticator({ apikey: watsonApiKey }),
  version: '2018-04-05',
  url: 'https://gateway.watsonplatform.net/natural-language-understanding/api/'
});
const state = require('./state.js');

async function robot() {
    console.log('[Robo de Texto] Comecando...')
    const content = state.load();
    
    await fetchContentFromWikipedia(content);
    sanitizeContent(content);
    breakContentIntoSentences(content);
    limitMaximumSentences(content);
    await fetchKeywordsOfAllSentences(content);

    state.save(content);

    async function fetchContentFromWikipedia(content){     
        console.log('[Robo de Texto] Buscando conteudo da Wikipedia')
        const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey);
        const wikipediaAlgorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2');
        const wikipediaResponse = await wikipediaAlgorithm.pipe({
            "lang" : content.lang,
            "articleName": content.searchTerm
        });
        const wikipediaContent = wikipediaResponse.get();
        
        content.sourceContentOriginal = wikipediaContent.content;
        console.log('[RObo de Texto] Busca acabada!')
    }

    function sanitizeContent(content){
        const withoutBlankLinesAndMarkdown = removeBlankLinesAndMarkdown(content.sourceContentOriginal);
        const withoutDatesInParentheses = removeDatesInParentheses(withoutBlankLinesAndMarkdown)
        
        content.sourceContentSanitized = withoutDatesInParentheses;

        function removeBlankLinesAndMarkdown(text){
            const allLines = text.split('\n');
            
            const withoutBlankLinesAndMarkdown = allLines.filter((line) => {
                if (line.trim().length === 0 || line.trim().startsWith('=')){
                    return false;
                }
                return true;
            })
            return withoutBlankLinesAndMarkdown.join(' ');
        }
    }

    function removeDatesInParentheses(text) {
        return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g,' ')
    }

    function breakContentIntoSentences(content){
        content.sentences = []

        const sentences = sentenceBoundaryDetection.sentences(content.sourceContentSanitized);
        sentences.forEach((sentences) => {
            content.sentences.push({
                text: sentences,
                keywords: [],
                images: []
            })
        })
    }

    function limitMaximumSentences(content) {
        content.sentences = content.sentences.slice(0, content.maximumSentences);
    }
    
    async function fetchKeywordsOfAllSentences(content){
        console.log('[Robo de Texto] Começando a buscar palavras-chave do Watson')

        for (const sentence of content.sentences){
            console.log(`[Robo de texto] Sentenca: "${sentence.text}"`);
            sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text);
            console.log(`[Robo de texto] Palavras-chave: ${sentence.keywords.join(', ')}\n`);
        }
    }

    async function fetchWatsonAndReturnKeywords(sentence) {
        return new Promise((resolve, reject) => {
            nlu.analyze({
                text: sentence,
                features: {
                    keywords: {}
                }
            }, 
            (error, response) => {
                if (error) {
                    reject(error)
                    return
                }
                const keywords = response.result.keywords.map((keyword) => {
                    return keyword.text
                })

                resolve(keywords)
            })
        })
    }    

}
module.exports = robot
class TrieNode {
    constructor() {
        this.children = {};           // an object to store child nodes (like a map)
        this.isEndofWord = false;     // true if a word ends at this node
    }
}

class Trie {
    constructor() {
        this.root = new TrieNode();                       // root node (starting point of the Trie)
    }

    insert(word) {
        let node = this.root;
        for(let char of word){
            if(!node.children[char]){
                node.children[char] = new TrieNode();      // create new node if not exists
            }
            node = node.children[char];               // move to the next node
        }
        node.isEndofWord = true;                     // mark the end of the word
    }

    search(prefix) {
        let node = this.root;
        for(let char of prefix){
            if(!node.children[char]){
                return [];                        // if prefix not found, return empty list
            }
            node = node.children[char];           // move to the next node
        }
        return this._collectWords(node, prefix);     // collect all word which starts with prefix
    }

    _collectWords(node, prefix){
        let results = [];
        if(node.isEndofWord){
            results.push(prefix);                // if word ends, add it
        }

        for(let char in node.children){
            results = results.concat(this._collectWords(node.children[char], prefix+char));            // recursively collect all words
        }
        return results;
    }
}

module.exports = Trie;
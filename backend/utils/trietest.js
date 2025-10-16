const Trie = require('./Trie');

const trie = new Trie();

trie.insert('apple');
trie.insert('app');
trie.insert('apply');
trie.insert('bat');
trie.insert('ball');

console.log(trie.search('ap'));        // should return [ 'apple', 'app', 'apply' ]
console.log(trie.search('ba'));        // should return [ 'bat', 'ball' ]
console.log(trie.search('cat'));       // should return []
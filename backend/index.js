const express = require('express');                // imports Express framework for HTTP server and APIs
const http = require('http');                      // Node.js core module to create an HTTP server
const { Server } = require('socket.io');           // imports Socket.io Server class for real-time communication
const cors = require('cors');                      // imports CORS middleware to allow cross-origin requests
require('dotenv').config();                        // loads environment variables from a .env file

const connectDB = require('./config/db');          // imports MongoDB connection function
const word = require('./models/word');             // imports Mongoose Word model
const Trie = require('./utils/Trie');              // imports Trie class for autocomplete

const app = express();                             // creates Express app instance
app.use(cors());                                   // enables CORS for all routes
app.use(express.json());                           // parses incoming JSON request bodies

const PORT = process.env.PORT || 8080;             // sets server port from env or default 8080
const trie = new Trie();                           // creates new Trie instance for storing words

// Load words from MongoDB into Trie
async function loadWordsIntoTrie() {
    const wordsFromDb = await word.find({}, 'text').lean();              // fetch all words from DB
    wordsFromDb.forEach(w => trie.insert(w.text));                       // insert each word into Trie
    console.log(`Loaded ${wordsFromDb.length} words into Trie`);         // log how many words loaded
}

app.get('/', (req,res) => {
    res.send('Backend is running');                                 // simple health check endpoint
});

// Optional REST endpoint for autocomplete (fallback)
app.get('/api/suggest', (req,res) => {
    const prefix = (req?.query?.prefix || '').toLowerCase();                     // get prefix from query
    const limit = Math.min(parseInt(req?.query?.limit || '10', 10), 100);        // get limit or default 10

    const suggestions = trie.search(prefix).slice(0,limit);                      // search Trie for prefix
    res.json({ prefix, suggestions});
});

// REST endpoint to add a word
app.post('/api/words', async (req,res) => {
    try {
        const { text } = req?.body;                     // get 'text' from request body
        if(!text){
            return res.status(400).json({                // return error if text is empty
                message : 'Please enter text',
                success : false,
                error : true
            });
        }

        const Word = text.toLowerCase().trim();                                  // normalize word
        await word.updateOne({ text : Word}, {text: Word}, {upsert : true});     // add/update in DB
        trie.insert(Word);                                                      // insert word into Trie
        res.json({                                                              // send success response
            message : 'Word added successfully',
            success : true,
            error : false
        });
    }
    catch(err){
        res.status(500).json({                                     // send error if something goes wrong
            message : err.message,
            error : true,
            success : false
        });
    }
});

// HTTP Server & socket.io for live autocomplete
const server = http.createServer(app);                           // create HTTP server from Express app
const io = new Server(server, { cors: { origin: '*' }});         // create Socket.io server with CORS enabled

io.on('connection', socket => {                                        // when a client connects via Socket.io
    console.log('Socket connected:', socket.id);                       // log connection

    socket.on('prefix', ({ prefix = '', limit = 10 }) => {             // listen for prefix events
        const suggestions = trie.search(prefix).slice(0,limit);        // get autocomplete suggestions
        socket.emit('suggestions', { prefix, suggestions });           // send suggestions back
    });

    socket.on('disconnect', () => console.log('Socket disconnected:', socket.id));      // log disconnect
})

// Connect DB, load Trie , start Server
connectDB()                                                                                // connect to MongoDB
    .then(async () => {
        await loadWordsIntoTrie();                                                         // load all words into Trie
        server.listen(PORT, () => console.log(`Server running on port ${PORT}`));          // start server
    })
    .catch(err => console.error('DB connection error:', err));                             // log DB errors
const fs = require('fs');                   // Node.js module to read and write files
const path = require('path');               // Node.js module to handle file paths
const dotenv = require('dotenv');           

dotenv.config();                             // Loads environment variables from .env
const connectDB = require('./config/db');
const word = require('./models/word');       // Mongoose model representing a word in the database

async function seed(){
    await connectDB();
    const filePath = path.join(__dirname,'data','words.txt');     // Set the file path to words file

    if(!fs.existsSync(filePath)){                      // Checks if words.txt exists
        console.log('No data fount in words.txt');
        process.exit(1);                                // If the file is missing, it prints an error and stops the script
    }

    const content = fs.readFileSync(filePath, 'utf-8');    // Reads the entire file as text in UTF-8 encoding

    const words = content
                      .split(/\r?\n/)                       // Splits the text into an array of lines
                      .map(w => w.trim().toLowerCase())     // Removes extra spaces and converts all words to lowercase
                      .filter(Boolean);                     // Removes empty lines from the array
    
    console.log(`Seeding ${words.length} words ...`);

    const operations = words.map(w => ({
        updateOne : { 
            filter : { text : w },              // Look for a word matching w
            update : { text : w },              // If it exists, update it (no changes in this case)
            upsert : true                       // If it doesn’t exist, insert it
        }
    }));

    await word.bulkWrite(operations);         // Inserts all words in one batch, much faster than inserting one by one
    console.log('Seeding complete!');
    process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
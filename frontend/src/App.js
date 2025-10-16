import { useEffect, useState } from 'react';               // React hooks for state and side effects
import { io } from 'socket.io-client';                     // used to connect frontend with backend via WebSocket
import './App.css';                                        // importing CSS for styling
import axios from 'axios';                                 // for making API requests

const socket = io(`${process.env.REACT_APP_BACKEND_URL}`);                 // connects to backend Socket.io server

function App() {
  const [prefix, setPrefix] = useState('');                  // stores current user input (search text)
  const [suggestions, setSuggestions] = useState([]);        // stores autocomplete suggestions from backend
  const [newWord, setNewWord] = useState('');                // stores word to be added manually
  const [selectedIndex, setSelectedIndex] = useState(-1);    // track which suggestion is highlighted

  useEffect(() => {
    socket.on('suggestions', (data) => {                     // listens for 'suggestions' event from backend
      setSuggestions(data.suggestions);                      // updates suggestions when received
      setSelectedIndex(-1);                                  // reset selection when new suggestions arrive
    });

    return () => {
      socket.off('suggestions');                             // cleanup: removes listener when component unmounts
    };
  },[]);

  const handleChange = (e) => {
    const value = e.target.value;                                // gets current input text
    setPrefix(value);                                           // updates prefix state

    if(value.trim() === ''){
      setSuggestions([]);                                       // clear suggestions when input is empty
      return ;
    }
    
    socket.emit('prefix', { prefix: value, limit : 10});         // sends prefix to backend via socket for suggestions
  }

  const handleAddWord = async () => {
    try{
      if(!newWord.trim()){                                       // checks if input is empty
         return alert('Enter a word');                           // show alert if no word entered
      }

      const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/words`, { 
                     text: newWord 
      });                                                       // sends POST request to backend API to add new word to MongoDB + Trie
      
      if(res.data.success){                                     // if backend responds with success = true
        alert(`Word ${newWord} successfully added`);                  // show success alert
        setNewWord('');                                         // clear input field
      }
      else{
        alert('Error adding word');                             // show error alert if something went wrong
      }
    }
    catch(err) {
      console.error(err);                                       // log any server error
      alert('Server error:');                                   // show alert for server failure
    }
  }

  // handle keyboard navigation (arrow keys + enter)
  const handleKeyDown = (e) => {
    if(suggestions.length === 0){                               // check if suggestions list is empty
      return ;
    }

    if(e.key === 'ArrowDown'){                                          // check if event is Arrow Down key
      e.preventDefault();
      setSelectedIndex((prev) => (prev+1) % suggestions.length);        // setselected index is move to next index
    }
    else if(e.key === 'ArrowUp'){                                       // check if event is Arrow Up key
      e.preventDefault();
      setSelectedIndex((prev) => (prev-1+suggestions.length) % suggestions.length);        // Selected index is move to previous index
    }
    else if(e.key === 'Enter'){                                            // check if event is enter key
      if(selectedIndex >= 0 && selectedIndex < suggestions.length){        // check selected index is in valid range
        
        setPrefix(suggestions[selectedIndex]);                             // set selected suggestion as a prefix
        setSuggestions([]);                                                // hide suggestions list after selection 
        setSelectedIndex(-1);                                                 // set selectedIndex -1
      }
    }
  }

  // when clicking a suggestion
  const handleSuggestionClick = (word) => {
    setPrefix(word);
    setSuggestions([]);
    setSelectedIndex(-1);
  }

  return (
    <div className="app-container">
      <h1>Auto Complete System Using Trie Data Structure:</h1>

      {/* Add word Section */}
      <div className='add-word-container'>
        <input 
            type='text'
            value={newWord}
            placeholder='Add a new word here ...'
            onChange={(e) => setNewWord(e.target.value)}
            className='add-input'
        />
        <button onClick={handleAddWord} className='add-btn'>Add Word</button>
      </div>

      {/* input field for prefix word  */}
      <input 
         type='text'
         value={prefix}
         onChange={handleChange}
         onKeyDown={handleKeyDown}
         placeholder='Type a word ...'
         className='search-input'
      />

      {/* suggestions display field if any suggestions present */}
      {
        suggestions.length > 0 && (
          <ul className='suggestions-list'>
            {
              suggestions.map((word,index) => (
                <li 
                    key = {index}
                    className = {index === selectedIndex ? 'active-suggestion' : ''}
                    onClick = {() => handleSuggestionClick(word)}
                >
                  {word}
                </li>
              ))
            }
          </ul>
        )
      }
    </div>
  );
}

export default App;
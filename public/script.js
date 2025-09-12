let currentWord = '';
let currentTranslation = '';

async function analyzeWord() {
    const word = document.getElementById('wordInput').value.trim();
    if (!word) return;

    currentWord = word;
    
    // Show loading states
    document.getElementById('translationText').textContent = 'Analyzing...';
    document.getElementById('synonymsList').innerHTML = 'Loading...';
    document.getElementById('antonymsList').innerHTML = 'Loading...';
    
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ word })
        });
        
        const data = await response.json();
        
        // Update translation
        document.getElementById('translationText').textContent = data.translation;
        currentTranslation = data.translation;
        
        // Update synonyms and antonyms
        displayWords('synonymsList', data.synonyms);
        displayWords('antonymsList', data.antonyms);
    } catch (error) {
        document.getElementById('translationText').textContent = 'Analysis failed';
        document.getElementById('synonymsList').innerHTML = 'Failed to load';
        document.getElementById('antonymsList').innerHTML = 'Failed to load';
    }
}

function playInputWordAudio() {
    const word = document.getElementById('wordInput').value.trim();
    if (!word) {
        alert('Please enter a word first!');
        return;
    }
    
    const button = document.getElementById('inputAudioBtn');
    button.disabled = true;
    button.innerHTML = '⏸️';
    
    // Use Web Speech API for pronunciation
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    utterance.pitch = 1;
    
    utterance.onend = function() {
        button.disabled = false;
        button.innerHTML = '🔊';
    };
    
    utterance.onerror = function() {
        button.disabled = false;
        button.innerHTML = '🔊';
        alert('Sorry, pronunciation not available for this word.');
    };
    
    speechSynthesis.speak(utterance);
}

function displayWords(elementId, words) {
    const element = document.getElementById(elementId);
    
    if (words.length === 0) {
        element.innerHTML = 'No words found';
        return;
    }
    
    element.innerHTML = `<div class="word-list">${words.map(word => 
        `<span class="word-tag">${word}</span>`
    ).join('')}</div>`;
}

document.getElementById('wordInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        analyzeWord();
    }
});

// Update current word when input changes
document.getElementById('wordInput').addEventListener('input', function(e) {
    currentWord = e.target.value.trim();
});

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
}

// Load saved theme
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
}

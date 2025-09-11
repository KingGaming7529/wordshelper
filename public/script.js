async function analyzeWord() {
    const word = document.getElementById('wordInput').value.trim();
    if (!word) return;

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
        
        // Update synonyms and antonyms
        displayWords('synonymsList', data.synonyms);
        displayWords('antonymsList', data.antonyms);
    } catch (error) {
        document.getElementById('translationText').textContent = 'Analysis failed';
        document.getElementById('synonymsList').innerHTML = 'Failed to load';
        document.getElementById('antonymsList').innerHTML = 'Failed to load';
    }
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

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
}

// Load saved theme
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
}
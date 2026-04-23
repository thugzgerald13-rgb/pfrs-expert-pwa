document.addEventListener('DOMContentLoaded', () => {
  const appContainer = document.getElementById('app');
  let currentQuestionIndex = 0;
  let history = [];

  function renderQuestion(rule) {
    const optionsHtml = rule.options.map((opt, idx) => `
      <button class="option-btn" data-answer="${opt.answer}" data-idx="${idx}">
        <span class="option-icon">${opt.icon}</span>
        <span>${opt.answer}</span>
      </button>
    `).join('');

    appContainer.innerHTML = `
      <div class="question-card">
        <div class="progress">Question ${currentQuestionIndex + 1} of ${pfrfsRules.length}</div>
        <h2>${rule.question}</h2>
        <div class="options-grid">${optionsHtml}</div>
      </div>
      ${history.length > 0 ? '<button id="backBtn" class="back-btn">← Back</button>' : ''}
    `;

    document.querySelectorAll('.option-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const selectedAnswer = e.currentTarget.dataset.answer;
        const selectedOption = rule.options.find(opt => opt.answer === selectedAnswer);
        history.push({ ruleId: rule.id, question: rule.question, selected: selectedOption });
        showResult(selectedOption);
      });
    });

    const backBtn = document.getElementById('backBtn');
    if (backBtn) {
      backBtn.addEventListener('click', goBack);
    }
  }

  function showResult(option) {
    appContainer.innerHTML = `
      <div class="result-card">
        <div class="result-icon">${option.icon}</div>
        <h2>${option.result}</h2>
        <p class="explanation">${option.explanation.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
        <div class="result-actions">
          ${currentQuestionIndex < pfrfsRules.length - 1 ? '<button id="nextBtn" class="next-btn">Next Question →</button>' : '<button id="restartBtn" class="restart-btn">🔄 Start Over</button>'}
          ${history.length > 0 ? '<button id="backToQuestionBtn" class="back-btn">← Back to Question</button>' : ''}
        </div>
      </div>
    `;

    document.getElementById('nextBtn')?.addEventListener('click', () => {
      currentQuestionIndex++;
      renderQuestion(pfrfsRules[currentQuestionIndex]);
    });

    document.getElementById('restartBtn')?.addEventListener('click', restartQuestionnaire);
    document.getElementById('backToQuestionBtn')?.addEventListener('click', goBack);
  }

  function goBack() {
    if (history.length > 0) {
      history.pop();
      currentQuestionIndex = Math.max(0, currentQuestionIndex - 1);
      renderQuestion(pfrfsRules[currentQuestionIndex]);
    }
  }

  function restartQuestionnaire() {
    currentQuestionIndex = 0;
    history = [];
    renderQuestion(pfrfsRules[0]);
  }

  renderQuestion(pfrfsRules[0]);
});
// GLOSSARY SEARCH FUNCTIONALITY
const searchInput = document.getElementById('glossarySearch');
const resultsContainer = document.getElementById('glossaryResults');

if (searchInput && resultsContainer) {
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    
    if (query.length === 0) {
      resultsContainer.innerHTML = '';
      return;
    }

    const matches = pfrsGlossary.filter(item => 
      item.term.toLowerCase().includes(query) || 
      item.definition.toLowerCase().includes(query) ||
      item.standard.toLowerCase().includes(query)
    );

    if (matches.length === 0) {
      resultsContainer.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">No matching terms found. Try a different keyword.</p>';
    } else {
      resultsContainer.innerHTML = matches.map(item => `
        <div style="background: white; padding: 15px; margin-bottom: 10px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #1a73e8;">
          <h3 style="margin: 0 0 5px 0; color: #1a73e8;">${highlightMatch(item.term, query)}</h3>
          <p style="margin: 0 0 8px 0; color: #444; line-height: 1.5;">${highlightMatch(item.definition, query)}</p>
          <span style="display: inline-block; background: #e8f0fe; color: #1a73e8; padding: 3px 10px; border-radius: 12px; font-size: 0.8em; font-weight: bold;">${highlightMatch(item.standard, query)}</span>
        </div>
      `).join('');
    }
  });
}

function highlightMatch(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark style="background: #fff3cd; padding: 1px 3px; border-radius: 2px;">$1</mark>');
}
// LOAD SEC UPDATES
const newsFeed = document.getElementById('newsFeed');
if (newsFeed && typeof secUpdates !== 'undefined') {
  newsFeed.innerHTML = secUpdates.map(item => `
    <div style="background: white; padding: 15px; margin-bottom: 10px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #d32f2f;">
      <span style="font-size: 0.8em; color: #666;">${item.date}</span>
      <h4 style="margin: 5px 0;">${item.title}</h4>
      <p style="color: #444; font-size: 0.9em;">${item.description}</p>
      <a href="${item.link}" target="_blank" style="color: #1a73e8; font-size: 0.9em;">Read more →</a>
    </div>
  `).join('');
}

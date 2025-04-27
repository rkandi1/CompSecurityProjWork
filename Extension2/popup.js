let rules = [{"urlPattern": "api.example.com", "find": "", "replace": "random"}]; 

// Load rules when popup opens
document.addEventListener('DOMContentLoaded', function() {
  browser.runtime.sendMessage({action: "getModificationRules"}, function(response) {
    if (response && response.rules) {
      rules = response.rules;
      renderRules();
    }
  });
  
  document.getElementById('addRule').addEventListener('click', addNewRule);
  document.getElementById('saveRules').addEventListener('click', saveRules);
});

// Render all rules in the popup
function renderRules() {
  const rulesContainer = document.getElementById('rulesList');
  rulesContainer.innerHTML = '';
  
  if (rules.length === 0) {
    rulesContainer.innerHTML = '<p>No modification rules defined. Click "Add Rule" to create one.</p>';
    return;
  }
  
  rules.forEach((rule, index) => {
    const ruleElement = document.createElement('div');
    ruleElement.className = 'rule';
    
    ruleElement.innerHTML = `
      <h3>Rule #${index + 1}</h3>
      <label>URL Pattern (optional):</label>
      <input type="text" class="urlPattern" value="${rule.urlPattern || ''}" placeholder="e.g., api.example.com">
      
      <label>Find (regex):</label>
      <input type="text" class="find" value="${rule.find || ''}" placeholder="e.g., \"userId\":\"\\d+\"">
      
      <label>Replace with:</label>
      <input type="text" class="replace" value="${rule.replace || ''}" placeholder="e.g., \"userId\":\"12345\"">
      
      <button class="deleteRule" data-index="${index}">Delete</button>
    `;
    
    rulesContainer.appendChild(ruleElement);
  });
  
  // Add event listeners to delete buttons
  document.querySelectorAll('.deleteRule').forEach(button => {
    button.addEventListener('click', function() {
      const index = parseInt(this.getAttribute('data-index'));
      rules.splice(index, 1);
      renderRules();
    });
  });
}

// Add a new empty rule
function addNewRule() {
  rules.push({
    urlPattern: '',
    find: '',
    replace: ''
  });
  renderRules();
}

// Save all rules to storage
function saveRules() {
  // Update rules from inputs
  const ruleElements = document.querySelectorAll('.rule');
  rules = Array.from(ruleElements).map((ruleElement, index) => {
    return {
      urlPattern: ruleElement.querySelector('.urlPattern').value,
      find: ruleElement.querySelector('.find').value,
      replace: ruleElement.querySelector('.replace').value
    };
  });
  
  // Send rules to background script
  browser.runtime.sendMessage({
    action: "saveModificationRules",
    rules: rules
  }, function(response) {
    if (response && response.success) {
      alert('Rules saved successfully!');
    } else {
      alert('Error saving rules.');
    }
  });
}
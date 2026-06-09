(function () {
  const form = document.getElementById('guestbook-form');
  const nameInput = document.getElementById('name');
  const messageInput = document.getElementById('message');
  const nameError = document.getElementById('name-error');
  const messageError = document.getElementById('message-error');
  const charCount = document.getElementById('char-count');
  const entriesList = document.getElementById('entries-list');
  const emptyState = document.getElementById('empty-state');

  // Load entries on page load
  loadEntries();

  // Character counter
  messageInput.addEventListener('input', () => {
    const len = messageInput.value.length;
    charCount.textContent = `${len} / 500`;
    if (len > 500) {
      charCount.style.color = '#dc2626';
    } else {
      charCount.style.color = '#A3A3A3';
    }
  });

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const name = nameInput.value.trim();
    const message = messageInput.value.trim();
    const honeypot = document.getElementById('website').value;

    // Client-side validation
    let hasError = false;
    if (!name) {
      showError(nameInput, nameError, 'Name is required');
      hasError = true;
    } else if (name.length > 100) {
      showError(nameInput, nameError, 'Name must be 100 characters or less');
      hasError = true;
    }

    if (!message) {
      showError(messageInput, messageError, 'Message is required');
      hasError = true;
    } else if (message.length > 500) {
      showError(messageInput, messageError, 'Message must be 500 characters or less');
      hasError = true;
    }

    if (hasError) return;

    // Submit
    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, message, honeypot }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.details && data.details.length) {
          data.details.forEach((err) => {
            if (err.toLowerCase().includes('name')) {
              showError(nameInput, nameError, err);
            } else if (err.toLowerCase().includes('message')) {
              showError(messageInput, messageError, err);
            }
          });
        } else {
          alert(data.error || 'Something went wrong. Please try again.');
        }
        return;
      }

      const entry = await res.json();
      prependEntry(entry);
      form.reset();
      charCount.textContent = '0 / 500';
      emptyState.classList.add('hidden');
    } catch (err) {
      console.error('Submit error:', err);
      alert('Network error. Please try again.');
    }
  });

  async function loadEntries() {
    try {
      const res = await fetch('/api/entries');
      if (!res.ok) throw new Error('Failed to load entries');
      const data = await res.json();
      renderEntries(data.entries || []);
    } catch (err) {
      console.error('Load error:', err);
      entriesList.innerHTML = '<p class="empty-state">Unable to load entries. Please refresh.</p>';
    }
  }

  function renderEntries(entries) {
    entriesList.innerHTML = '';
    if (!entries.length) {
      emptyState.classList.remove('hidden');
      return;
    }
    emptyState.classList.add('hidden');
    entries.forEach((entry) => {
      entriesList.appendChild(createEntryElement(entry));
    });
  }

  function prependEntry(entry) {
    emptyState.classList.add('hidden');
    const el = createEntryElement(entry);
    el.style.animationDelay = '0s';
    entriesList.insertBefore(el, entriesList.firstChild);
  }

  function createEntryElement(entry) {
    const div = document.createElement('article');
    div.className = 'entry';
    div.innerHTML = `
      <div class="entry-header">
        <span class="entry-name">${escapeHtml(entry.name)}</span>
        <time class="entry-time" datetime="${entry.created_at}">${formatTime(entry.created_at)}</time>
      </div>
      <p class="entry-message">${escapeHtml(entry.message)}</p>
    `;
    return div;
  }

  function showError(input, errorEl, msg) {
    input.classList.add('error-border');
    errorEl.textContent = msg;
  }

  function clearErrors() {
    nameInput.classList.remove('error-border');
    messageInput.classList.remove('error-border');
    nameError.textContent = '';
    messageError.textContent = '';
  }

  function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function formatTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }
})();

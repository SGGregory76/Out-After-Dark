(function(){
  // Contacts module
  const CONTACTS_URL =
    'https://raw.githubusercontent.com/SGGregory76/Out-After-Dark/main/data/contacts.json'
    + '?t=' + Date.now();

  async function loadContacts() {
    const res = await fetch(CONTACTS_URL);
    if (!res.ok) throw new Error(res.statusText);
    return res.json();
  }

  function createCard(c, onAction) {
    const iconHtml = c.iconClass
      ? `<i class="${c.iconClass}"></i>`
      : `<span>${c.emoji || '❓'}</span>`;

    const card = document.createElement('div');
    card.className = 'contact-card';
    card.innerHTML = `
      <div class="icon">${iconHtml}</div>
      <div class="name">${c.name}</div>
      <div class="role">${c.role}</div>
      <div class="status">Status: ${c.status}</div>
      <button data-action="trade">Trade</button>
      <button data-action="talk">Talk</button>
      <button data-action="mission">Mission</button>
    `;

    card.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        onAction(action, c);
      });
    });

    return card;
  }

  function renderGrid(contacts) {
    const grid = document.getElementById('contacts-grid');
    if (!grid) return;
    grid.innerHTML = '';

    contacts.forEach(c => {
      const card = createCard(c, handleAction);
      grid.appendChild(card);
    });
  }

  function handleAction(action, npc) {
    switch(action) {
      case 'trade':
        openTradeModal(npc);
        break;
      case 'talk':
        openTalkModal(npc);
        break;
      case 'mission':
        startMission(npc.missions[0]);
        break;
    }
  }

  // Stub handlers - replace with actual logic
  function openTradeModal(npc) {
    alert(`Trade with ${npc.name}\nOffers: ${npc.offers.join(', ') || 'None'}`);
  }
  function openTalkModal(npc) {
    alert(`Talking to ${npc.name}...`);
  }
  function startMission(missionId) {
    if (typeof runFlow === 'function') runFlow(missionId);
    else alert(`Start mission: ${missionId}`);
  }

  // Initialization
  window.Contacts = {
    init: async function() {
      try {
        const contacts = await loadContacts();
        renderGrid(contacts);
      } catch(err) {
        const grid = document.getElementById('contacts-grid');
        if (grid) grid.innerHTML = `<div class="loading error">Error: ${err.message}</div>`;
      }
    }
  };

  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('contacts-grid')) {
      Contacts.init();
    }
  });
})();


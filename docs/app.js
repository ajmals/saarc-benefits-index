let globalData = null;
let selectedPair = null;

fetch('./data/bilateral_matrix.json')
  .then(res => res.json())
  .then(data => {
    globalData = data;
    initVisualization();
    renderRegionalCentres(data.centres);
  })
  .catch(err => {
    // Fallback for root-relative loading during local dev
    fetch('../data/bilateral_matrix.json')
      .then(res => res.json())
      .then(data => {
        globalData = data;
        initVisualization();
        renderRegionalCentres(data.centres);
      });
  });

function initVisualization() {
  renderHeatmap();

  document.getElementById('category-select').addEventListener('change', () => {
    renderHeatmap();
    if (selectedPair) {
      displayDetails(selectedPair.provider, selectedPair.beneficiary);
    }
  });

  document.getElementById('persona-select').addEventListener('change', () => {
    renderHeatmap();
    if (selectedPair) {
      displayDetails(selectedPair.provider, selectedPair.beneficiary);
    }
  });

  // Default selection to showcase inspector on initial load
  displayDetails('IND', 'NPL');
}

function renderHeatmap() {
  const { countries, scores_total, scores_by_cat } = globalData;
  const catFilter = document.getElementById('category-select').value;
  const activeScoreMap = catFilter === 'total' ? scores_total : scores_by_cat[catFilter];

  const zValues = countries.map(p =>
    countries.map(b => (p === b ? null : (activeScoreMap[p]?.[b] || 0)))
  );

  const plotData = [{
    z: zValues,
    x: countries,
    y: countries,
    type: 'heatmap',
    colorscale: [
      [0.0, '#1e293b'],
      [0.2, '#0f766e'],
      [0.5, '#0d9488'],
      [0.8, '#14b8a6'],
      [1.0, '#5eead4']
    ],
    hoverongaps: false,
    colorbar: {
      title: 'Score',
      tickfont: { color: '#94a3b8' },
      titlefont: { color: '#f8fafc' }
    }
  }];

  const layout = {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    margin: { t: 40, r: 20, l: 60, b: 60 },
    xaxis: {
      title: { text: 'Beneficiary State', font: { color: '#94a3b8' } },
      tickfont: { color: '#f8fafc' },
      gridcolor: '#334155'
    },
    yaxis: {
      title: { text: 'Provider State', font: { color: '#94a3b8' } },
      tickfont: { color: '#f8fafc' },
      autorange: 'reversed',
      gridcolor: '#334155'
    },
    autosize: true
  };

  Plotly.newPlot('matrix-heatmap', plotData, layout, { responsive: true, displayModeBar: false });

  document.getElementById('matrix-heatmap').on('plotly_click', data => {
    const pt = data.points[0];
    displayDetails(pt.y, pt.x);
  });
}

function displayDetails(provider, beneficiary) {
  selectedPair = { provider, beneficiary };
  const placeholder = document.getElementById('placeholder-msg');
  const container = document.getElementById('provisions-container');
  placeholder.style.display = 'none';

  const rawList = globalData.details[provider]?.[beneficiary] || [];
  const persona = document.getElementById('persona-select').value;
  const cat = document.getElementById('category-select').value;

  const filtered = rawList.filter(item => {
    const matchPersona = persona === 'all' || item.target_audience === persona;
    const matchCat = cat === 'total' || item.category === cat;
    return matchPersona && matchCat;
  });

  container.innerHTML = `<h4>${provider} → ${beneficiary} (${filtered.length} provisions)</h4>`;

  if (filtered.length === 0) {
    container.innerHTML += `<p class="empty-notice">No provisions found matching the selected filters.</p>`;
    return;
  }

  const list = document.createElement('div');
  list.className = 'cards-list';

  filtered.forEach(p => {
    const card = document.createElement('div');
    card.className = 'provision-card';
    card.innerHTML = `
      <div class="card-header">
        <span class="badge ${p.category}">${p.category.replace('_', ' ')}</span>
        <span class="badge-level">Level ${p.level}</span>
      </div>
      <h5><a href="${p.url}" target="_blank" rel="noopener noreferrer" class="title-link">${p.title} ↗</a></h5>
      <p class="desc">${p.legal_framework}</p>
      ${p.monetary_value ? `<p class="metric"><strong>Value / Concession:</strong> ${p.monetary_value}</p>` : ''}
      <div class="card-footer">
        <a href="${p.url}" target="_blank" rel="noopener noreferrer">
          Source: ${p.source} ↗
        </a>
      </div>
    `;
    list.appendChild(card);
  });

  container.appendChild(list);
}

function renderRegionalCentres(centres) {
  const grid = document.getElementById('centres-grid');
  if (!grid || !centres) return;

  grid.innerHTML = centres.map(c => `
    <div class="centre-card">
      <div class="centre-top">
        <span class="code">${c.centre_code}</span>
        <span class="location">${c.city}, ${c.host_country_iso}</span>
      </div>
      <h4>${c.name}</h4>
      <p class="focus"><strong>Focus:</strong> ${c.focus_area}</p>
      <p class="program">${c.key_program}</p>
      <a href="${c.source_url}" target="_blank" rel="noopener noreferrer" class="centre-link">Official Portal ↗</a>
    </div>
  `).join('');
}

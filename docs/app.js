/**
 * South Asian Bilateral Relations & Benefits Index
 * Multi-View Interactive Visualizer:
 * 1. Matrix Grid (Plotly Heatmap)
 * 2. Partner Rankings (Plotly Stacked Horizontal Bar)
 * 3. Reciprocity Balance (Diverging Given vs. Received Bar)
 * 4. Sector Profile Radar (Polar Spider Chart)
 */

let globalData = null;
let selectedPair = null;
let activeView = 'matrix'; // 'matrix' | 'rankings' | 'reciprocity' | 'radar'
let focusCountry = 'IND';

const COUNTRY_FLAGS = {
  AFG: '🇦🇫',
  BGD: '🇧🇩',
  BTN: '🇧🇹',
  IND: '🇮🇳',
  MDV: '🇲🇻',
  NPL: '🇳🇵',
  PAK: '🇵🇰',
  LKA: '🇱🇰'
};

const COUNTRY_NAMES = {
  AFG: 'Afghanistan',
  BGD: 'Bangladesh',
  BTN: 'Bhutan',
  IND: 'India',
  MDV: 'Maldives',
  NPL: 'Nepal',
  PAK: 'Pakistan',
  LKA: 'Sri Lanka'
};

const CATEGORY_LABELS = {
  total: 'All Dimensions',
  trade: 'Trade & Transit',
  tourism_culture: 'Tourism & Culture',
  education: 'Education & Scholarships',
  mobility_visa: 'Mobility & Visas',
  finance_bilateral: 'Finance & Bilateral'
};

const CATEGORY_COLORS = {
  trade: '#2563eb',             // Royal Blue
  tourism_culture: '#f59e0b',   // Warm Amber
  education: '#8b5cf6',         // Soft Violet
  mobility_visa: '#10b981',     // Emerald
  finance_bilateral: '#d97706'  // Deep Ochre
};

// Data loading with fallbacks
fetch('./data/bilateral_matrix.json')
  .then(res => res.json())
  .then(data => handleDataLoaded(data))
  .catch(err => {
    fetch('../data/bilateral_matrix.json')
      .then(res => res.json())
      .then(data => handleDataLoaded(data))
      .catch(e => {
        fetch('data/bilateral_matrix.json')
          .then(res => res.json())
          .then(data => handleDataLoaded(data))
          .catch(fatal => console.error('Failed to load matrix dataset:', fatal));
      });
  });

function handleDataLoaded(data) {
  globalData = data;
  initVisualization();
  renderRegionalCentres(data.centres);
  updateHeaderStats();
}

function updateHeaderStats() {
  if (!globalData) return;
  const totalProvEl = document.getElementById('stat-total-provisions');
  const regionalCentresEl = document.getElementById('stat-regional-centres');

  if (regionalCentresEl && globalData.centres) {
    regionalCentresEl.textContent = globalData.centres.length;
    const subVal = regionalCentresEl.parentElement.querySelector('.stat-sub-val');
    if (subVal) subVal.textContent = `/ ${globalData.centres.length}`;
  }

  // Count unique master provision IDs
  const uniqueIds = new Set();
  if (globalData.details) {
    Object.values(globalData.details).forEach(beneMap => {
      Object.values(beneMap).forEach(list => {
        list.forEach(item => {
          if (item.id) uniqueIds.add(item.id);
          else if (item.benefit_id) uniqueIds.add(item.benefit_id);
        });
      });
    });
  }
  if (totalProvEl && uniqueIds.size > 0) {
    totalProvEl.textContent = uniqueIds.size;
  }
}

function initVisualization() {
  renderActiveView();
  setupEventListeners();

  // Default selection to showcase inspector on initial load
  displayDetails('IND', 'NPL');
}

function setupEventListeners() {
  const catSelect = document.getElementById('category-select');
  const personaSelect = document.getElementById('persona-select');
  const focusCountrySelect = document.getElementById('focus-country-select');

  catSelect.addEventListener('change', () => {
    updateBadge();
    renderActiveView();
    if (selectedPair) {
      displayDetails(selectedPair.provider, selectedPair.beneficiary);
    }
  });

  personaSelect.addEventListener('change', () => {
    renderActiveView();
    if (selectedPair) {
      displayDetails(selectedPair.provider, selectedPair.beneficiary);
    }
  });

  if (focusCountrySelect) {
    focusCountrySelect.addEventListener('change', (e) => {
      focusCountry = e.target.value;
      renderActiveView();
      // Auto-inspect the top partner for this focus country
      autoSelectTopPartner(focusCountry);
    });
  }

  // View tabs switcher
  const viewTabBtns = document.querySelectorAll('.view-tab-btn');
  viewTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      viewTabBtns.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      activeView = btn.dataset.view;

      updateViewChrome();
      renderActiveView();
    });
  });

  // Quick Chips
  document.querySelectorAll('[data-pair]').forEach(btn => {
    btn.addEventListener('click', () => {
      const pair = btn.getAttribute('data-pair');
      if (pair) {
        const [p, b] = pair.split('-');
        focusCountry = p;
        if (focusCountrySelect) focusCountrySelect.value = p;
        displayDetails(p, b);
        if (activeView !== 'matrix') {
          renderActiveView();
        }
      }
    });
  });

  // Cycle button (+)
  const cycleList = [
    ['IND', 'NPL'],
    ['BTN', 'IND'],
    ['IND', 'BTN'],
    ['BGD', 'NPL'],
    ['IND', 'MDV'],
    ['PAK', 'LKA'],
    ['BGD', 'BTN'],
    ['IND', 'LKA']
  ];
  let cycleIdx = 0;
  const cycleBtn = document.getElementById('btn-cycle-pair');
  if (cycleBtn) {
    cycleBtn.addEventListener('click', () => {
      cycleIdx = (cycleIdx + 1) % cycleList.length;
      const [p, b] = cycleList[cycleIdx];
      focusCountry = p;
      if (focusCountrySelect) focusCountrySelect.value = p;
      displayDetails(p, b);
      if (activeView !== 'matrix') {
        renderActiveView();
      }
    });
  }

  // Modal & Methodology triggers
  const btnInfo = document.getElementById('btn-info');
  const btnMenu = document.getElementById('btn-menu');
  const modalClose = document.getElementById('modal-close');
  const aboutModal = document.getElementById('about-modal');
  const dockAbout = document.getElementById('dock-btn-about');

  const scrollToMethodology = () => {
    const methSection = document.getElementById('top-methodology-guide') || document.getElementById('methodology-section');
    if (methSection) {
      methSection.scrollIntoView({ behavior: 'smooth' });
      methSection.style.transition = 'box-shadow 0.3s ease';
      methSection.style.boxShadow = '0 0 0 2px var(--color-black)';
      setTimeout(() => {
        methSection.style.boxShadow = '';
      }, 1500);
    }
  };

  const openModal = () => { if (aboutModal) aboutModal.style.display = 'flex'; };
  const closeModal = () => { if (aboutModal) aboutModal.style.display = 'none'; };

  if (btnInfo) btnInfo.addEventListener('click', scrollToMethodology);
  if (btnMenu) btnMenu.addEventListener('click', openModal);
  if (dockAbout) {
    dockAbout.addEventListener('click', () => {
      updateActiveDock(dockAbout);
      scrollToMethodology();
    });
  }
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (aboutModal) {
    aboutModal.addEventListener('click', (e) => {
      if (e.target === aboutModal) closeModal();
    });
  }

  // Bottom dock handlers
  const dockMatrix = document.getElementById('dock-btn-matrix');
  const dockInspector = document.getElementById('dock-btn-inspector');
  const dockCentres = document.getElementById('dock-btn-centres');

  const updateActiveDock = (activeBtn) => {
    document.querySelectorAll('.nav-dock-item').forEach(el => el.classList.remove('active'));
    if (activeBtn) activeBtn.classList.add('active');
  };

  if (dockMatrix) {
    dockMatrix.addEventListener('click', () => {
      updateActiveDock(dockMatrix);
      document.getElementById('matrix-section')?.scrollIntoView({ behavior: 'smooth' });
    });
  }
  if (dockInspector) {
    dockInspector.addEventListener('click', () => {
      updateActiveDock(dockInspector);
      document.getElementById('inspector-section')?.scrollIntoView({ behavior: 'smooth' });
    });
  }
  if (dockCentres) {
    dockCentres.addEventListener('click', () => {
      updateActiveDock(dockCentres);
      document.getElementById('centres-section')?.scrollIntoView({ behavior: 'smooth' });
    });
  }
}

function updateBadge() {
  const cat = document.getElementById('category-select').value;
  const badge = document.getElementById('current-view-badge');
  if (badge) {
    badge.textContent = CATEGORY_LABELS[cat] || 'Aggregate Score';
  }
}

function updateViewChrome() {
  const focusControls = document.getElementById('view-focus-controls');
  const mainTitle = document.getElementById('view-main-title');
  const caption = document.getElementById('view-caption');
  const hintText = document.getElementById('view-hint-text');
  const badgeType = document.getElementById('view-badge-type');

  const countryName = COUNTRY_NAMES[focusCountry] || focusCountry;
  const countryFlag = COUNTRY_FLAGS[focusCountry] || '';

  if (activeView === 'matrix') {
    if (focusControls) focusControls.style.display = 'none';
    if (badgeType) badgeType.textContent = 'HEATMAP MATRIX';
    if (mainTitle) mainTitle.textContent = 'Bilateral Relationship Matrix';
    if (caption) {
      caption.innerHTML = `
        <span class="axis-guide"><strong>Rows (Y):</strong> Provider / Granting State</span>
        <span class="axis-divider">•</span>
        <span class="axis-guide"><strong>Columns (X):</strong> Beneficiary / Recipient State</span>
      `;
    }
    if (hintText) {
      hintText.innerHTML = `<span class="hint-bullet">●</span> Click on any colored cell in the matrix to view the treaties, concessions, and official source links between those two nations.`;
    }
  } else if (activeView === 'rankings') {
    if (focusControls) focusControls.style.display = 'flex';
    if (badgeType) badgeType.textContent = 'PARTNERSHIP RANKINGS';
    if (mainTitle) mainTitle.textContent = `${countryFlag} ${countryName}'s Top Regional Partners`;
    if (caption) {
      caption.innerHTML = `Ranked by total concession points granted to neighbors, segmented by sector.`;
    }
    if (hintText) {
      hintText.innerHTML = `<span class="hint-bullet">●</span> Click any bar to inspect the specific bilateral provisions between ${focusCountry} and that partner.`;
    }
  } else if (activeView === 'reciprocity') {
    if (focusControls) focusControls.style.display = 'flex';
    if (badgeType) badgeType.textContent = 'RECIPROCITY BALANCE';
    if (mainTitle) mainTitle.textContent = `${countryFlag} ${countryName}: Concessions Given vs. Received`;
    if (caption) {
      caption.innerHTML = `Comparing privileges <strong>Given to neighbors</strong> (outbound) vs. <strong>Received from neighbors</strong> (inbound).`;
    }
    if (hintText) {
      hintText.innerHTML = `<span class="hint-bullet">●</span> Balanced bars indicate deep reciprocal partnerships; one-sided bars show unilateral concessions. Click any partner to inspect.`;
    }
  } else if (activeView === 'radar') {
    if (focusControls) focusControls.style.display = 'flex';
    const pairBeneficiary = (selectedPair && selectedPair.provider === focusCountry) ? selectedPair.beneficiary : 'NPL';
    const beneName = COUNTRY_NAMES[pairBeneficiary] || pairBeneficiary;
    const beneFlag = COUNTRY_FLAGS[pairBeneficiary] || '';

    if (badgeType) badgeType.textContent = 'SECTOR RADAR PROFILE';
    if (mainTitle) mainTitle.textContent = `${countryFlag} ${focusCountry} → ${beneFlag} ${pairBeneficiary} Sector Profile`;
    if (caption) {
      caption.innerHTML = `Multi-axis distribution of concessions across the 5 cooperation sectors.`;
    }
    if (hintText) {
      hintText.innerHTML = `<span class="hint-bullet">●</span> Click any quick-chip or matrix cell to switch the radar pair profile.`;
    }
  }
}

function autoSelectTopPartner(c) {
  if (!globalData) return;
  const partners = (globalData.countries || []).filter(p => p !== c);
  let bestP = partners[0] || 'NPL';
  let bestScore = -1;

  partners.forEach(b => {
    const score = globalData.scores_total[c]?.[b] || 0;
    if (score > bestScore) {
      bestScore = score;
      bestP = b;
    }
  });

  displayDetails(c, bestP);
}

/**
 * Route to active graph rendering function
 */
function renderActiveView() {
  updateViewChrome();
  if (activeView === 'matrix') {
    renderHeatmap();
  } else if (activeView === 'rankings') {
    renderPartnerRankings();
  } else if (activeView === 'reciprocity') {
    renderReciprocityBalance();
  } else if (activeView === 'radar') {
    renderSectorRadar();
  }
}

/**
 * 1. Heatmap Matrix
 */
function renderHeatmap() {
  if (!globalData) return;
  const { countries, details, scores_total, scores_by_cat } = globalData;
  const catFilter = document.getElementById('category-select').value;
  const personaFilter = document.getElementById('persona-select').value;

  const zValues = [];
  const hoverText = [];

  for (let i = 0; i < countries.length; i++) {
    const p = countries[i];
    const rowScores = [];
    const rowTexts = [];

    for (let j = 0; j < countries.length; j++) {
      const b = countries[j];
      if (p === b) {
        rowScores.push(0);
        rowTexts.push(`<b>${COUNTRY_FLAGS[p] || ''} ${p}</b><br>Domestic Jurisdiction (N/A)`);
        continue;
      }

      if (personaFilter === 'all') {
        const baseScore = catFilter === 'total' 
          ? (scores_total[p]?.[b] || 0) 
          : (scores_by_cat[catFilter]?.[p]?.[b] || 0);
        rowScores.push(baseScore);
      } else {
        const pairProvs = details[p]?.[b] || [];
        const score = pairProvs.reduce((acc, item) => {
          const matchCat = catFilter === 'total' || item.category === catFilter;
          const matchPersona = item.target_audience === personaFilter;
          return matchCat && matchPersona ? acc + (item.level || item.benefit_level || 0) : acc;
        }, 0);
        rowScores.push(score);
      }

      const pairProvs = (details[p]?.[b] || []).filter(item => {
        const matchCat = catFilter === 'total' || item.category === catFilter;
        const matchPersona = personaFilter === 'all' || item.target_audience === personaFilter;
        return matchCat && matchPersona;
      });

      const currentScore = rowScores[rowScores.length - 1];
      rowTexts.push(
        `<b>${COUNTRY_FLAGS[p] || ''} ${p} → ${COUNTRY_FLAGS[b] || ''} ${b}</b><br>` +
        `Dimension: ${CATEGORY_LABELS[catFilter] || catFilter}<br>` +
        `Score: <b>${currentScore} pts</b><br>` +
        `Provisions: ${pairProvs.length}<br>` +
        `<i>Click to inspect</i>`
      );
    }
    zValues.push(rowScores);
    hoverText.push(rowTexts);
  }

  const colorscale = [
    [0.0, '#f8fafc'],
    [0.05, '#f1f5f9'],
    [0.15, '#bbf7d0'],
    [0.35, '#34d399'],
    [0.60, '#0d9488'],
    [0.85, '#0f766e'],
    [1.0, '#064e3b']
  ];

  const plotData = [{
    z: zValues,
    x: countries,
    y: countries,
    text: hoverText,
    hoverinfo: 'text',
    type: 'heatmap',
    colorscale: colorscale,
    showscale: true,
    hoverongaps: false,
    colorbar: {
      title: {
        text: 'Score',
        font: { color: '#111827', size: 12, family: '-apple-system, BlinkMacSystemFont, sans-serif' }
      },
      tickfont: { color: '#4b5563', size: 10 },
      thickness: 12,
      len: 0.9,
      outlinecolor: '#111111',
      outlinewidth: 1,
      bordercolor: '#ffffff'
    },
    xgap: 2.5,
    ygap: 2.5
  }];

  const layout = {
    paper_bgcolor: '#ffffff',
    plot_bgcolor: '#ffffff',
    margin: { t: 40, r: 25, l: 80, b: 65 },
    xaxis: {
      title: { 
        text: 'Beneficiary State (Recipient)', 
        font: { color: '#111827', size: 12, family: '-apple-system, BlinkMacSystemFont, sans-serif' },
        standoff: 15
      },
      tickmode: 'array',
      tickvals: countries,
      ticktext: countries.map(c => `${COUNTRY_FLAGS[c] || ''} ${c}`),
      tickfont: { color: '#111827', size: 11, family: 'monospace', weight: '700' },
      gridcolor: '#f3f4f6',
      zeroline: false,
      linecolor: '#111111',
      linewidth: 1.5,
      side: 'bottom'
    },
    yaxis: {
      title: { 
        text: 'Provider State (Grantor)', 
        font: { color: '#111827', size: 12, family: '-apple-system, BlinkMacSystemFont, sans-serif' },
        standoff: 15
      },
      autorange: 'reversed',
      tickmode: 'array',
      tickvals: countries,
      ticktext: countries.map(c => `${COUNTRY_FLAGS[c] || ''} ${c}`),
      tickfont: { color: '#111827', size: 11, family: 'monospace', weight: '700' },
      gridcolor: '#f3f4f6',
      zeroline: false,
      linecolor: '#111111',
      linewidth: 1.5
    },
    hoverlabel: {
      bgcolor: '#111111',
      bordercolor: '#111111',
      font: { family: '-apple-system, BlinkMacSystemFont, sans-serif', color: '#ffffff', size: 12 }
    },
    autosize: true
  };

  const heatmapEl = document.getElementById('matrix-heatmap');
  Plotly.react(heatmapEl, plotData, layout, { responsive: true, displayModeBar: false });

  heatmapEl.removeAllListeners?.('plotly_click');
  heatmapEl.on('plotly_click', data => {
    if (data.points && data.points.length > 0) {
      const pt = data.points[0];
      displayDetails(pt.y, pt.x);
    }
  });
}

/**
 * 2. Partner Rankings (Stacked Horizontal Bar by Sector)
 */
function renderPartnerRankings() {
  if (!globalData) return;
  const p = focusCountry;
  const partners = (globalData.countries || []).filter(c => c !== p);

  // Compute breakdown for each partner
  const sectors = ['trade', 'mobility_visa', 'education', 'tourism_culture', 'finance_bilateral'];
  const partnerData = partners.map(b => {
    const rawList = globalData.details?.[p]?.[b] || [];
    const sectorScores = {};
    sectors.forEach(s => sectorScores[s] = 0);
    let total = 0;
    rawList.forEach(item => {
      const level = item.level || item.benefit_level || 0;
      if (sectorScores[item.category] !== undefined) {
        sectorScores[item.category] += level;
      }
      total += level;
    });
    return {
      beneficiary: b,
      name: COUNTRY_NAMES[b] || b,
      label: `${COUNTRY_FLAGS[b] || ''} ${b}`,
      total: total,
      scores: sectorScores,
      count: rawList.length
    };
  });

  // Sort partners ascending so the highest rank appears at the top of the horizontal bar chart
  partnerData.sort((a, b) => a.total - b.total);

  const yLabels = partnerData.map(d => d.label);

  const traces = sectors.map(sec => ({
    x: partnerData.map(d => d.scores[sec]),
    y: yLabels,
    name: CATEGORY_LABELS[sec],
    type: 'bar',
    orientation: 'h',
    marker: {
      color: CATEGORY_COLORS[sec],
      line: { color: '#ffffff', width: 1 }
    },
    hoverinfo: 'x+name+y'
  }));

  const layout = {
    barmode: 'stack',
    paper_bgcolor: '#ffffff',
    plot_bgcolor: '#ffffff',
    margin: { t: 30, r: 25, l: 90, b: 60 },
    legend: {
      orientation: 'h',
      y: 1.15,
      x: 0,
      font: { size: 11, color: '#111827' }
    },
    xaxis: {
      title: {
        text: 'Total Weighted Benefit Score (Points)',
        font: { color: '#111827', size: 12 }
      },
      gridcolor: '#f3f4f6',
      zeroline: true,
      zerolinecolor: '#111111'
    },
    yaxis: {
      tickfont: { color: '#111827', size: 12, family: 'monospace', weight: '700' },
      linecolor: '#111111',
      linewidth: 1.5
    },
    hoverlabel: {
      bgcolor: '#111111',
      font: { color: '#ffffff', size: 12 }
    },
    autosize: true
  };

  const container = document.getElementById('matrix-heatmap');
  Plotly.react(container, traces, layout, { responsive: true, displayModeBar: false });

  container.removeAllListeners?.('plotly_click');
  container.on('plotly_click', (data) => {
    if (data.points && data.points.length > 0) {
      const idx = data.points[0].pointIndex;
      const clickedPartner = partnerData[idx];
      if (clickedPartner) {
        displayDetails(p, clickedPartner.beneficiary);
      }
    }
  });
}

/**
 * 3. Reciprocity Balance (Diverging Bar: Given vs Received)
 */
function renderReciprocityBalance() {
  if (!globalData) return;
  const c = focusCountry;
  const partners = (globalData.countries || []).filter(p => p !== c);

  const balanceData = partners.map(p => {
    const givenScore = globalData.scores_total[c]?.[p] || 0;
    const receivedScore = globalData.scores_total[p]?.[c] || 0;
    const net = givenScore - receivedScore;
    return {
      partner: p,
      name: COUNTRY_NAMES[p] || p,
      label: `${COUNTRY_FLAGS[p] || ''} ${p}`,
      given: givenScore,
      received: receivedScore,
      net: net
    };
  });

  // Sort by total engagement (given + received)
  balanceData.sort((a, b) => (a.given + a.received) - (b.given + b.received));

  const yLabels = balanceData.map(d => d.label);

  const traceReceived = {
    x: balanceData.map(d => -d.received),
    y: yLabels,
    name: `Received from Neighbor`,
    type: 'bar',
    orientation: 'h',
    marker: {
      color: '#0d9488', // Emerald/Teal
      line: { color: '#111111', width: 1 }
    },
    hovertext: balanceData.map(d => `${d.name} grants ${d.received} pts to ${c}`),
    hoverinfo: 'text'
  };

  const traceGiven = {
    x: balanceData.map(d => d.given),
    y: yLabels,
    name: `Given to Neighbor`,
    type: 'bar',
    orientation: 'h',
    marker: {
      color: '#2563eb', // Royal Blue
      line: { color: '#111111', width: 1 }
    },
    hovertext: balanceData.map(d => `${c} grants ${d.given} pts to ${d.name}`),
    hoverinfo: 'text'
  };

  const layout = {
    barmode: 'relative',
    paper_bgcolor: '#ffffff',
    plot_bgcolor: '#ffffff',
    margin: { t: 30, r: 35, l: 90, b: 60 },
    legend: {
      orientation: 'h',
      y: 1.15,
      x: 0.15,
      font: { size: 11, color: '#111827' }
    },
    xaxis: {
      title: {
        text: '← Received Points (Inbound) &nbsp;|&nbsp; Given Points (Outbound) →',
        font: { color: '#111827', size: 12 }
      },
      tickformat: s => Math.abs(s),
      gridcolor: '#f3f4f6',
      zeroline: true,
      zerolinecolor: '#111111',
      zerolinewidth: 2
    },
    yaxis: {
      tickfont: { color: '#111827', size: 12, family: 'monospace', weight: '700' },
      linecolor: '#111111',
      linewidth: 1.5
    },
    hoverlabel: {
      bgcolor: '#111111',
      font: { color: '#ffffff', size: 12 }
    },
    autosize: true
  };

  const container = document.getElementById('matrix-heatmap');
  Plotly.react(container, [traceReceived, traceGiven], layout, { responsive: true, displayModeBar: false });

  container.removeAllListeners?.('plotly_click');
  container.on('plotly_click', (data) => {
    if (data.points && data.points.length > 0) {
      const idx = data.points[0].pointIndex;
      const clicked = balanceData[idx];
      if (clicked) {
        displayDetails(c, clicked.partner);
      }
    }
  });
}

/**
 * 4. Sector Profile Radar (Spider Polar Chart)
 */
function renderSectorRadar() {
  if (!globalData) return;
  const p = focusCountry;
  const b = (selectedPair && selectedPair.provider === p && selectedPair.beneficiary !== p) 
    ? selectedPair.beneficiary 
    : (p === 'IND' ? 'NPL' : 'IND');

  const sectors = ['trade', 'tourism_culture', 'education', 'mobility_visa', 'finance_bilateral'];
  const sectorNames = sectors.map(s => CATEGORY_LABELS[s]);

  // Outbound Scores (p -> b)
  const rawOutbound = globalData.details?.[p]?.[b] || [];
  const outboundScores = sectors.map(sec => {
    return rawOutbound.filter(i => i.category === sec).reduce((acc, cur) => acc + (cur.level || cur.benefit_level || 0), 0);
  });

  // Inbound Scores (b -> p)
  const rawInbound = globalData.details?.[b]?.[p] || [];
  const inboundScores = sectors.map(sec => {
    return rawInbound.filter(i => i.category === sec).reduce((acc, cur) => acc + (cur.level || cur.benefit_level || 0), 0);
  });

  // Closed polygons for radar
  sectorNames.push(sectorNames[0]);
  outboundScores.push(outboundScores[0]);
  inboundScores.push(inboundScores[0]);

  const traces = [
    {
      type: 'scatterpolar',
      r: outboundScores,
      theta: sectorNames,
      fill: 'toself',
      name: `${p} → ${b} (Outbound)`,
      line: { color: '#2563eb', width: 2 },
      fillcolor: 'rgba(37, 99, 235, 0.25)'
    },
    {
      type: 'scatterpolar',
      r: inboundScores,
      theta: sectorNames,
      fill: 'toself',
      name: `${b} → ${p} (Inbound)`,
      line: { color: '#10b981', width: 2, dash: 'dot' },
      fillcolor: 'rgba(16, 185, 129, 0.2)'
    }
  ];

  const maxVal = Math.max(...outboundScores, ...inboundScores, 3);

  const layout = {
    polar: {
      radialaxis: {
        visible: true,
        range: [0, maxVal + 1],
        tickfont: { size: 9, color: '#4b5563' },
        linecolor: '#e4e4e7',
        gridcolor: '#f3f4f6'
      },
      angularaxis: {
        tickfont: { size: 10, color: '#111827', weight: '700' },
        rotation: 90,
        direction: 'clockwise',
        gridcolor: '#e4e4e7'
      }
    },
    paper_bgcolor: '#ffffff',
    plot_bgcolor: '#ffffff',
    margin: { t: 40, r: 40, l: 40, b: 40 },
    legend: {
      orientation: 'h',
      y: 1.15,
      x: 0.1,
      font: { size: 11, color: '#111827' }
    },
    hoverlabel: {
      bgcolor: '#111111',
      font: { color: '#ffffff', size: 12 }
    },
    autosize: true
  };

  const container = document.getElementById('matrix-heatmap');
  Plotly.react(container, traces, layout, { responsive: true, displayModeBar: false });
}

function buildSegmentedMeter(score, maxScore = 4, color = '#111111') {
  const totalSegments = 5;
  const filledCount = Math.min(Math.round((score / maxScore) * totalSegments), totalSegments);

  let segmentsHtml = '';
  for (let i = 0; i < totalSegments; i++) {
    const isFilled = i < filledCount;
    const bgStyle = isFilled ? `background-color: ${color};` : 'background-color: transparent; border: 1.5px solid #d1d5db;';
    segmentsHtml += `<span class="meter-segment ${isFilled ? 'filled' : ''}" style="${bgStyle}"></span>`;
  }

  return `<div class="segmented-meter" aria-label="${score} out of ${maxScore}">${segmentsHtml}</div>`;
}

/**
 * Display details of the bilateral pair in the Inspector panel
 */
function displayDetails(provider, beneficiary) {
  selectedPair = { provider, beneficiary };
  const placeholder = document.getElementById('placeholder-msg');
  const container = document.getElementById('provisions-container');
  if (placeholder) placeholder.style.display = 'none';

  const pFlag = COUNTRY_FLAGS[provider] || '';
  const bFlag = COUNTRY_FLAGS[beneficiary] || '';
  const pName = globalData?.metadata?.country_names?.[provider] || COUNTRY_NAMES[provider] || provider;
  const bName = globalData?.metadata?.country_names?.[beneficiary] || COUNTRY_NAMES[beneficiary] || beneficiary;

  // Handle Domestic Self-Pair
  if (provider === beneficiary) {
    container.innerHTML = `
      <div class="inspector-header">
        <div class="inspector-top-badge">DOMESTIC JURISDICTION</div>
        <h3 class="inspector-pair-title">
          <span>${pFlag} ${pName} (${provider})</span>
        </h3>
        <p class="inspector-direction-tag">National Boundary • Internal Municipal Statutes</p>
      </div>
      <div class="domestic-notice">
        <div class="domestic-symbol">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="1.5">
            <path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M12 2L2 7h20L12 2z"></path>
          </svg>
        </div>
        <h4 class="domestic-title">Domestic Jurisdiction</h4>
        <p class="domestic-desc">
          Self-pairs (${provider} → ${provider}) denote internal municipal statutes rather than bilateral concessions exchanged between sovereign states. 
          Regional intensity measures cross-border reciprocity exclusively across South Asian partners.
        </p>
      </div>
    `;
    return;
  }

  const rawList = globalData.details?.[provider]?.[beneficiary] || [];
  const persona = document.getElementById('persona-select').value;
  const cat = document.getElementById('category-select').value;

  const filtered = rawList.filter(item => {
    const matchPersona = persona === 'all' || item.target_audience === persona;
    const matchCat = cat === 'total' || item.category === cat;
    return matchPersona && matchCat;
  });

  const totalScore = rawList.reduce((acc, cur) => acc + (cur.level || cur.benefit_level || 0), 0);
  const activeScore = filtered.reduce((acc, cur) => acc + (cur.level || cur.benefit_level || 0), 0);

  // Sector breakdown meter rows
  const categoryScores = {
    trade: 0,
    tourism_culture: 0,
    education: 0,
    mobility_visa: 0,
    finance_bilateral: 0
  };

  rawList.forEach(item => {
    if (categoryScores[item.category] !== undefined) {
      categoryScores[item.category] += (item.level || item.benefit_level || 0);
    }
  });

  const sectorBreakdownHtml = Object.entries(categoryScores).map(([sectorKey, score]) => {
    const catColor = CATEGORY_COLORS[sectorKey] || '#111111';
    const meter = buildSegmentedMeter(score, 4, catColor);
    return `
      <div class="sector-progress-row">
        <span class="sector-progress-label">${CATEGORY_LABELS[sectorKey] || sectorKey}</span>
        <div class="sector-progress-meter-wrap">
          ${meter}
          <span class="sector-progress-val">${score}</span>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `
    <div class="inspector-header">
      <div class="inspector-top-badge">CHANNEL DOSSIER</div>
      <h3 class="inspector-pair-title">
        <span>${pFlag} ${pName}</span>
        <span class="inspector-arrow">→</span>
        <span>${bFlag} ${bName}</span>
      </h3>
      <p class="inspector-direction-tag">
        Provider State: <strong>${provider}</strong> &nbsp;•&nbsp; Beneficiary State: <strong>${beneficiary}</strong>
      </p>

      <div class="inspector-metrics">
        <div class="inspector-ring-card">
          <div class="inspector-metric-score-wrap">
            <span class="inspector-ring-val">${totalScore}</span>
            <span class="inspector-ring-sub">points</span>
          </div>
          <div class="inspector-ring-lbl">Cumulative Score</div>
          <p class="inspector-metric-explain">Weighted total across all benefit levels (1-3 pts each)</p>
        </div>

        <div class="inspector-ring-card">
          <div class="inspector-metric-score-wrap">
            <span class="inspector-ring-val">${rawList.length}</span>
            <span class="inspector-ring-sub">agreements</span>
          </div>
          <div class="inspector-ring-lbl">Active Provisions</div>
          <p class="inspector-metric-explain">Specific treaties, quotas, or bilateral concessions</p>
        </div>
      </div>

      <div class="category-breakdown">
        <div class="breakdown-title">Sector Contribution</div>
        <div class="sector-meters-container">
          ${sectorBreakdownHtml}
        </div>
      </div>
    </div>

    <div class="provisions-container">
      <div class="provisions-heading">
        <span>Verified Legal Provisions</span>
        <span class="provision-count-pill">${filtered.length} of ${rawList.length}</span>
      </div>
    </div>
  `;

  if (filtered.length === 0) {
    const emptyNotice = document.createElement('p');
    emptyNotice.className = 'empty-notice';
    emptyNotice.textContent = 'No provisions found matching the selected dimension and persona filters.';
    container.querySelector('.provisions-container').appendChild(emptyNotice);
    return;
  }

  const list = document.createElement('div');
  list.className = 'cards-list';

  filtered.forEach(p => {
    const card = document.createElement('article');
    card.className = 'provision-card';

    const catBadgeClass = p.category || '';
    const catLabel = CATEGORY_LABELS[p.category] || (p.category ? p.category.replace('_', ' ') : 'General');
    const levelVal = p.level || p.benefit_level || 1;
    const descText = p.description || p.legal_framework || '';
    const monetary = p.monetary_value || p.monetary_value_indicator || '';
    const audience = p.target_audience ? p.target_audience.replace(/_/g, ' ') : '';
    const recip = p.reciprocity || p.reciprocity_type ? (p.reciprocity || p.reciprocity_type).replace(/_/g, ' ') : '';
    const statusVal = p.status || p.operational_status || 'active';
    const verified = p.last_verified || p.last_verified_date || '';
    const sourceName = p.source || p.source_name || 'Official Treaty Register';
    const sourceUrl = p.url || p.source_url || '#';

    card.innerHTML = `
      <div class="card-header">
        <span class="badge ${catBadgeClass}">${escapeHtml(catLabel)}</span>
        <span class="badge-level">Level ${levelVal}</span>
      </div>

      <h5>
        <a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer" class="title-link">
          ${escapeHtml(p.title)} ↗
        </a>
      </h5>

      ${descText ? `<p class="desc">${escapeHtml(descText)}</p>` : ''}

      ${monetary ? `
        <div class="metric">
          <strong>Value / Concession:</strong> ${escapeHtml(monetary)}
        </div>
      ` : ''}

      <div class="provision-details-grid">
        ${audience ? `<span class="detail-pill">Audience: ${escapeHtml(audience)}</span>` : ''}
        ${recip ? `<span class="detail-pill">Type: ${escapeHtml(recip)}</span>` : ''}
        ${statusVal ? `<span class="detail-pill">Status: ${escapeHtml(statusVal)}</span>` : ''}
      </div>

      <div class="provision-legal" style="font-size: 0.8rem; color: var(--color-gray-600); margin-top: 0.2rem;">
        <span class="legal-label">Statutory Basis:</span>
        <span>${escapeHtml(p.legal_framework || 'Direct SAARC Accord')}</span>
      </div>

      <div class="card-footer">
        <a href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">
          Source: ${escapeHtml(sourceName)}${verified ? ` • Verified ${escapeHtml(verified)}` : ''} ↗
        </a>
      </div>
    `;
    list.appendChild(card);
  });

  container.querySelector('.provisions-container').appendChild(list);
}

/**
 * Render SAARC Regional Centres with all CSV metadata
 */
function renderRegionalCentres(centres) {
  const grid = document.getElementById('centres-grid');
  if (!grid || !centres) return;

  grid.innerHTML = centres.map(c => `
    <article class="centre-card">
      <div class="centre-top">
        <span class="code">${escapeHtml(c.centre_code)}</span>
        <span class="location">${escapeHtml(c.city)}, ${escapeHtml(c.host_country_iso)}</span>
      </div>
      <h4>${escapeHtml(c.name)}</h4>
      <p class="focus"><strong>Focus Area:</strong> ${escapeHtml(c.focus_area)}</p>
      ${c.eligibility ? `<p class="eligibility"><strong>Eligibility:</strong> ${escapeHtml(c.eligibility)}</p>` : ''}
      <p class="program">${escapeHtml(c.key_program)}</p>
      <a href="${escapeHtml(c.source_url)}" target="_blank" rel="noopener noreferrer" class="centre-link">
        ${escapeHtml(c.source_name || 'Official Portal')} ↗
      </a>
    </article>
  `).join('');
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
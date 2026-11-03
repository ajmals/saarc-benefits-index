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
let activeView = 'matrix'; // 'matrix' | 'rankings' | 'quotas' | 'reciprocity' | 'radar'
let focusCountry = 'IND';
let activeQuotaSubview = 'flow'; // 'flow' (Sankey) | 'capacity' (Stacked Bar)
let selectedDiscipline = 'all';
let quotaGroupBy = 'provider'; // 'provider' | 'beneficiary'

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

const DISCIPLINE_COLORS = {
  'Medicine & Health': '#ef4444',        // Vibrant Coral
  'Engineering & Tech': '#2563eb',       // Royal Blue
  'Postgraduate & Research': '#8b5cf6',  // Soft Violet
  'Forestry & Environment': '#10b981'    // Emerald Green
};

const DISCIPLINE_ICONS = {
  'Medicine & Health': '🩺',
  'Engineering & Tech': '⚙️',
  'Postgraduate & Research': '🎓',
  'Forestry & Environment': '🌲'
};

const CONCESSION_COLORS = {
  'Full Scholarship': '#8b5cf6',
  'Domestic Parity': '#10b981',
  'Subsidized Quota': '#f59e0b'
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

  // Student Quota sub-view controls
  const quotaToggleBtns = document.querySelectorAll('.quota-toggle-btn');
  const quotaGroupByCont = document.getElementById('quota-group-by-container');
  quotaToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      quotaToggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeQuotaSubview = btn.dataset.subview;
      if (quotaGroupByCont) {
        quotaGroupByCont.style.display = activeQuotaSubview === 'capacity' ? 'flex' : 'none';
      }
      updateViewChrome();
      renderActiveView();
    });
  });

  const quotaDiscSelect = document.getElementById('quota-discipline-select');
  if (quotaDiscSelect) {
    quotaDiscSelect.addEventListener('change', (e) => {
      selectedDiscipline = e.target.value;
      renderActiveView();
    });
  }

  const quotaGroupSelect = document.getElementById('quota-group-by-select');
  if (quotaGroupSelect) {
    quotaGroupSelect.addEventListener('change', (e) => {
      quotaGroupBy = e.target.value;
      updateViewChrome();
      renderActiveView();
    });
  }

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

  // Centres collapsible header toggle
  const centresSection = document.getElementById('centres-section');
  const btnToggleCentres = document.getElementById('btn-toggle-centres');
  if (btnToggleCentres && centresSection) {
    btnToggleCentres.addEventListener('click', () => {
      const isCollapsed = centresSection.classList.toggle('collapsed');
      const toggleText = btnToggleCentres.querySelector('.toggle-text');
      btnToggleCentres.setAttribute('aria-expanded', !isCollapsed);
      if (toggleText) {
        toggleText.textContent = isCollapsed ? 'Show Directory' : 'Hide Directory';
      }
    });
  }

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
      if (centresSection && centresSection.classList.contains('collapsed')) {
        centresSection.classList.remove('collapsed');
        const toggleText = btnToggleCentres?.querySelector('.toggle-text');
        if (toggleText) toggleText.textContent = 'Hide Directory';
      }
      centresSection?.scrollIntoView({ behavior: 'smooth' });
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
  const quotaControls = document.getElementById('view-quota-controls');
  const mainTitle = document.getElementById('view-main-title');
  const caption = document.getElementById('view-caption');
  const hintText = document.getElementById('view-hint-text');
  const badgeType = document.getElementById('view-badge-type');

  const countryName = COUNTRY_NAMES[focusCountry] || focusCountry;
  const countryFlag = COUNTRY_FLAGS[focusCountry] || '';

  if (activeView === 'matrix') {
    if (focusControls) focusControls.style.display = 'none';
    if (quotaControls) quotaControls.style.display = 'none';
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
    if (quotaControls) quotaControls.style.display = 'none';
    if (badgeType) badgeType.textContent = 'PARTNERSHIP RANKINGS';
    if (mainTitle) mainTitle.textContent = `${countryFlag} ${countryName}'s Top Regional Partners`;
    if (caption) {
      caption.innerHTML = `Ranked by total concession points granted to neighbors, segmented by sector.`;
    }
    if (hintText) {
      hintText.innerHTML = `<span class="hint-bullet">●</span> Click any bar to inspect the specific bilateral provisions between ${focusCountry} and that partner.`;
    }
  } else if (activeView === 'quotas') {
    if (focusControls) focusControls.style.display = 'none';
    if (quotaControls) quotaControls.style.display = 'flex';
    if (badgeType) badgeType.textContent = 'STUDENT QUOTA ARCHITECTURE';

    if (activeQuotaSubview === 'flow') {
      if (mainTitle) mainTitle.textContent = '🎓 Cross-Border Student Quota Seat Flow';
      if (caption) {
        caption.innerHTML = `Visualizing reserved academic quota pipelines from <strong>Host State</strong> (left) → <strong>Discipline</strong> (center) → <strong>Recipient State</strong> (right).`;
      }
      if (hintText) {
        hintText.innerHTML = `<span class="hint-bullet">●</span> Hover over flow ribbons to inspect seat volumes; click any country node to inspect its specific quota agreements and statutory circulars.`;
      }
    } else {
      const isProvider = quotaGroupBy === 'provider';
      if (mainTitle) {
        mainTitle.textContent = isProvider ? '🎓 Reserved Quota Capacity by Host Nation' : '🎓 Inbound Quota Seats by Recipient Nation';
      }
      if (caption) {
        caption.innerHTML = `Total annual allocated seats in public universities and institutions, stacked by academic discipline.`;
      }
      if (hintText) {
        hintText.innerHTML = `<span class="hint-bullet">●</span> Click any bar segment to inspect the university circulars, admission quotas, and official fee parity policies for that country.`;
      }
    }
  } else if (activeView === 'reciprocity') {
    if (focusControls) focusControls.style.display = 'flex';
    if (quotaControls) quotaControls.style.display = 'none';
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
    if (quotaControls) quotaControls.style.display = 'none';
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
  } else if (activeView === 'quotas') {
    if (activeQuotaSubview === 'flow') {
      renderStudentQuotasFlow();
    } else {
      renderStudentQuotasCapacity();
    }
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

function hexToRgba(hex, alpha = 0.3) {
  if (!hex || hex[0] !== '#') return `rgba(139, 92, 246, ${alpha})`;
  let c = hex.substring(1);
  if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
  const num = parseInt(c, 16);
  return `rgba(${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}, ${alpha})`;
}

/**
 * 5. Student Quota Visualizations:
 * A) Sankey Flow Diagram (Host Country -> Discipline -> Beneficiary)
 * B) Stacked Bar Chart (Quota Capacity by Country & Discipline)
 */
function renderStudentQuotasFlow() {
  if (!globalData || !globalData.quotas) return;
  const container = document.getElementById('matrix-heatmap');

  // Enforce strict cross-border invariant: exclude any domestic self-allocations
  let quotas = (globalData.quotas || []).filter(q => q.provider_iso !== q.beneficiary_iso);
  if (selectedDiscipline !== 'all') {
    quotas = quotas.filter(q => q.discipline === selectedDiscipline);
  }

  // Identify distinct providers, disciplines, and beneficiaries
  const providerSet = new Set();
  const discSet = new Set();
  const beneSet = new Set();

  quotas.forEach(q => {
    providerSet.add(q.provider_iso);
    discSet.add(q.discipline);
    beneSet.add(q.beneficiary_iso);
  });

  const providers = Array.from(providerSet).sort();
  const disciplines = Array.from(discSet).sort();
  const beneficiaries = Array.from(beneSet).sort();

  if (providers.length === 0 || beneficiaries.length === 0) {
    container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:480px;color:#71717a;font-weight:600;">No student quotas match the selected filters.</div>';
    return;
  }

  // Nodes array:
  // [0 .. P-1] : Providers (Left)
  // [P .. P+D-1] : Disciplines (Center)
  // [P+D .. P+D+B-1] : Beneficiaries (Right)
  const nodeLabels = [];
  const nodeColors = [];
  const nodeMetadata = [];

  const providerIndices = {};
  providers.forEach(p => {
    providerIndices[p] = nodeLabels.length;
    nodeLabels.push(`${COUNTRY_FLAGS[p] || ''} ${p} (${COUNTRY_NAMES[p] || p})`);
    nodeColors.push('#111111');
    nodeMetadata.push({ type: 'provider', iso: p });
  });

  const discIndices = {};
  disciplines.forEach(d => {
    discIndices[d] = nodeLabels.length;
    nodeLabels.push(`${DISCIPLINE_ICONS[d] || '🎓'} ${d}`);
    nodeColors.push(DISCIPLINE_COLORS[d] || '#8b5cf6');
    nodeMetadata.push({ type: 'discipline', name: d });
  });

  const beneIndices = {};
  beneficiaries.forEach(b => {
    beneIndices[b] = nodeLabels.length;
    nodeLabels.push(`${COUNTRY_FLAGS[b] || ''} ${b} (${COUNTRY_NAMES[b] || b})`);
    nodeColors.push('#374151');
    nodeMetadata.push({ type: 'beneficiary', iso: b });
  });

  // Flow links: Stage 1 (Provider -> Discipline), Stage 2 (Discipline -> Beneficiary)
  const provDiscSums = {};
  const discBeneSums = {};

  quotas.forEach(q => {
    const pdKey = `${q.provider_iso}__${q.discipline}`;
    provDiscSums[pdKey] = (provDiscSums[pdKey] || 0) + (q.seats_annual || 0);

    const dbKey = `${q.discipline}__${q.beneficiary_iso}`;
    discBeneSums[dbKey] = (discBeneSums[dbKey] || 0) + (q.seats_annual || 0);
  });

  const sources = [];
  const targets = [];
  const values = [];
  const linkColors = [];
  const linkHover = [];

  // Stage 1 links
  Object.entries(provDiscSums).forEach(([key, seats]) => {
    if (seats <= 0) return;
    const [p, d] = key.split('__');
    sources.push(providerIndices[p]);
    targets.push(discIndices[d]);
    values.push(seats);
    const dColor = DISCIPLINE_COLORS[d] || '#8b5cf6';
    linkColors.push(hexToRgba(dColor, 0.35));
    linkHover.push(`<b>${COUNTRY_FLAGS[p] || ''} ${COUNTRY_NAMES[p] || p}</b> offers <b>${seats} seats/yr</b> in <b>${d}</b><extra></extra>`);
  });

  // Stage 2 links
  Object.entries(discBeneSums).forEach(([key, seats]) => {
    if (seats <= 0) return;
    const [d, b] = key.split('__');
    sources.push(discIndices[d]);
    targets.push(beneIndices[b]);
    values.push(seats);
    const dColor = DISCIPLINE_COLORS[d] || '#8b5cf6';
    linkColors.push(hexToRgba(dColor, 0.35));
    linkHover.push(`<b>${d}</b> allocates <b>${seats} seats/yr</b> to <b>${COUNTRY_FLAGS[b] || ''} ${COUNTRY_NAMES[b] || b}</b><extra></extra>`);
  });

  const trace = {
    type: 'sankey',
    orientation: 'h',
    valueformat: '.0f',
    valuesuffix: ' seats/yr',
    node: {
      pad: 14,
      thickness: 18,
      line: { color: '#111111', width: 1 },
      label: nodeLabels,
      color: nodeColors,
      customdata: nodeMetadata,
      hovertemplate: '<b>%{label}</b><br>Seat Capacity: <b>%{value}</b> seats/yr<extra></extra>'
    },
    link: {
      source: sources,
      target: targets,
      value: values,
      color: linkColors,
      hovertemplate: '%{customdata}<extra></extra>',
      customdata: linkHover
    }
  };

  const layout = {
    paper_bgcolor: '#ffffff',
    plot_bgcolor: '#ffffff',
    margin: { t: 25, r: 25, l: 25, b: 25 },
    font: {
      family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      size: 11,
      color: '#111827'
    },
    hoverlabel: {
      bgcolor: '#111111',
      font: { color: '#ffffff', size: 12 }
    },
    autosize: true
  };

  Plotly.react(container, [trace], layout, { responsive: true, displayModeBar: false });

  container.removeAllListeners?.('plotly_click');
  container.on('plotly_click', (eventData) => {
    if (eventData.points && eventData.points[0]) {
      const pt = eventData.points[0];
      if (pt.customdata && pt.customdata.iso) {
        displayCountryQuotaDossier(pt.customdata.iso, pt.customdata.type);
      }
    }
  });
}

function renderStudentQuotasCapacity() {
  if (!globalData || !globalData.quotas) return;
  const container = document.getElementById('matrix-heatmap');

  // Enforce strict cross-border invariant: exclude any domestic self-allocations
  let quotas = (globalData.quotas || []).filter(q => q.provider_iso !== q.beneficiary_iso);
  if (selectedDiscipline !== 'all') {
    quotas = quotas.filter(q => q.discipline === selectedDiscipline);
  }

  const isByProvider = (quotaGroupBy === 'provider');
  const primaryKey = isByProvider ? 'provider_iso' : 'beneficiary_iso';

  const countries = Array.from(new Set(quotas.map(q => q[primaryKey]))).sort();
  const disciplines = Object.keys(DISCIPLINE_COLORS);

  const traces = disciplines.map(disc => {
    const yVals = countries.map(c => {
      const match = quotas.filter(q => q[primaryKey] === c && q.discipline === disc);
      return match.reduce((sum, item) => sum + (item.seats_annual || 0), 0);
    });

    const xLabels = countries.map(c => `${COUNTRY_FLAGS[c] || ''} ${c}`);

    return {
      name: disc,
      type: 'bar',
      x: xLabels,
      y: yVals,
      customdata: countries,
      marker: {
        color: DISCIPLINE_COLORS[disc] || '#8b5cf6',
        line: { color: '#ffffff', width: 1 }
      },
      hovertemplate: `<b>%{x}</b><br>${disc}: <b>%{y}</b> annual seats<extra></extra>`
    };
  }).filter(t => t.y.some(val => val > 0));

  const layout = {
    barmode: 'stack',
    paper_bgcolor: '#ffffff',
    plot_bgcolor: '#ffffff',
    margin: { t: 30, r: 25, l: 60, b: 65 },
    legend: {
      orientation: 'h',
      y: 1.15,
      x: 0,
      font: { size: 11, color: '#111827' }
    },
    xaxis: {
      title: {
        text: isByProvider ? 'Host / Provider State' : 'Beneficiary / Recipient State',
        font: { color: '#111827', size: 12 }
      },
      tickfont: { color: '#111827', size: 12, weight: '700' },
      linecolor: '#111111',
      linewidth: 1.5
    },
    yaxis: {
      title: {
        text: 'Total Reserved Seats (Annual Quota)',
        font: { color: '#111827', size: 12 }
      },
      gridcolor: '#f3f4f6',
      zeroline: true,
      zerolinecolor: '#111111'
    },
    hoverlabel: {
      bgcolor: '#111111',
      font: { color: '#ffffff', size: 12 }
    },
    autosize: true
  };

  Plotly.react(container, traces, layout, { responsive: true, displayModeBar: false });

  container.removeAllListeners?.('plotly_click');
  container.on('plotly_click', (eventData) => {
    if (eventData.points && eventData.points[0]) {
      const countryIso = eventData.points[0].customdata;
      if (countryIso) {
        displayCountryQuotaDossier(countryIso, isByProvider ? 'provider' : 'beneficiary');
      }
    }
  });
}

/**
 * Display Country-Level Student Quotas Dossier in Inspector Panel
 */
function displayCountryQuotaDossier(countryIso, role = 'provider') {
  const placeholder = document.getElementById('placeholder-msg');
  const container = document.getElementById('provisions-container');
  if (placeholder) placeholder.style.display = 'none';

  const flag = COUNTRY_FLAGS[countryIso] || '';
  const name = COUNTRY_NAMES[countryIso] || countryIso;
  const isHost = (role === 'provider');

  const matchingQuotas = (globalData.quotas || []).filter(q => {
    return isHost ? (q.provider_iso === countryIso) : (q.beneficiary_iso === countryIso);
  });

  const totalSeats = matchingQuotas.reduce((sum, q) => sum + (q.seats_annual || 0), 0);
  const disciplines = Array.from(new Set(matchingQuotas.map(q => q.discipline)));

  let listHtml = '';
  if (matchingQuotas.length === 0) {
    listHtml = `<p class="empty-notice">No specific quota programs recorded for ${name}.</p>`;
  } else {
    listHtml = matchingQuotas.map(q => {
      const partnerIso = isHost ? q.beneficiary_iso : q.provider_iso;
      const partnerFlag = COUNTRY_FLAGS[partnerIso] || '';
      const partnerName = COUNTRY_NAMES[partnerIso] || partnerIso;
      const concClass = q.concession_type === 'Full Scholarship' ? 'scholarship' : (q.concession_type === 'Domestic Parity' ? 'parity' : 'subsidized');

      return `
        <article class="quota-dossier-card">
          <div class="quota-dossier-header">
            <div>
              <span class="quota-tag ${concClass}">${escapeHtml(q.concession_type)}</span>
              <h4 class="quota-dossier-title">${escapeHtml(q.program_name)}</h4>
            </div>
            <span class="quota-seats-badge">${q.seats_annual} seats/yr</span>
          </div>

          <div class="quota-tags-row">
            <span class="quota-tag">${DISCIPLINE_ICONS[q.discipline] || '🎓'} ${escapeHtml(q.discipline)}</span>
            <span class="quota-tag">${escapeHtml(q.degree_level)}</span>
            <span class="quota-tag" style="border-style: dashed;">
              ${isHost ? 'Allocated to' : 'Host'}: ${partnerFlag} ${escapeHtml(partnerName)}
            </span>
          </div>

          <p class="provision-desc" style="font-size: 0.825rem; margin-bottom: 0.6rem;">
            ${escapeHtml(q.fee_benefit_description)}
          </p>

          <div class="provision-meta-grid" style="margin-bottom: 0.6rem;">
            <div class="meta-item">
              <span class="meta-label">Legal Basis</span>
              <span class="meta-val">${escapeHtml(q.legal_framework)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Administering Agency</span>
              <span class="meta-val">${escapeHtml(q.source_name)}</span>
            </div>
          </div>

          <div class="card-footer">
            <a href="${escapeHtml(q.source_url)}" target="_blank" rel="noopener noreferrer" class="source-link">
              Official Portal / Circular ↗
            </a>
          </div>
        </article>
      `;
    }).join('');
  }

  container.innerHTML = `
    <div class="inspector-header">
      <div class="inspector-top-badge">${isHost ? 'HOST NATION QUOTA DOSSIER' : 'RECIPIENT QUOTA PROFILE'}</div>
      <h3 class="inspector-pair-title">
        <span>${flag} ${escapeHtml(name)}</span>
      </h3>
      <p class="inspector-direction-tag">
        ${isHost ? 'Host & Provider of Regional Academic Quotas' : 'Beneficiary of Regional Reserved Seats'}
      </p>

      <div class="inspector-metrics">
        <div class="inspector-ring-card">
          <div class="inspector-metric-score-wrap">
            <span class="inspector-ring-val">${totalSeats}</span>
            <span class="inspector-ring-sub">seats/yr</span>
          </div>
          <div class="inspector-ring-lbl">Annual Capacity</div>
          <p class="inspector-metric-explain">${isHost ? 'Total reserved seats granted to SAARC neighbors' : 'Total inbound reserved seats allocated'}</p>
        </div>

        <div class="inspector-ring-card">
          <div class="inspector-metric-score-wrap">
            <span class="inspector-ring-val">${matchingQuotas.length}</span>
            <span class="inspector-ring-sub">schemes</span>
          </div>
          <div class="inspector-ring-lbl">Programs & Pathways</div>
          <p class="inspector-metric-explain">Across ${disciplines.length} academic disciplines</p>
        </div>
      </div>
    </div>

    <div class="provisions-container">
      <div class="provisions-heading">
        <span>Reserved Educational Quotas & Scholarships</span>
        <span class="provision-count-pill">${matchingQuotas.length} records</span>
      </div>
      <div class="cards-list">
        ${listHtml}
      </div>
    </div>
  `;
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

  // Append Bilateral Student Quotas if any exist between this pair
  const pairQuotas = (globalData.quotas || []).filter(q => q.provider_iso === provider && q.beneficiary_iso === beneficiary);
  if (pairQuotas.length > 0) {
    const quotaSection = document.createElement('div');
    quotaSection.className = 'pair-quota-section';
    quotaSection.style.marginTop = '1.25rem';
    const totalQSeats = pairQuotas.reduce((sum, q) => sum + (q.seats_annual || 0), 0);

    const qCards = pairQuotas.map(q => {
      const concClass = q.concession_type === 'Full Scholarship' ? 'scholarship' : (q.concession_type === 'Domestic Parity' ? 'parity' : 'subsidized');
      return `
        <article class="quota-dossier-card">
          <div class="quota-dossier-header">
            <div>
              <span class="quota-tag ${concClass}">${escapeHtml(q.concession_type)}</span>
              <h4 class="quota-dossier-title">${escapeHtml(q.program_name)}</h4>
            </div>
            <span class="quota-seats-badge">${q.seats_annual} seats/yr</span>
          </div>

          <div class="quota-tags-row">
            <span class="quota-tag">${DISCIPLINE_ICONS[q.discipline] || '🎓'} ${escapeHtml(q.discipline)}</span>
            <span class="quota-tag">${escapeHtml(q.degree_level)}</span>
          </div>

          <p class="provision-desc" style="font-size: 0.825rem; margin-bottom: 0.6rem;">
            ${escapeHtml(q.fee_benefit_description)}
          </p>

          <div class="provision-meta-grid" style="margin-bottom: 0.6rem;">
            <div class="meta-item">
              <span class="meta-label">Legal Basis</span>
              <span class="meta-val">${escapeHtml(q.legal_framework)}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Agency</span>
              <span class="meta-val">${escapeHtml(q.source_name)}</span>
            </div>
          </div>

          <div class="card-footer">
            <a href="${escapeHtml(q.source_url)}" target="_blank" rel="noopener noreferrer" class="source-link">
              Official Portal / Circular ↗
            </a>
          </div>
        </article>
      `;
    }).join('');

    quotaSection.innerHTML = `
      <div class="provisions-heading">
        <span>🎓 Bilateral Student Quotas</span>
        <span class="provision-count-pill">${totalQSeats} seats/yr</span>
      </div>
      <div class="cards-list">
        ${qCards}
      </div>
    `;
    container.querySelector('.provisions-container').appendChild(quotaSection);
  }
}

/**
 * Render SAARC Regional Centres as a compact, expandable list with Host Country flags
 */
function renderRegionalCentres(centres) {
  const container = document.getElementById('centres-list') || document.getElementById('centres-grid');
  if (!container || !centres) return;

  container.innerHTML = centres.map((c, index) => {
    const hostIso = c.host_country_iso || '';
    const hostFlag = COUNTRY_FLAGS[hostIso] || '🏛️';
    const hostName = COUNTRY_NAMES[hostIso] || hostIso;

    return `
      <div class="centre-item" id="centre-item-${index}" data-index="${index}">
        <div class="centre-row-main">
          <div class="centre-title-group">
            <span class="centre-badge-code">${escapeHtml(c.centre_code)}</span>
            <span class="centre-name-text">${escapeHtml(c.name)}</span>
          </div>

          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <span class="centre-focus-tag">${escapeHtml(c.focus_area)}</span>
            <span class="centre-host-pill" title="Host Nation: ${escapeHtml(hostName)}">
              <span class="centre-flag-icon">${hostFlag}</span>
              <span>${escapeHtml(c.city)}, ${escapeHtml(hostIso)}</span>
            </span>
            <span class="centre-item-arrow">▶</span>
          </div>
        </div>

        <div class="centre-details-dropdown">
          <div class="centre-detail-row">
            <span class="centre-detail-label">Key Focus:</span>
            <span>${escapeHtml(c.focus_area)}</span>
          </div>
          ${c.eligibility ? `
            <div class="centre-detail-row">
              <span class="centre-detail-label">Eligibility:</span>
              <span>${escapeHtml(c.eligibility)}</span>
            </div>
          ` : ''}
          <div class="centre-detail-row">
            <span class="centre-detail-label">Core Program:</span>
            <span>${escapeHtml(c.key_program)}</span>
          </div>
          <div class="centre-action-footer">
            <a href="${escapeHtml(c.source_url)}" target="_blank" rel="noopener noreferrer" class="centre-portal-link" onclick="event.stopPropagation();">
              ${escapeHtml(c.source_name || 'Official Portal')} ↗
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Attach row click to toggle accordion expansion
  container.querySelectorAll('.centre-item').forEach(item => {
    item.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      // Optional: keep it single-expand or multi-expand (multi feels more natural)
      item.classList.toggle('open', !isOpen);
    });
  });
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
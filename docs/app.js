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
let activeView = 'matrix'; // 'matrix' | 'rankings' | 'quotas' | 'reciprocity' | 'radar' | 'visas'
let focusCountry = 'IND';
let activeQuotaSubview = 'flow'; // 'flow' (Sankey) | 'capacity' (Stacked Bar)
let selectedDiscipline = 'all';
let quotaGroupBy = 'provider'; // 'provider' | 'beneficiary'
let activeVisaSubview = 'matrix'; // 'matrix' | 'passport' | 'sves'
let selectedPassport = 'IND';
let selectedVisaTier = 'all';
let visaData = null;

const VISA_TIER_CONFIG = {
  freedom_of_movement: {
    label: 'Freedom of Movement',
    short: 'Open Border',
    icon: '🟢',
    badgeClass: 'open',
    color: '#047857',
    bg: '#ecfdf5',
    border: '#a7f3d0'
  },
  visa_free_voa: {
    label: 'Visa-Free / VoA',
    short: 'Free / VoA',
    icon: '🟢',
    badgeClass: 'voa',
    color: '#0d9488',
    bg: '#f0fdfa',
    border: '#99f6e4'
  },
  concessionary_eta: {
    label: 'Concessionary ETA',
    short: 'SAARC ETA',
    icon: '🟡',
    badgeClass: 'eta',
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a'
  },
  consular_visa: {
    label: 'Consular Visa',
    short: 'Consular',
    icon: '🟠',
    badgeClass: 'consular',
    color: '#475569',
    bg: '#f8fafc',
    border: '#cbd5e1'
  },
  restricted_prior_approval: {
    label: 'Restricted / Security Vetting',
    short: 'Restricted',
    icon: '🔴',
    badgeClass: 'restricted',
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca'
  }
};

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
  total: 'All Sectors',
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
  if (data && data.visas) {
    visaData = data.visas;
  } else {
    fetch('./data/visa_matrix.json')
      .then(res => res.json())
      .then(vd => {
        visaData = vd;
        if (activeView === 'visas') renderActiveView();
      })
      .catch(() => {
        fetch('data/visa_matrix.json')
          .then(res => res.json())
          .then(vd => {
            visaData = vd;
            if (activeView === 'visas') renderActiveView();
          });
      });
  }
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

  // Visa Regimes sub-view controls
  const visaToggleBtns = document.querySelectorAll('.visa-toggle-btn');
  const visaPassportCont = document.getElementById('visa-passport-select-cont');
  const visaTierCont = document.getElementById('visa-tier-filter-cont');
  visaToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      visaToggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeVisaSubview = btn.dataset.subview;
      if (visaPassportCont) {
        visaPassportCont.style.display = activeVisaSubview === 'passport' ? 'flex' : 'none';
      }
      if (visaTierCont) {
        visaTierCont.style.display = activeVisaSubview === 'matrix' ? 'flex' : 'none';
      }
      updateViewChrome();
      renderActiveView();
    });
  });

  const visaPassportSelect = document.getElementById('visa-passport-select');
  if (visaPassportSelect) {
    visaPassportSelect.addEventListener('change', (e) => {
      selectedPassport = e.target.value;
      updateViewChrome();
      renderActiveView();
    });
  }

  const visaTierFilter = document.getElementById('visa-tier-filter');
  if (visaTierFilter) {
    visaTierFilter.addEventListener('change', (e) => {
      selectedVisaTier = e.target.value;
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
  const btnOpenMethodology = document.getElementById('btn-open-methodology');

  const openModal = () => { if (aboutModal) aboutModal.style.display = 'flex'; };
  const closeModal = () => { if (aboutModal) aboutModal.style.display = 'none'; };

  if (btnOpenMethodology) btnOpenMethodology.addEventListener('click', openModal);
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (aboutModal) {
    aboutModal.addEventListener('click', (e) => {
      if (e.target === aboutModal) closeModal();
    });
  }

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
  const visaControls = document.getElementById('view-visa-controls');
  const mainTitle = document.getElementById('view-main-title');
  const caption = document.getElementById('view-caption');
  const hintText = document.getElementById('view-hint-text');
  const badgeType = document.getElementById('view-badge-type');

  const countryName = COUNTRY_NAMES[focusCountry] || focusCountry;
  const countryFlag = COUNTRY_FLAGS[focusCountry] || '';

  if (visaControls && activeView !== 'visas') {
    visaControls.style.display = 'none';
  }

  if (activeView === 'matrix') {
    if (focusControls) focusControls.style.display = 'none';
    if (quotaControls) quotaControls.style.display = 'none';
    if (badgeType) badgeType.textContent = 'HEATMAP MATRIX';
    if (mainTitle) mainTitle.textContent = 'Bilateral Relationship Matrix';
    if (caption) {
      caption.innerHTML = `
        <span class="axis-guide"><strong>Granting State</strong> (Rows / Left)</span>
        <span class="axis-divider">•</span>
        <span class="axis-guide"><strong>Recipient State</strong> (Columns / Top)</span>
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
  } else if (activeView === 'visas') {
    if (focusControls) focusControls.style.display = 'none';
    if (quotaControls) quotaControls.style.display = 'none';
    if (visaControls) visaControls.style.display = 'flex';
    if (badgeType) badgeType.textContent = 'REGIONAL MOBILITY & VISA REGIMES';

    if (activeVisaSubview === 'matrix') {
      if (mainTitle) mainTitle.textContent = '🛂 South Asian Bilateral Visa Requirements Matrix';
      if (caption) {
        caption.innerHTML = `
          <div class="visa-axis-reader-guide">
            <span class="reader-guide-chip orig">
              <span class="chip-icon">🛫</span>
              <span class="chip-name">Passport Origin</span>
              <span class="chip-pos">(Left Side)</span>
            </span>
            <span class="reader-arrow">➔</span>
            <span class="reader-guide-chip dest">
              <span class="chip-icon">🛬</span>
              <span class="chip-name">Destination State</span>
              <span class="chip-pos">(Top Header)</span>
            </span>
            <span class="reader-separator">•</span>
            <span class="reader-tip">Select citizen passport on the left, then look across to destination.</span>
          </div>
        `;
      }
      if (hintText) {
        hintText.innerHTML = `<span class="hint-bullet">●</span> Click any cell in the 8×8 grid to inspect exact statutory rules, permitted stay, fees, and police reporting requirements in the side dossier.`;
      }
    } else if (activeVisaSubview === 'passport') {
      const pName = COUNTRY_NAMES[selectedPassport] || selectedPassport;
      const pFlag = COUNTRY_FLAGS[selectedPassport] || '';
      if (mainTitle) mainTitle.textContent = `🛂 ${pFlag} ${pName} Passport Mobility Explorer`;
      if (caption) {
        caption.innerHTML = `Reciprocal entry conditions, visa waivers, and entry fees across all 7 regional South Asian destinations.`;
      }
      if (hintText) {
        hintText.innerHTML = `<span class="hint-bullet">●</span> Click any destination card below to view verified legal instruments and primary immigration sources.`;
      }
    } else if (activeVisaSubview === 'sves') {
      if (mainTitle) mainTitle.textContent = '🎖️ SAARC Visa Exemption Scheme (SVES) vs. Ordinary Citizen Mobility';
      if (caption) {
        caption.innerHTML = `Comparing multilateral fast-track diplomatic/official mobility with bilateral citizen border friction.`;
      }
      if (hintText) {
        hintText.innerHTML = `<span class="hint-bullet">●</span> Explore the 24 statutory categories eligible for the 90-day multi-entry SVES visa sticker across all 8 member states.`;
      }
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

  const heatmapEl = document.getElementById('matrix-heatmap');
  if (heatmapEl) {
    if (activeView === 'visas') {
      heatmapEl.classList.add('visa-view-active');
      heatmapEl.style.height = 'auto';
      heatmapEl.style.overflow = 'visible';
    } else {
      heatmapEl.classList.remove('visa-view-active');
      heatmapEl.style.height = '';
      heatmapEl.style.overflow = '';
    }
  }

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
  } else if (activeView === 'visas') {
    renderVisaRegimes();
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
        `Sector: ${CATEGORY_LABELS[catFilter] || catFilter}<br>` +
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

  const isMobile = window.innerWidth <= 640;

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
        font: { color: '#111827', size: isMobile ? 10 : 12, family: '-apple-system, BlinkMacSystemFont, sans-serif' }
      },
      tickfont: { color: '#4b5563', size: isMobile ? 8 : 10 },
      thickness: isMobile ? 10 : 12,
      len: isMobile ? 0.75 : 0.9,
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
    margin: isMobile ? { t: 25, r: 15, l: 50, b: 45 } : { t: 40, r: 25, l: 80, b: 65 },
    xaxis: {
      title: {
        text: isMobile ? 'Recipient State' : 'Beneficiary State (Recipient)',
        font: { color: '#111827', size: isMobile ? 10 : 12, family: '-apple-system, BlinkMacSystemFont, sans-serif' },
        standoff: isMobile ? 8 : 15
      },
      tickmode: 'array',
      tickvals: countries,
      ticktext: countries.map(c => isMobile ? c : `${COUNTRY_FLAGS[c] || ''} ${c}`),
      tickfont: { color: '#111827', size: isMobile ? 9 : 11, family: 'monospace', weight: '700' },
      gridcolor: '#f3f4f6',
      zeroline: false,
      linecolor: '#111111',
      linewidth: 1.5,
      side: 'bottom'
    },
    yaxis: {
      title: {
        text: isMobile ? 'Grantor State' : 'Provider State (Grantor)',
        font: { color: '#111827', size: isMobile ? 10 : 12, family: '-apple-system, BlinkMacSystemFont, sans-serif' },
        standoff: isMobile ? 8 : 15
      },
      autorange: 'reversed',
      tickmode: 'array',
      tickvals: countries,
      ticktext: countries.map(c => isMobile ? c : `${COUNTRY_FLAGS[c] || ''} ${c}`),
      tickfont: { color: '#111827', size: isMobile ? 9 : 11, family: 'monospace', weight: '700' },
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

  const isMobile = window.innerWidth <= 640;

  const layout = {
    barmode: 'stack',
    paper_bgcolor: '#ffffff',
    plot_bgcolor: '#ffffff',
    margin: isMobile ? { t: 25, r: 15, l: 65, b: 45 } : { t: 30, r: 25, l: 90, b: 60 },
    legend: {
      orientation: 'h',
      y: isMobile ? 1.25 : 1.15,
      x: 0,
      font: { size: isMobile ? 9 : 11, color: '#111827' }
    },
    xaxis: {
      title: {
        text: isMobile ? 'Total Score (Points)' : 'Total Weighted Benefit Score (Points)',
        font: { color: '#111827', size: isMobile ? 10 : 12 }
      },
      gridcolor: '#f3f4f6',
      zeroline: true,
      zerolinecolor: '#111111'
    },
    yaxis: {
      tickfont: { color: '#111827', size: isMobile ? 10 : 12, family: 'monospace', weight: '700' },
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

  const isMobile = window.innerWidth <= 640;

  const layout = {
    barmode: 'relative',
    paper_bgcolor: '#ffffff',
    plot_bgcolor: '#ffffff',
    margin: isMobile ? { t: 25, r: 15, l: 65, b: 45 } : { t: 30, r: 35, l: 90, b: 60 },
    legend: {
      orientation: 'h',
      y: isMobile ? 1.25 : 1.15,
      x: 0,
      font: { size: isMobile ? 9 : 11, color: '#111827' }
    },
    xaxis: {
      title: {
        text: isMobile ? '← Inbound &nbsp;|&nbsp; Outbound →' : '← Received Points (Inbound) &nbsp;|&nbsp; Given Points (Outbound) →',
        font: { color: '#111827', size: isMobile ? 10 : 12 }
      },
      tickformat: s => Math.abs(s),
      gridcolor: '#f3f4f6',
      zeroline: true,
      zerolinecolor: '#111111',
      zerolinewidth: 2
    },
    yaxis: {
      tickfont: { color: '#111827', size: isMobile ? 10 : 12, family: 'monospace', weight: '700' },
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

  const isMobile = window.innerWidth <= 640;

  const layout = {
    polar: {
      radialaxis: {
        visible: true,
        range: [0, maxVal + 1],
        tickfont: { size: isMobile ? 8 : 9, color: '#4b5563' },
        linecolor: '#e4e4e7',
        gridcolor: '#f3f4f6'
      },
      angularaxis: {
        tickfont: { size: isMobile ? 9 : 10, color: '#111827', weight: '700' },
        rotation: 90,
        direction: 'clockwise',
        gridcolor: '#e4e4e7'
      }
    },
    paper_bgcolor: '#ffffff',
    plot_bgcolor: '#ffffff',
    margin: isMobile ? { t: 25, r: 20, l: 20, b: 25 } : { t: 40, r: 40, l: 40, b: 40 },
    legend: {
      orientation: 'h',
      y: isMobile ? 1.25 : 1.15,
      x: 0,
      font: { size: isMobile ? 9 : 11, color: '#111827' }
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

  const isMobile = window.innerWidth <= 640;

  const layout = {
    barmode: 'stack',
    paper_bgcolor: '#ffffff',
    plot_bgcolor: '#ffffff',
    margin: isMobile ? { t: 25, r: 15, l: 45, b: 50 } : { t: 30, r: 25, l: 60, b: 65 },
    legend: {
      orientation: 'h',
      y: isMobile ? 1.25 : 1.15,
      x: 0,
      font: { size: isMobile ? 9 : 11, color: '#111827' }
    },
    xaxis: {
      title: {
        text: isByProvider
          ? (isMobile ? 'Host State' : 'Host / Provider State')
          : (isMobile ? 'Recipient State' : 'Beneficiary / Recipient State'),
        font: { color: '#111827', size: isMobile ? 10 : 12 }
      },
      tickfont: { color: '#111827', size: isMobile ? 10 : 12, weight: '700' },
      linecolor: '#111111',
      linewidth: 1.5
    },
    yaxis: {
      title: {
        text: isMobile ? 'Seats' : 'Total Reserved Seats (Annual Quota)',
        font: { color: '#111827', size: isMobile ? 10 : 12 }
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

  if (window.innerWidth <= 960) {
    setTimeout(() => {
      document.getElementById('inspector-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }

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

  if (window.innerWidth <= 960) {
    setTimeout(() => {
      document.getElementById('inspector-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }

  if (activeView === 'visas' && visaData) {
    displayVisaDossier(provider, beneficiary);
    return;
  }

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
    emptyNotice.textContent = 'No provisions found matching the selected sector and audience filters.';
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

/**
 * ============================================================================
 * Visa Regimes & Regional Mobility Visualizer
 * ============================================================================
 */

function renderVisaRegimes() {
  const container = document.getElementById('matrix-heatmap');
  if (!container) return;

  if (!visaData) {
    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:450px;flex-direction:column;gap:0.75rem;color:var(--color-gray-600);">
        <div style="font-size:1.5rem;">🛂</div>
        <p style="font-weight:600;">Loading regional visa dataset...</p>
      </div>
    `;
    return;
  }

  if (activeVisaSubview === 'matrix') {
    renderVisaMatrix(container);
  } else if (activeVisaSubview === 'passport') {
    renderPassportExplorer(container);
  } else if (activeVisaSubview === 'sves') {
    renderSvesComparison(container);
  }

  // Ensure inspector shows relevant visa dossier
  const curP = selectedPair?.provider || 'IND';
  const curB = selectedPair?.beneficiary || 'NPL';
  displayVisaDossier(curP, curB);
}

function formatCompactStay(stay) {
  if (!stay) return '';
  const s = stay.toLowerCase();
  if (s.includes('indefinite') || s.includes('unrestricted')) return 'Indefinite';
  if (s.includes('90 days visa-free') || s.includes('90 days free') || s.includes('90 days')) return '90d Free';
  if (s.includes('30 days free')) return '30d Free';
  if (s.includes('30 days double')) return '30d ($20)';
  if (s.includes('14-30 days')) return '14–30d';
  if (s.includes('30-90 days')) return '30–90d';
  if (s.includes('30 days')) return '30 Days';
  if (s.includes('multi-entry')) return 'Multi-Entry';
  if (s.includes('single entry')) return 'Single Entry';
  if (s.includes('strictly limited') || s.includes('security')) return 'Strict Dates';
  if (s.includes('itinerary') || s.includes('approved')) return 'Itinerary';
  return stay.split('(')[0].trim().substring(0, 10);
}

/**
 * 1. 8x8 Bilateral Visa Requirement Matrix Grid
 */
function renderVisaMatrix(container) {
  // Purge any existing Plotly instances on container
  if (typeof Plotly !== 'undefined' && Plotly.purge) {
    try { Plotly.purge(container); } catch (e) { /* ignore */ }
  }

  const countries = visaData.metadata?.countries || ['AFG', 'BGD', 'BTN', 'IND', 'MDV', 'NPL', 'PAK', 'LKA'];
  const matrix = visaData.matrix || {};
  const tiers = visaData.metadata?.tiers || {};
  const tierCounts = visaData.metadata?.tier_distribution || {};

  let tableHtml = `
    <div class="visa-matrix-container">
      <div class="visa-mobile-scroll-hint">← Swipe table horizontally to view all member states →</div>
      <div class="visa-matrix-layout">
        <aside class="visa-matrix-side-axis" aria-label="Origin Passport Axis" title="Passport Origin (Rows): Country of citizen/traveler">
          <div class="visa-side-axis-badge">
            <span class="side-axis-icon">🛫</span>
            <div class="side-axis-text-group">
              <span class="side-axis-title">PASSPORT ORIGIN</span>
              <span class="side-axis-subtitle">(Citizen of)</span>
            </div>
            <span class="side-axis-arrow">▼</span>
          </div>
        </aside>

        <div class="visa-matrix-scroll">
          <table class="visa-matrix-table" role="grid" aria-label="Bilateral Visa Regimes Matrix">
            <thead>
              <tr class="visa-axis-dest-row">
                <th class="corner-cell" rowspan="2" title="Corner Guide: Read across from your Passport origin to your Destination country">
                  <div class="visa-corner-guide">
                    <div class="corner-guide-item corner-dest">
                      <span class="corner-guide-icon">🛬</span>
                      <span class="corner-guide-label">DEST ➔</span>
                    </div>
                    <div class="corner-guide-line"></div>
                    <div class="corner-guide-item corner-orig">
                      <span class="corner-guide-icon">🛫</span>
                      <span class="corner-guide-label">PASSPORT ⬇</span>
                    </div>
                  </div>
                </th>
                <th colspan="${countries.length}" class="dest-axis-superheader">
                  <div class="dest-axis-banner">
                    <span class="dest-axis-icon">🛬</span>
                    <span class="dest-axis-title">DESTINATION STATE</span>
                    <span class="dest-axis-desc">— Where you are traveling to</span>
                    <span class="dest-axis-arrow">➔</span>
                  </div>
                </th>
              </tr>
              <tr class="visa-country-cols-row">
  `;

  countries.forEach(c => {
    const flag = COUNTRY_FLAGS[c] || '';
    const name = COUNTRY_NAMES[c] || c;
    const isDestSelected = selectedPair && selectedPair.beneficiary === c;
    tableHtml += `<th class="dest-header ${isDestSelected ? 'active-axis' : ''}" data-country="${c}" title="Destination: ${escapeHtml(name)} (${c})">${flag} ${c}</th>`;
  });

  tableHtml += `</tr></thead><tbody>`;

  countries.forEach(orig => {
    const origFlag = COUNTRY_FLAGS[orig] || '';
    const origName = COUNTRY_NAMES[orig] || orig;
    const isOrigSelected = selectedPair && selectedPair.provider === orig;
    tableHtml += `<tr>`;
    tableHtml += `<th class="origin-header ${isOrigSelected ? 'active-axis' : ''}" data-country="${orig}" title="Citizen/Passport of ${escapeHtml(origName)} (${orig})">${origFlag} ${orig}</th>`;

    countries.forEach(dest => {
      if (orig === dest) {
        tableHtml += `
          <td class="visa-matrix-cell self-cell" title="Domestic Jurisdiction (${orig})">
            <div class="visa-cell-badge">
              <span class="visa-cell-icon">🏛️</span>
              <span class="visa-cell-label">Domestic</span>
            </div>
          </td>
        `;
      } else {
        const rec = matrix[orig]?.[dest];
        if (!rec) {
          tableHtml += `<td class="visa-matrix-cell self-cell">—</td>`;
          return;
        }

        const tierId = rec.tier;
        const tCfg = VISA_TIER_CONFIG[tierId] || {
          icon: '📄',
          short: 'Consular',
          color: '#475569',
          bg: '#f8fafc',
          border: '#cbd5e1'
        };

        const isDimmed = selectedVisaTier !== 'all' && tierId !== selectedVisaTier;
        const isSelected = selectedPair && selectedPair.provider === orig && selectedPair.beneficiary === dest;
        const classes = ['visa-matrix-cell', isDimmed ? 'dimmed' : '', isSelected ? 'selected' : ''].filter(Boolean).join(' ');

        const staySnippet = formatCompactStay(rec.stay_allowance);

        tableHtml += `
          <td class="${classes}"
              data-orig="${orig}"
              data-dest="${dest}"
              style="background-color: ${tCfg.bg}; border-color: ${tCfg.border}; color: ${tCfg.color};"
              title="${origFlag} ${orig} ➔ ${COUNTRY_FLAGS[dest] || ''} ${dest}: ${escapeHtml(rec.tier_label)} (${escapeHtml(rec.stay_allowance)}) • Click to inspect"
          >
            <div class="visa-cell-badge">
              <span class="visa-cell-icon">${tCfg.icon}</span>
              <span class="visa-cell-label">${escapeHtml(tCfg.short || rec.short_label)}</span>
              <span class="visa-cell-stay">${escapeHtml(staySnippet)}</span>
            </div>
          </td>
        `;
      }
    });

    tableHtml += `</tr>`;
  });

  tableHtml += `</tbody></table></div></div>`;

  // Add Interactive Legend Bar below
  tableHtml += `
    <div class="visa-legend-bar">
      <div class="visa-legend-items">
  `;

  Object.keys(VISA_TIER_CONFIG).forEach(tierId => {
    const cfg = VISA_TIER_CONFIG[tierId];
    const count = tierCounts[tierId] || 0;
    tableHtml += `
      <span class="visa-legend-pill">
        <span class="visa-legend-dot" style="background-color: ${cfg.color};"></span>
        <span>${cfg.label}</span>
        <span class="visa-legend-count">${count}</span>
      </span>
    `;
  });

  tableHtml += `
      </div>
      <div style="font-weight:700; color:var(--color-gray-600); font-size:0.7rem; font-family:var(--font-mono);">
        56 Corridors • Click any cell to view treaty & legal framework
      </div>
    </div>
  </div>`;

  container.innerHTML = tableHtml;

  // Attach hover crosshair and click handlers to active matrix cells
  container.querySelectorAll('.visa-matrix-cell[data-orig]').forEach(cell => {
    const orig = cell.getAttribute('data-orig');
    const dest = cell.getAttribute('data-dest');

    cell.addEventListener('mouseenter', () => {
      container.querySelectorAll(`.origin-header[data-country="${orig}"]`).forEach(h => h.classList.add('hover-axis'));
      container.querySelectorAll(`.dest-header[data-country="${dest}"]`).forEach(h => h.classList.add('hover-axis'));
    });

    cell.addEventListener('mouseleave', () => {
      container.querySelectorAll('.origin-header.hover-axis, .dest-header.hover-axis').forEach(h => h.classList.remove('hover-axis'));
    });

    cell.addEventListener('click', () => {
      if (orig && dest) {
        selectVisaPair(orig, dest);
      }
    });
  });
}

/**
 * 2. Passport Freedom Explorer View
 */
function renderPassportExplorer(container) {
  if (typeof Plotly !== 'undefined' && Plotly.purge) {
    try { Plotly.purge(container); } catch (e) { /* ignore */ }
  }

  const pwr = visaData.passport_power?.[selectedPassport];
  const matrix = visaData.matrix || {};
  const origName = COUNTRY_NAMES[selectedPassport] || selectedPassport;
  const origFlag = COUNTRY_FLAGS[selectedPassport] || '';

  const destinations = (visaData.metadata?.countries || []).filter(c => c !== selectedPassport);

  let html = `
    <div class="passport-explorer-container">
      <div class="passport-hero-card">
        <div class="passport-hero-info">
          <span class="passport-hero-flag">${origFlag}</span>
          <div>
            <h3 class="passport-hero-title">${escapeHtml(origName)} Passport Regional Privileges</h3>
            <p class="passport-hero-subtitle">
              Evaluating reciprocal border access, allowable stay, and entry fee concessions across South Asia.
            </p>
          </div>
        </div>
        <div class="passport-score-badge">
          <span class="passport-score-val">${pwr ? pwr.power_score : 0} / 28 pts</span>
          <span class="passport-score-label">${pwr ? pwr.power_pct : 0}% Regional Access</span>
        </div>
      </div>

      <div class="passport-dest-grid">
  `;

  destinations.forEach(dest => {
    const rec = matrix[selectedPassport]?.[dest];
    if (!rec) return;

    const destName = COUNTRY_NAMES[dest] || dest;
    const destFlag = COUNTRY_FLAGS[dest] || '';
    const tCfg = VISA_TIER_CONFIG[rec.tier] || {
      color: '#475569',
      bg: '#f8fafc',
      border: '#cbd5e1'
    };

    const isSelected = selectedPair && selectedPair.provider === selectedPassport && selectedPair.beneficiary === dest;

    html += `
      <article class="passport-dest-card ${isSelected ? 'selected' : ''}" data-orig="${selectedPassport}" data-dest="${dest}">
        <div class="passport-dest-header">
          <div class="passport-dest-country">
            <span>${destFlag}</span>
            <span>${escapeHtml(destName)}</span>
          </div>
          <span class="passport-dest-badge" style="background-color: ${tCfg.bg}; color: ${tCfg.color}; border: 1px solid ${tCfg.border};">
            ${escapeHtml(rec.tier_label)}
          </span>
        </div>

        <div class="passport-dest-details">
          <div class="passport-dest-row">
            <span class="passport-dest-key">Stay Allowance:</span>
            <span class="passport-dest-val">${escapeHtml(rec.stay_allowance)}</span>
          </div>
          <div class="passport-dest-row">
            <span class="passport-dest-key">Entry Fee:</span>
            <span class="passport-dest-val">${escapeHtml(rec.fee)}</span>
          </div>
          <div class="passport-dest-row">
            <span class="passport-dest-key">Accepted ID:</span>
            <span class="passport-dest-val" style="font-size:0.72rem;">${escapeHtml(rec.id_required)}</span>
          </div>
        </div>

        ${rec.special_conditions ? `
          <div class="passport-dest-special">
            <strong>Condition:</strong> ${escapeHtml(rec.special_conditions)}
          </div>
        ` : ''}
      </article>
    `;
  });

  html += `</div></div>`;
  container.innerHTML = html;

  container.querySelectorAll('.passport-dest-card').forEach(card => {
    card.addEventListener('click', () => {
      const orig = card.getAttribute('data-orig');
      const dest = card.getAttribute('data-dest');
      if (orig && dest) {
        selectVisaPair(orig, dest);
      }
    });
  });
}

/**
 * 3. SAARC Visa Exemption Scheme (SVES) vs Ordinary Citizens View
 */
function renderSvesComparison(container) {
  if (typeof Plotly !== 'undefined' && Plotly.purge) {
    try { Plotly.purge(container); } catch (e) { /* ignore */ }
  }

  const sves = visaData.sves || {};
  const categories = sves.categories_list || [];

  let html = `
    <div class="sves-container">
      <div class="sves-hero-card">
        <div class="sves-hero-top">
          <div>
            <span class="sves-badge-pill">🎖️ MULTILATERAL DIPLOMATIC PROTOCOL</span>
            <h3 style="font-size:1.15rem; font-weight:800; margin-top:0.35rem; color:var(--color-black);">
              The South Asian Mobility Paradox: Official Fast-Track vs. Citizen Friction
            </h3>
            <p style="font-size:0.8rem; color:var(--color-gray-600); margin-top:0.2rem;">
              Operationalized in 1992 following the 4th SAARC Summit, the SAARC Visa Exemption Scheme (SVES) creates frictionless regional mobility for dignitaries and elites, contrasting sharply with restrictive bilateral visa queues for ordinary citizens.
            </p>
          </div>
        </div>

        <div class="sves-comparison-grid">
          <div class="sves-comp-box ordinary">
            <h4 class="sves-comp-title">👤 Ordinary Citizen Mobility (Bilateral Realities)</h4>
            <p class="sves-comp-desc">
              Over <strong>46% of South Asian bilateral corridors</strong> require burdensome consular visas with in-person embassy queues, biometric vetting, and bank balance proofs.
            </p>
            <p class="sves-comp-desc" style="margin-top: 0.3rem;">
              Sensitive corridors (such as India ↔ Pakistan) impose city-specific single-entry visas, designated checkpoints (Attari-Wagah or flights only), and mandatory Police Reporting (PRS) within 24 hours of arrival.
            </p>
          </div>

          <div class="sves-comp-box sves-protocol">
            <h4 class="sves-comp-title">🎖️ SAARC Visa Exemption Scheme (SVES Protocol)</h4>
            <p class="sves-comp-desc">
              <strong>1-Year Multi-Entry Sticker</strong> issued to 24 designated dignitary, judicial, media, trade, and academic categories across all 8 member states.
            </p>
            <p class="sves-comp-desc" style="margin-top: 0.3rem;">
              <strong>Benefits:</strong> Up to 90 days stay per visit, full exemption from visa fees, zero consular queues, and exemption from police registration (PRS) even across high-friction corridors.
            </p>
          </div>
        </div>
      </div>

      <div style="margin-top: 0.4rem;">
        <h4 class="sves-categories-title">
          <span>The 24 Statutory SVES Categories</span>
          <span style="font-size:0.7rem; font-family:var(--font-mono); color:var(--color-gray-600);">24 OF 24 PROTOCOL SLOTS</span>
        </h4>

        <div class="sves-categories-grid" style="margin-top: 0.65rem;">
  `;

  categories.forEach(cat => {
    html += `
      <div class="sves-cat-card" title="Category ${cat.id}: ${escapeHtml(cat.group)}">
        <span class="sves-cat-num">${cat.id}</span>
        <div>
          <div class="sves-cat-name">${escapeHtml(cat.group)}</div>
          <div class="sves-cat-desc">${escapeHtml(cat.desc)}</div>
        </div>
      </div>
    `;
  });

  html += `</div></div></div>`;
  container.innerHTML = html;
}

/**
 * Update selected pair in visa view and refresh active view & dossier
 */
function selectVisaPair(orig, dest) {
  selectedPair = { provider: orig, beneficiary: dest };
  focusCountry = orig;
  const focusCountrySelect = document.getElementById('focus-country-select');
  if (focusCountrySelect) focusCountrySelect.value = orig;

  // Re-highlight cells or cards without re-rendering everything
  document.querySelectorAll('.visa-matrix-cell').forEach(c => {
    const cOrig = c.getAttribute('data-orig');
    const cDest = c.getAttribute('data-dest');
    if (cOrig === orig && cDest === dest) {
      c.classList.add('selected');
    } else {
      c.classList.remove('selected');
    }
  });

  // Re-highlight origin and destination headers
  document.querySelectorAll('.visa-matrix-table .origin-header').forEach(th => {
    th.classList.toggle('active-axis', th.getAttribute('data-country') === orig);
  });
  document.querySelectorAll('.visa-matrix-table .dest-header').forEach(th => {
    th.classList.toggle('active-axis', th.getAttribute('data-country') === dest);
  });

  document.querySelectorAll('.passport-dest-card').forEach(c => {
    const cOrig = c.getAttribute('data-orig');
    const cDest = c.getAttribute('data-dest');
    if (cOrig === orig && cDest === dest) {
      c.classList.add('selected');
    } else {
      c.classList.remove('selected');
    }
  });

  displayVisaDossier(orig, dest);
}

/**
 * Display comprehensive statutory visa details in the Inspector Panel
 */
function displayVisaDossier(orig, dest) {
  const container = document.getElementById('provisions-container');
  const placeholder = document.getElementById('placeholder-msg');
  if (placeholder) placeholder.style.display = 'none';
  if (!container) return;

  if (window.innerWidth <= 960) {
    setTimeout(() => {
      document.getElementById('inspector-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }

  const origFlag = COUNTRY_FLAGS[orig] || '';
  const destFlag = COUNTRY_FLAGS[dest] || '';
  const origName = COUNTRY_NAMES[orig] || orig;
  const destName = COUNTRY_NAMES[dest] || dest;

  if (orig === dest) {
    container.innerHTML = `
      <div class="inspector-header">
        <div class="inspector-top-badge">DOMESTIC JURISDICTION</div>
        <h3 class="inspector-pair-title">
          <span>${origFlag} ${origName} (${orig})</span>
        </h3>
        <p class="inspector-direction-tag">National Sovereign Territory • Municipal Immigration Code</p>
      </div>
      <div class="domestic-notice">
        <div class="domestic-symbol">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="1.5">
            <path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M12 2L2 7h20L12 2z"></path>
          </svg>
        </div>
        <h4 class="domestic-title">Internal Domestic Jurisdiction</h4>
        <p class="domestic-desc">
          Self-pairs (${orig} ➔ ${dest}) denote internal constitutional boundaries. Cross-border bilateral visa rules and regional immigration exemptions apply strictly between sovereign neighbor states.
        </p>
      </div>
    `;
    return;
  }

  const rec = visaData?.matrix?.[orig]?.[dest];
  if (!rec) {
    container.innerHTML = `<div style="padding:1rem;color:var(--color-gray-600);">No visa data available for ${orig} ➔ ${dest}.</div>`;
    return;
  }

  const tCfg = VISA_TIER_CONFIG[rec.tier] || {
    label: rec.tier_label || 'Consular Visa',
    color: '#475569',
    bg: '#f8fafc',
    border: '#cbd5e1'
  };

  const isRestricted = rec.tier === 'restricted_prior_approval';
  const isOpen = rec.tier === 'freedom_of_movement';
  const isVoa = rec.tier === 'visa_free_voa';

  let noticeClass = 'visa-notice-box';
  let noticeIcon = 'ℹ️';
  if (isRestricted) {
    noticeClass += ' warning';
    noticeIcon = '⚠️';
  } else if (isOpen || isVoa) {
    noticeClass += ' open';
    noticeIcon = '✨';
  }

  container.innerHTML = `
    <div class="visa-dossier-wrap">
      <div class="inspector-header" style="margin-bottom:0.25rem;">
        <div class="inspector-top-badge">BILATERAL MOBILITY & VISA REGIME</div>
        <h3 class="inspector-pair-title">
          <span>${origFlag} ${orig}</span>
          <span class="direction-arrow">➔</span>
          <span>${destFlag} ${dest}</span>
        </h3>
        <p class="inspector-direction-tag">
          Passport: <strong>${escapeHtml(origName)}</strong> • Destination: <strong>${escapeHtml(destName)}</strong>
        </p>
      </div>

      <div class="visa-dossier-banner" style="background-color:${tCfg.bg}; border-color:${tCfg.border};">
        <span class="visa-dossier-tier-badge" style="background-color:${tCfg.color}; color:#ffffff;">
          ${escapeHtml(rec.tier_label)}
        </span>
        <h4 class="visa-dossier-headline" style="color:${tCfg.color};">
          ${escapeHtml(rec.stay_allowance)}
        </h4>
      </div>

      <div class="visa-specs-grid">
        <div class="visa-spec-item">
          <span class="visa-spec-key">Entry Fee / Levy</span>
          <span class="visa-spec-val">${escapeHtml(rec.fee)}</span>
        </div>
        <div class="visa-spec-item">
          <span class="visa-spec-key">Required Document</span>
          <span class="visa-spec-val">${escapeHtml(rec.id_required)}</span>
        </div>
        <div class="visa-spec-item" style="grid-column: span 2;">
          <span class="visa-spec-key">Employment & Residence</span>
          <span class="visa-spec-val">${escapeHtml(rec.work_rights || 'Standard tourist restrictions')}</span>
        </div>
      </div>

      ${rec.special_conditions ? `
        <div class="${noticeClass}">
          <div class="visa-notice-title">
            <span>${noticeIcon}</span>
            <span>Special Immigration Conditions</span>
          </div>
          <p>${escapeHtml(rec.special_conditions)}</p>
        </div>
      ` : ''}

      <div class="provision-card" style="margin-top:0.2rem;">
        <div class="provision-header">
          <span class="provision-category-tag" style="background-color:rgba(16, 185, 129, 0.15); color:#047857; border-color:#047857;">
            STATUTORY LEGAL BASIS
          </span>
        </div>
        <h4 class="provision-title" style="font-size:0.875rem;">${escapeHtml(rec.legal_framework)}</h4>
        <div class="provision-meta-row" style="margin-top:0.4rem;">
          <span class="meta-item">
            <span class="meta-label">Authority:</span>
            <span>${escapeHtml(rec.source_name)}</span>
          </span>
        </div>
        ${rec.source_url ? `
          <div class="provision-footer" style="margin-top:0.5rem; padding-top:0.4rem; border-top:1px solid var(--color-gray-200);">
            <a href="${escapeHtml(rec.source_url)}" target="_blank" rel="noopener noreferrer" class="source-link">
              <span>Verified Statutory Source</span>
              <span class="source-arrow">↗</span>
            </a>
          </div>
        ` : ''}
      </div>

      <div class="visa-notice-box" style="background-color:#f0fdf4; border-color:#bbf7d0; color:#166534;">
        <div class="visa-notice-title">
          <span>🎖️</span>
          <span>SVES Multi-Entry Exemption Option</span>
        </div>
        <p style="font-size:0.725rem;">
          Eligible travelers under any of the 24 designated SAARC categories (parliamentarians, judges, journalists, chamber heads, academics) can bypass routine consular queues with a 90-day multi-entry SVES sticker.
        </p>
      </div>
    </div>
  `;
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

// Responsive Plotly Resize on Orientation or Viewport Size Change
window.addEventListener('resize', () => {
  clearTimeout(window.__chartResizeTimeout);
  window.__chartResizeTimeout = setTimeout(() => {
    const heatmapEl = document.getElementById('matrix-heatmap');
    if (heatmapEl && typeof Plotly !== 'undefined' && heatmapEl.data) {
      Plotly.Plots.resize(heatmapEl);
    }
  }, 150);
});

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

// Tourism & Culture state
let tourismData = null;
let activeTourismSubview = 'monuments'; // 'monuments' | 'sdf' | 'circuit' | 'matrix'
let selectedTourismCountry = 'all';
let selectedTourismCircuit = 'buddhist_circuit';
let selectedSdfNights = 7;
let selectedSdfTravelers = 1;
let selectedMonumentId = 'IND_TAJ_MAHAL';

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

const COUNTRY_PROFILES = {
  AFG: {
    code: 'AFG',
    name: 'Afghanistan',
    officialName: 'Islamic Republic of Afghanistan',
    flag: '🇦🇫',
    capital: 'Kabul',
    membership: 'Admitted 2007 (14th Summit)',
    membershipType: 'Member State',
    population: '42.2M',
    populationRaw: 42200000,
    popWorldPct: '0.52%',
    popSouthAsiaPct: '2.1%',
    popRankWorld: 37,
    popRankSouthAsia: 4,
    gdpNominal: '$14.5 Billion',
    gdpPerCapita: '$350',
    gdpPpp: '$80.8 Billion',
    gdpRankWorld: 135,
    currencyName: 'Afghan Afghani',
    currencyCode: 'AFN',
    currencySymbol: '؋',
    exchangeRateUsd: '70.50 AFN',
    exchangeRateNote: 'Floating (1 USD ≈ 70.5 AFN)',
    topExports: 'Dried fruits, pomegranates, nuts, handmade carpets, lapis lazuli & minerals',
    geoStrategic: 'Landlocked mountainous crossroads connecting Central and South Asia',
    regionalRole: 'Transit corridor beneficiary via APTTA and Chabahar port agreements'
  },
  BGD: {
    code: 'BGD',
    name: 'Bangladesh',
    officialName: "People's Republic of Bangladesh",
    flag: '🇧🇩',
    capital: 'Dhaka',
    membership: 'Founding Member (1985)',
    membershipType: 'Founding Member',
    population: '173.0M',
    populationRaw: 173000000,
    popWorldPct: '2.12%',
    popSouthAsiaPct: '8.8%',
    popRankWorld: 8,
    popRankSouthAsia: 3,
    gdpNominal: '$455 Billion',
    gdpPerCapita: '$2,640',
    gdpPpp: '$1.62 Trillion',
    gdpRankWorld: 35,
    currencyName: 'Bangladeshi Taka',
    currencyCode: 'BDT',
    currencySymbol: '৳',
    exchangeRateUsd: '121.50 BDT',
    exchangeRateNote: 'Managed float (1 USD ≈ 121.5 BDT)',
    topExports: 'Ready-Made Garments (RMG), knitwear, textiles, jute, footwear & pharmaceuticals',
    geoStrategic: 'Bay of Bengal littoral gateway; host of historic 1st SAARC Summit (1985)',
    regionalRole: 'Major manufacturing exporter with bilateral river transit & coastal pacts'
  },
  BTN: {
    code: 'BTN',
    name: 'Bhutan',
    officialName: 'Kingdom of Bhutan',
    flag: '🇧🇹',
    capital: 'Thimphu',
    membership: 'Founding Member (1985)',
    membershipType: 'Founding Member',
    population: '787,000',
    populationRaw: 787000,
    popWorldPct: '0.010%',
    popSouthAsiaPct: '0.04%',
    popRankWorld: 165,
    popRankSouthAsia: 7,
    gdpNominal: '$3.1 Billion',
    gdpPerCapita: '$3,920',
    gdpPpp: '$10.8 Billion',
    gdpRankWorld: 165,
    currencyName: 'Bhutanese Ngultrum',
    currencyCode: 'BTN',
    currencySymbol: 'Nu.',
    exchangeRateUsd: '86.50 BTN',
    exchangeRateNote: 'Pegged 1:1 with Indian Rupee (Nu. 1 = ₹1)',
    topExports: 'Clean hydroelectricity, ferro-alloys, cardamom, dolomite & eco-tourism',
    geoStrategic: 'Carbon-negative Himalayan nation guided by Gross National Happiness',
    regionalRole: '1949/2007 Friendship Treaty guarantees passport-free bilateral border movement'
  },
  IND: {
    code: 'IND',
    name: 'India',
    officialName: 'Republic of India',
    flag: '🇮🇳',
    capital: 'New Delhi',
    membership: 'Founding Member (1985)',
    membershipType: 'Founding Member',
    population: '1.435 Billion',
    populationRaw: 1435000000,
    popWorldPct: '17.61%',
    popSouthAsiaPct: '72.8%',
    popRankWorld: 1,
    popRankSouthAsia: 1,
    gdpNominal: '$3.94 Trillion',
    gdpPerCapita: '$2,730',
    gdpPpp: '$14.6 Trillion',
    gdpRankWorld: 5,
    currencyName: 'Indian Rupee',
    currencyCode: 'INR',
    currencySymbol: '₹',
    exchangeRateUsd: '86.50 INR',
    exchangeRateNote: 'Floating (1 USD ≈ 86.50 INR)',
    topExports: 'IT & software services, generic pharma, refined petroleum, automotive, gems',
    geoStrategic: 'Central regional anchor sharing land/maritime frontiers with 6 SAARC states',
    regionalRole: 'Primary contributor of university medical/engineering quotas & transit ports'
  },
  MDV: {
    code: 'MDV',
    name: 'Maldives',
    officialName: 'Republic of Maldives',
    flag: '🇲🇻',
    capital: 'Malé',
    membership: 'Founding Member (1985)',
    membershipType: 'Founding Member',
    population: '521,000',
    populationRaw: 521000,
    popWorldPct: '0.0064%',
    popSouthAsiaPct: '0.03%',
    popRankWorld: 174,
    popRankSouthAsia: 8,
    gdpNominal: '$7.2 Billion',
    gdpPerCapita: '$13,800',
    gdpPpp: '$14.7 Billion',
    gdpRankWorld: 153,
    currencyName: 'Maldivian Rufiyaa',
    currencyCode: 'MVR',
    currencySymbol: 'Rf',
    exchangeRateUsd: '15.42 MVR',
    exchangeRateNote: 'Fixed peg to USD (1 USD = 15.42 MVR)',
    topExports: 'Luxury island hospitality & tourism, pole-and-line skipjack tuna, marine transport',
    geoStrategic: 'Archipelagic Indian Ocean state; highest per-capita GDP in South Asia',
    regionalRole: 'Key maritime partner with guaranteed bilateral essential food & medicine quotas'
  },
  NPL: {
    code: 'NPL',
    name: 'Nepal',
    officialName: 'Federal Democratic Republic of Nepal',
    flag: '🇳🇵',
    capital: 'Kathmandu',
    membership: 'Founding Member (1985)',
    membershipType: 'Founding Member & SAARC HQ',
    population: '30.9M',
    populationRaw: 30900000,
    popWorldPct: '0.38%',
    popSouthAsiaPct: '1.6%',
    popRankWorld: 49,
    popRankSouthAsia: 5,
    gdpNominal: '$42.5 Billion',
    gdpPerCapita: '$1,380',
    gdpPpp: '$158 Billion',
    gdpRankWorld: 101,
    currencyName: 'Nepalese Rupee',
    currencyCode: 'NPR',
    currencySymbol: 'रू',
    exchangeRateUsd: '138.40 NPR',
    exchangeRateNote: 'Pegged to INR (1.60 NPR = 1.00 INR)',
    topExports: 'Hydroelectric power, mountain trekking & mountaineering, tea, cardamom, handicrafts',
    geoStrategic: 'Landlocked Himalayan nation; host of permanent SAARC Secretariat in Kathmandu',
    regionalRole: '1950 Friendship Treaty establishes open border, national treatment & work rights'
  },
  PAK: {
    code: 'PAK',
    name: 'Pakistan',
    officialName: 'Islamic Republic of Pakistan',
    flag: '🇵🇰',
    capital: 'Islamabad',
    membership: 'Founding Member (1985)',
    membershipType: 'Founding Member',
    population: '245.2M',
    populationRaw: 245200000,
    popWorldPct: '3.01%',
    popSouthAsiaPct: '12.4%',
    popRankWorld: 5,
    popRankSouthAsia: 2,
    gdpNominal: '$378 Billion',
    gdpPerCapita: '$1,540',
    gdpPpp: '$1.58 Trillion',
    gdpRankWorld: 42,
    currencyName: 'Pakistani Rupee',
    currencyCode: 'PKR',
    currencySymbol: '₨',
    exchangeRateUsd: '279.50 PKR',
    exchangeRateNote: 'Floating (1 USD ≈ 279.50 PKR)',
    topExports: 'Textiles & cotton apparel, basmati rice, surgical tools, sports goods, leather',
    geoStrategic: 'Gateway connecting South Asia, Arabian Sea and Central Asia via Gwadar/Karachi',
    regionalRole: '2nd-largest economy; major bilateral higher education donor via PTAP scholarships'
  },
  LKA: {
    code: 'LKA',
    name: 'Sri Lanka',
    officialName: 'Democratic Socialist Republic of Sri Lanka',
    flag: '🇱🇰',
    capital: 'Colombo / Sri Jayawardenepura Kotte',
    membership: 'Founding Member (1985)',
    membershipType: 'Founding Member',
    population: '22.4M',
    populationRaw: 22400000,
    popWorldPct: '0.27%',
    popSouthAsiaPct: '1.1%',
    popRankWorld: 59,
    popRankSouthAsia: 6,
    gdpNominal: '$84.4 Billion',
    gdpPerCapita: '$3,830',
    gdpPpp: '$352 Billion',
    gdpRankWorld: 77,
    currencyName: 'Sri Lankan Rupee',
    currencyCode: 'LKR',
    currencySymbol: 'Rs',
    exchangeRateUsd: '298.50 LKR',
    exchangeRateNote: 'Floating (1 USD ≈ 298.50 LKR)',
    topExports: 'Pure Ceylon tea, high-end apparel, solid rubber tires, cinnamon, container transshipment',
    geoStrategic: 'Indian Ocean maritime shipping hub (Port of Colombo transshipment leader)',
    regionalRole: 'High Human Development Index (0.780); pioneer of bilateral FTA accords (ISFTA)'
  }
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

  if (data && data.tourism) {
    tourismData = data.tourism;
  } else {
    fetch('./data/tourism_data.json')
      .then(res => res.json())
      .then(td => {
        tourismData = td;
        if (activeView === 'tourism') renderActiveView();
      })
      .catch(() => {
        fetch('data/tourism_data.json')
          .then(res => res.json())
          .then(td => {
            tourismData = td;
            if (activeView === 'tourism') renderActiveView();
          })
          .catch(err => console.warn('Could not load tourism_data.json:', err));
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

/* ==========================================================================
   Country Metrics Hover Popover Engine
   ========================================================================== */

let activeCountryPopoverEl = null;
let popoverHideTimeout = null;
let currentHoveredTrigger = null;

function getCountryProvisionsStats(code) {
  let granted = 0;
  let received = 0;
  if (globalData && globalData.details) {
    const countries = globalData.countries || Object.keys(COUNTRY_PROFILES);
    countries.forEach(p => {
      if (p !== code) {
        if (globalData.details[code]?.[p]) {
          granted += globalData.details[code][p].length;
        }
        if (globalData.details[p]?.[code]) {
          received += globalData.details[p][code].length;
        }
      }
    });
  } else {
    // Verified fallback counts from index dataset
    const defaults = {
      IND: { granted: 45, received: 24 },
      LKA: { granted: 35, received: 24 },
      NPL: { granted: 28, received: 27 },
      BTN: { granted: 24, received: 28 },
      BGD: { granted: 23, received: 27 },
      PAK: { granted: 21, received: 26 },
      MDV: { granted: 21, received: 28 },
      AFG: { granted: 14, received: 27 }
    };
    if (defaults[code]) return defaults[code];
  }
  return { granted, received };
}

function renderCountryPopoverHtml(cCode) {
  const p = COUNTRY_PROFILES[cCode];
  if (!p) return '';
  const prov = getCountryProvisionsStats(cCode);
  
  // Calculate relative bar width for population share (clamped between 3% and 100% for clear visibility)
  const barWidth = Math.max(3, Math.min(100, parseFloat(p.popWorldPct) * 4.5));

  return `
    <div class="country-hover-popover-inner">
      <div class="popover-arrow"></div>
      
      <!-- Header -->
      <div class="popover-header">
        <div class="popover-flag-wrap" aria-hidden="true">${p.flag}</div>
        <div class="popover-title-wrap">
          <div class="popover-top-line">
            <span class="popover-code-pill">${p.code}</span>
            <span class="popover-saarc-badge">${escapeHtml(p.membership)}</span>
          </div>
          <h3 class="popover-country-name">${escapeHtml(p.name)}</h3>
          <div class="popover-official-meta" title="${escapeHtml(p.officialName)} • Capital: ${escapeHtml(p.capital)}">
            ${escapeHtml(p.officialName)} • 🏛️ ${escapeHtml(p.capital)}
          </div>
        </div>
      </div>

      <!-- Key Metrics 2x2 Grid -->
      <div class="popover-metrics-grid">
        <!-- Metric 1: Population & World Share -->
        <div class="popover-metric-box">
          <div class="popover-metric-label">
            <span>👥</span>
            <span>Population</span>
          </div>
          <div class="popover-metric-val">
            <span>${p.population}</span>
            <span class="popover-metric-badge">${p.popWorldPct} World</span>
          </div>
          <div class="popover-bar-container" title="${p.popWorldPct} of global population (~8.15 Billion)">
            <div class="popover-bar-fill" style="width: ${barWidth}%;"></div>
          </div>
          <div class="popover-metric-sub">
            Rank <strong>#${p.popRankWorld}</strong> globally • <strong>${p.popSouthAsiaPct}</strong> of South Asia
          </div>
        </div>

        <!-- Metric 2: GDP -->
        <div class="popover-metric-box">
          <div class="popover-metric-label">
            <span>📈</span>
            <span>Nominal GDP</span>
          </div>
          <div class="popover-metric-val">
            <span>${p.gdpNominal}</span>
            <span class="popover-metric-badge emerald">Rank #${p.gdpRankWorld}</span>
          </div>
          <div class="popover-metric-sub">
            Per Capita: <strong>${p.gdpPerCapita}</strong> • PPP: <strong>${p.gdpPpp}</strong>
          </div>
        </div>

        <!-- Metric 3: Currency & FX Exchange Rate -->
        <div class="popover-metric-box">
          <div class="popover-metric-label">
            <span>💱</span>
            <span>Currency & FX</span>
          </div>
          <div class="popover-metric-val">
            <span style="font-size:0.86rem;">${p.currencyName}</span>
            <span class="popover-metric-badge amber">${p.currencyCode} (${p.currencySymbol})</span>
          </div>
          <div class="popover-fx-rate">
            1 USD ≈ ${p.exchangeRateUsd}
          </div>
          <div class="popover-metric-sub" style="font-size:0.65rem;">
            ${escapeHtml(p.exchangeRateNote)}
          </div>
        </div>

        <!-- Metric 4: Bilateral Accords in Index -->
        <div class="popover-metric-box">
          <div class="popover-metric-label">
            <span>📜</span>
            <span>Bilateral Accords</span>
          </div>
          <div class="popover-metric-val">
            <span style="font-size: 0.92rem;">${prov.granted} Granted</span>
            <span class="popover-metric-badge" style="background:#f1f5f9; color:#334155;">${prov.received} Recv.</span>
          </div>
          <div class="popover-metric-sub">
            Active bilateral treaties & tariff concessions in this index
          </div>
        </div>
      </div>

      <!-- Informative Context Rows -->
      <div class="popover-info-block">
        <div class="popover-info-row">
          <span class="popover-info-tag">Top Exports & Pillars:</span>
          <span class="popover-info-text">${escapeHtml(p.topExports)}</span>
        </div>
        <div class="popover-info-row">
          <span class="popover-info-tag">Regional Role:</span>
          <span class="popover-info-text">${escapeHtml(p.geoStrategic)}</span>
        </div>
      </div>

      <div class="popover-source-citation" style="font-size: 0.65rem; color: var(--color-gray-500); padding: 0.35rem 0.2rem 0; border-top: 1px dashed var(--color-gray-200); margin-top: 0.35rem; text-align: right;">
        Sources: World Bank WDI, IMF World Economic Outlook, National Central Banks
      </div>

      <!-- Footer Action -->
      <div class="popover-footer">
        <button type="button" class="popover-focus-btn" data-focus-country="${p.code}">
          <span>Explore ${escapeHtml(p.name)} in Dashboard</span>
          <span aria-hidden="true">➔</span>
        </button>
      </div>
    </div>
  `;
}

function showCountryPopover(triggerEl, countryCode) {
  if (!triggerEl || !countryCode || !COUNTRY_PROFILES[countryCode]) return;
  clearTimeout(popoverHideTimeout);

  if (!activeCountryPopoverEl) {
    activeCountryPopoverEl = document.createElement('div');
    activeCountryPopoverEl.id = 'country-hover-popover';
    activeCountryPopoverEl.className = 'country-hover-popover';
    activeCountryPopoverEl.setAttribute('role', 'tooltip');
    activeCountryPopoverEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(activeCountryPopoverEl);

    // Keep popover open while hovering over the popover content itself
    activeCountryPopoverEl.addEventListener('mouseenter', () => {
      clearTimeout(popoverHideTimeout);
    });

    activeCountryPopoverEl.addEventListener('mouseleave', () => {
      hideCountryPopover(false);
    });

    // Handle clicks inside popover (such as the Focus in Dashboard button)
    activeCountryPopoverEl.addEventListener('click', (e) => {
      const focusBtn = e.target.closest('[data-focus-country]');
      if (focusBtn) {
        const code = focusBtn.getAttribute('data-focus-country');
        focusOnCountry(code);
      }
    });
  }

  // Update previous trigger class
  if (currentHoveredTrigger && currentHoveredTrigger !== triggerEl) {
    currentHoveredTrigger.classList.remove('active-popover');
  }
  currentHoveredTrigger = triggerEl;
  triggerEl.classList.add('active-popover');

  // Render content
  activeCountryPopoverEl.innerHTML = renderCountryPopoverHtml(countryCode);
  activeCountryPopoverEl.setAttribute('aria-hidden', 'false');

  // Position popover
  positionCountryPopover(triggerEl);

  // Make visible
  activeCountryPopoverEl.classList.add('visible');
}

function positionCountryPopover(triggerEl) {
  if (!activeCountryPopoverEl || !triggerEl) return;

  const rect = triggerEl.getBoundingClientRect();
  const popover = activeCountryPopoverEl;
  
  // Make sure we have dimensions
  popover.style.display = 'block';
  const popRect = popover.getBoundingClientRect();
  const margin = 10;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  // Horizontal position: center on trigger element, clamped to viewport bounds
  let left = rect.left + (rect.width / 2) - (popRect.width / 2);
  left = Math.max(margin, Math.min(viewportWidth - popRect.width - margin, left));

  // Vertical position: prefer below trigger, flip above if not enough room
  let top = rect.bottom + 8;
  let isAbove = false;

  if (top + popRect.height > viewportHeight - margin) {
    if (rect.top - popRect.height - 8 > margin) {
      top = rect.top - popRect.height - 8;
      isAbove = true;
    } else {
      // If neither has full room, place where there's more space
      top = Math.max(margin, Math.min(viewportHeight - popRect.height - margin, top));
    }
  }

  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;

  if (isAbove) {
    popover.classList.remove('arrow-top');
    popover.classList.add('arrow-bottom');
  } else {
    popover.classList.remove('arrow-bottom');
    popover.classList.add('arrow-top');
  }

  // Adjust arrow position to point accurately at trigger center
  const arrow = popover.querySelector('.popover-arrow');
  if (arrow) {
    const triggerCenter = rect.left + (rect.width / 2);
    let arrowLeft = triggerCenter - left - 6;
    arrowLeft = Math.max(16, Math.min(popRect.width - 24, arrowLeft));
    arrow.style.left = `${arrowLeft}px`;
  }
}

function hideCountryPopover(immediate = false) {
  clearTimeout(popoverHideTimeout);
  const doHide = () => {
    if (activeCountryPopoverEl) {
      activeCountryPopoverEl.classList.remove('visible');
      activeCountryPopoverEl.setAttribute('aria-hidden', 'true');
    }
    if (currentHoveredTrigger) {
      currentHoveredTrigger.classList.remove('active-popover');
      currentHoveredTrigger = null;
    }
  };

  if (immediate) {
    doHide();
  } else {
    popoverHideTimeout = setTimeout(doHide, 180);
  }
}

function focusOnCountry(countryCode) {
  if (!countryCode || !COUNTRY_PROFILES[countryCode]) return;
  focusCountry = countryCode;

  const focusCountrySelect = document.getElementById('focus-country-select');
  if (focusCountrySelect) focusCountrySelect.value = countryCode;

  const visaPassportSelect = document.getElementById('visa-passport-select');
  if (visaPassportSelect) visaPassportSelect.value = countryCode;
  selectedPassport = countryCode;

  renderActiveView();
  autoSelectTopPartner(countryCode);

  hideCountryPopover(true);

  const mainContent = document.getElementById('matrix-section');
  if (mainContent) {
    mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function initCountryHoverTooltips() {
  const attachEvents = (chip) => {
    const countryCode = chip.getAttribute('data-country');
    if (!countryCode) return;

    // Mouse hover
    chip.addEventListener('mouseenter', () => {
      showCountryPopover(chip, countryCode);
    });

    chip.addEventListener('mouseleave', () => {
      hideCountryPopover(false);
    });

    // Keyboard focus
    chip.addEventListener('focus', () => {
      showCountryPopover(chip, countryCode);
    });

    chip.addEventListener('blur', () => {
      hideCountryPopover(false);
    });

    // Click / Touch toggle
    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeCountryPopoverEl && activeCountryPopoverEl.classList.contains('visible') && currentHoveredTrigger === chip) {
        // If already open, clicking again can focus into dashboard
        focusOnCountry(countryCode);
      } else {
        showCountryPopover(chip, countryCode);
      }
    });
  };

  // Attach to existing chips
  document.querySelectorAll('.scope-country-chip, [data-country]').forEach(attachEvents);

  // Close on outside clicks
  document.addEventListener('click', (e) => {
    if (activeCountryPopoverEl && activeCountryPopoverEl.classList.contains('visible')) {
      if (!activeCountryPopoverEl.contains(e.target) && (!currentHoveredTrigger || !currentHoveredTrigger.contains(e.target))) {
        hideCountryPopover(true);
      }
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideCountryPopover(true);
    }
  });

  // Reposition on scroll or resize if visible
  window.addEventListener('scroll', () => {
    if (activeCountryPopoverEl && activeCountryPopoverEl.classList.contains('visible') && currentHoveredTrigger) {
      positionCountryPopover(currentHoveredTrigger);
    }
  }, { passive: true });

  window.addEventListener('resize', () => {
    if (activeCountryPopoverEl && activeCountryPopoverEl.classList.contains('visible') && currentHoveredTrigger) {
      positionCountryPopover(currentHoveredTrigger);
    }
  });
}

// Auto-initialize hover tooltips as soon as DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCountryHoverTooltips);
} else {
  initCountryHoverTooltips();
}

function initVisualization() {
  renderActiveView();
  setupEventListeners();
  initCountryHoverTooltips();

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

  // Tourism & Culture sub-view controls
  const tourismToggleBtns = document.querySelectorAll('.tourism-toggle-btn');
  const tourismCountryCont = document.getElementById('tourism-country-filter-cont');
  const tourismCircuitCont = document.getElementById('tourism-circuit-filter-cont');
  tourismToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tourismToggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTourismSubview = btn.dataset.subview;
      if (tourismCountryCont) {
        tourismCountryCont.style.display = activeTourismSubview === 'monuments' ? 'flex' : 'none';
      }
      if (tourismCircuitCont) {
        tourismCircuitCont.style.display = activeTourismSubview === 'circuit' ? 'flex' : 'none';
      }
      updateViewChrome();
      renderActiveView();
    });
  });

  const tourismCountrySelect = document.getElementById('tourism-country-select');
  if (tourismCountrySelect) {
    tourismCountrySelect.addEventListener('change', (e) => {
      selectedTourismCountry = e.target.value;
      renderActiveView();
    });
  }

  const tourismCircuitSelect = document.getElementById('tourism-circuit-select');
  if (tourismCircuitSelect) {
    tourismCircuitSelect.addEventListener('change', (e) => {
      selectedTourismCircuit = e.target.value;
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
  const tourismControls = document.getElementById('view-tourism-controls');
  const mainTitle = document.getElementById('view-main-title');
  const caption = document.getElementById('view-caption');
  const hintText = document.getElementById('view-hint-text');
  const badgeType = document.getElementById('view-badge-type');

  const countryName = COUNTRY_NAMES[focusCountry] || focusCountry;
  const countryFlag = COUNTRY_FLAGS[focusCountry] || '';

  if (visaControls && activeView !== 'visas') {
    visaControls.style.display = 'none';
  }
  if (tourismControls && activeView !== 'tourism') {
    tourismControls.style.display = 'none';
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
  } else if (activeView === 'tourism') {
    if (focusControls) focusControls.style.display = 'none';
    if (quotaControls) quotaControls.style.display = 'none';
    if (visaControls) visaControls.style.display = 'none';
    if (tourismControls) tourismControls.style.display = 'flex';
    if (badgeType) badgeType.textContent = 'TOURISM & HERITAGE CONCESSIONS';

    const tourismCountryCont = document.getElementById('tourism-country-filter-cont');
    const tourismCircuitCont = document.getElementById('tourism-circuit-filter-cont');

    if (activeTourismSubview === 'monuments') {
      if (tourismCountryCont) tourismCountryCont.style.display = 'flex';
      if (tourismCircuitCont) tourismCircuitCont.style.display = 'none';
      if (mainTitle) mainTitle.textContent = '🏛️ UNESCO World Heritage Monument Entry Parity & Concessions';
      if (caption) {
        caption.innerHTML = `Comparing Domestic Citizen rates, SAARC Regional rates, and International Foreign Visitor ticket prices across 24 flagship cultural sites.`;
      }
      if (hintText) {
        hintText.innerHTML = `<span class="hint-bullet">●</span> Click any monument card below to inspect its primary statutory notification, Archaeological Survey of India (ASI) schedule, or Central Cultural Fund decree.`;
      }
    } else if (activeTourismSubview === 'sdf') {
      if (tourismCountryCont) tourismCountryCont.style.display = 'none';
      if (tourismCircuitCont) tourismCircuitCont.style.display = 'none';
      if (mainTitle) mainTitle.textContent = '🇧🇹 Bhutan Sustainable Development Fee (SDF) Regional Concession';
      if (caption) {
        caption.innerHTML = `Quantifying the multi-day financial impact of Bhutan's statutory tourism levy waiver for Indian and regional travelers under the Tourism Levy Act.`;
      }
      if (hintText) {
        hintText.innerHTML = `<span class="hint-bullet">●</span> Toggle trip duration and traveler count to calculate direct dollar savings compared to standard non-regional tourist tariffs.`;
      }
    } else if (activeTourismSubview === 'circuit') {
      if (tourismCountryCont) tourismCountryCont.style.display = 'none';
      if (tourismCircuitCont) tourismCircuitCont.style.display = 'flex';
      if (mainTitle) mainTitle.textContent = '🗺️ Cross-Border Heritage Circuits Cumulative Cost Trajectory';
      if (caption) {
        caption.innerHTML = `Tracking step-by-step entry fees and cumulative savings across integrated cross-border pilgrimage and cultural itineraries.`;
      }
      if (hintText) {
        hintText.innerHTML = `<span class="hint-bullet">●</span> Select a circuit route above to compare total ticket expenses for international tourists vs SAARC regional citizens.`;
      }
    } else if (activeTourismSubview === 'matrix') {
      if (tourismCountryCont) tourismCountryCont.style.display = 'none';
      if (tourismCircuitCont) tourismCircuitCont.style.display = 'none';
      if (mainTitle) mainTitle.textContent = '⊞ Bilateral Heritage & Tourism Reciprocity Matrix';
      if (caption) {
        caption.innerHTML = `8×8 cross-border grid mapping destination monument policies (Rows) vs traveler origin passports (Columns).`;
      }
      if (hintText) {
        hintText.innerHTML = `<span class="hint-bullet">●</span> Click any cell in the 8×8 grid to inspect bilateral monument admission treaties, municipal bylaws, and legal frameworks.`;
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
      heatmapEl.classList.remove('tourism-view-active');
      heatmapEl.style.height = 'auto';
      heatmapEl.style.overflow = 'visible';
    } else if (activeView === 'tourism') {
      heatmapEl.classList.add('tourism-view-active');
      heatmapEl.classList.remove('visa-view-active');
      heatmapEl.style.height = 'auto';
      heatmapEl.style.overflow = 'visible';
    } else {
      heatmapEl.classList.remove('visa-view-active');
      heatmapEl.classList.remove('tourism-view-active');
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
  } else if (activeView === 'tourism') {
    renderTourismView();
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

  if (activeView === 'tourism' && tourismData) {
    displayTourismDossier(provider, beneficiary);
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

/* ==========================================================================
   Tourism & Culture Visualizations & Dossiers
   ========================================================================== */

function renderTourismView() {
  const container = document.getElementById('matrix-heatmap');
  if (!container) return;

  if (!tourismData) {
    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:450px;flex-direction:column;gap:0.75rem;color:var(--color-gray-600);">
        <div style="font-size:1.5rem;">🏛️</div>
        <p style="font-weight:600;">Loading regional tourism & heritage dataset...</p>
      </div>
    `;
    return;
  }

  if (activeTourismSubview === 'monuments') {
    renderTourismMonuments(container);
  } else if (activeTourismSubview === 'sdf') {
    renderBhutanSdf(container);
  } else if (activeTourismSubview === 'circuit') {
    renderHeritageCircuits(container);
  } else if (activeTourismSubview === 'matrix') {
    renderTourismMatrix(container);
  }
}

/**
 * 1. Monument Parity & Entry Fee Comparison
 */
function renderTourismMonuments(container) {
  if (typeof Plotly !== 'undefined' && Plotly.purge) {
    try { Plotly.purge(container); } catch (e) { /* ignore */ }
  }

  const allMonuments = tourismData.monuments || [];
  const filtered = selectedTourismCountry === 'all'
    ? allMonuments
    : allMonuments.filter(m => m.country === selectedTourismCountry);

  // Calculate high-level stats
  const totalMonuments = allMonuments.length;
  const avgDiscount = (allMonuments.reduce((acc, m) => acc + (m.savings_pct || 0), 0) / totalMonuments).toFixed(1);
  const indMonuments = allMonuments.filter(m => m.country === 'IND');
  const maxSavingsMon = allMonuments.reduce((prev, cur) => (cur.savings_usd > prev.savings_usd) ? cur : prev, allMonuments[0]);

  let html = `
    <div class="tourism-view-container">
      <!-- High-Level Metric Stat Cards -->
      <div class="tourism-stats-grid">
        <div class="tourism-stat-card">
          <div class="tourism-stat-num">${totalMonuments} <span class="stat-unit">Sites</span></div>
          <div class="tourism-stat-title">Tracked Monuments</div>
          <div class="tourism-stat-hint">Across 6 South Asian nations</div>
        </div>

        <div class="tourism-stat-card">
          <div class="tourism-stat-num">${avgDiscount}% <span class="stat-unit">Off</span></div>
          <div class="tourism-stat-title">Average SAARC Discount</div>
          <div class="tourism-stat-hint">Savings vs international foreigner rate</div>
        </div>

        <div class="tourism-stat-card">
          <div class="tourism-stat-num">100% <span class="stat-unit">Parity</span></div>
          <div class="tourism-stat-title">India ASI Parity</div>
          <div class="tourism-stat-hint">All 143 ASI World Heritage monuments</div>
        </div>

        <div class="tourism-stat-card">
          <div class="tourism-stat-num">$${maxSavingsMon?.savings_usd?.toFixed(2) || '12.65'} <span class="stat-unit">Saved</span></div>
          <div class="tourism-stat-title">Max Single Entry Saving</div>
          <div class="tourism-stat-hint">${maxSavingsMon?.name || 'Taj Mahal, Agra'} (95.5% discount)</div>
        </div>
      </div>

      <!-- Grouped Bar Chart -->
      <div class="tourism-chart-wrapper">
        <div class="tourism-chart-header">
          <div class="tourism-chart-title">Monument Entry Ticket Price Comparison (USD $)</div>
          <div class="tourism-chart-hint">Comparing Domestic Citizen, SAARC Regional, and General Foreign Tourist ticket tariffs across protected heritage sites</div>
        </div>
        <div id="tourism-monuments-plotly" style="width: 100%; height: 380px;"></div>
      </div>

      <!-- Monument Cards Grid -->
      <div class="tourism-monuments-header">
        <div class="tourism-monuments-title">
          <span>🏛️</span>
          <span>Verified Protected Cultural Monuments (${filtered.length})</span>
        </div>
        <div style="font-size:0.75rem; color:var(--color-gray-600);">
          Click any card to inspect legal frameworks and official sources in the side dossier.
        </div>
      </div>

      <div class="tourism-monuments-grid">
  `;

  filtered.forEach(m => {
    const isSelected = selectedMonumentId === m.id;
    const flag = COUNTRY_FLAGS[m.country] || '';
    const badgeClass = m.parity_tier === 'domestic_parity' ? 'parity' : 'concession';

    html += `
      <div class="tourism-monument-card ${isSelected ? 'selected' : ''}" data-monument-id="${escapeHtml(m.id)}">
        <div class="monument-card-top">
          <div>
            <div class="monument-name">${flag} ${escapeHtml(m.name)}</div>
            <div class="monument-location">${escapeHtml(m.state_region)} • ${m.unesco_year ? `UNESCO ${m.unesco_year}` : 'Protected Site'}</div>
          </div>
          <span class="monument-tier-badge ${badgeClass}">${escapeHtml(m.parity_tier_label)}</span>
        </div>

        <div class="monument-price-row">
          <div class="monument-price-item">
            <span class="monument-price-label">Domestic</span>
            <span class="monument-price-val">$${m.domestic_usd.toFixed(2)}</span>
          </div>
          <div class="monument-price-item" style="color:#059669;">
            <span class="monument-price-label" style="color:#059669;">SAARC Rate</span>
            <span class="monument-price-val">$${m.saarc_usd.toFixed(2)}</span>
          </div>
          <div class="monument-price-item" style="color:#dc2626;">
            <span class="monument-price-label" style="color:#dc2626;">Foreign</span>
            <span class="monument-price-val">$${m.foreign_usd.toFixed(2)}</span>
          </div>
        </div>

        <div class="monument-savings-bar">
          <span style="color:var(--color-gray-600);font-size:0.7rem;">Official Currency: ${m.currency_symbol} ${m.saarc_fee.toLocaleString()}</span>
          <span class="monument-savings-highlight">
            <span>⚡ Save $${m.savings_usd.toFixed(2)} (${m.savings_pct}%)</span>
          </span>
        </div>
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Render Plotly Bar Chart
  const chartEl = document.getElementById('tourism-monuments-plotly');
  if (chartEl && typeof Plotly !== 'undefined') {
    // Select up to 10-12 sites for visual elegance
    const chartSites = filtered.slice(0, 12);
    const xLabels = chartSites.map(m => `${COUNTRY_FLAGS[m.country] || ''} ${m.name.split(',')[0].split('(')[0].trim()}`);
    const domesticFees = chartSites.map(m => m.domestic_usd);
    const saarcFees = chartSites.map(m => m.saarc_usd);
    const foreignFees = chartSites.map(m => m.foreign_usd);

    const traces = [
      {
        x: xLabels,
        y: domesticFees,
        name: 'Domestic Citizen Rate',
        type: 'bar',
        marker: { color: '#10b981' },
        hovertemplate: '<b>%{x}</b><br>Domestic Citizen: $%{y:.2f}<extra></extra>'
      },
      {
        x: xLabels,
        y: saarcFees,
        name: 'SAARC Regional Rate',
        type: 'bar',
        marker: { color: '#2563eb' },
        hovertemplate: '<b>%{x}</b><br>SAARC National: $%{y:.2f}<extra></extra>'
      },
      {
        x: xLabels,
        y: foreignFees,
        name: 'General Foreign Tourist Rate',
        type: 'bar',
        marker: { color: '#ef4444' },
        hovertemplate: '<b>%{x}</b><br>Foreign International: $%{y:.2f}<extra></extra>'
      }
    ];

    const isMobile = window.innerWidth <= 640;
    const layout = {
      barmode: 'group',
      margin: isMobile ? { l: 40, r: 15, t: 35, b: 90 } : { l: 45, r: 20, t: 30, b: 80 },
      xaxis: {
        tickangle: -25,
        tickfont: { family: 'inherit', size: isMobile ? 9 : 10, color: '#374151' },
        showgrid: false
      },
      yaxis: {
        title: { text: 'Entry Fee (USD $)', font: { size: 11, color: '#4b5563' } },
        gridcolor: '#e5e7eb',
        zerolinecolor: '#e5e7eb'
      },
      legend: {
        orientation: 'h',
        x: isMobile ? 0 : 0.5,
        xanchor: isMobile ? 'left' : 'center',
        y: isMobile ? 1.25 : 1.14,
        font: { family: 'inherit', size: isMobile ? 9 : 11, color: '#374151' }
      },
      plot_bgcolor: 'transparent',
      paper_bgcolor: 'transparent',
      autosize: true
    };

    Plotly.react(chartEl, traces, layout, { responsive: true, displayModeBar: false });
  }

  // Bind Monument card click events
  container.querySelectorAll('.tourism-monument-card').forEach(card => {
    card.addEventListener('click', () => {
      const monId = card.getAttribute('data-monument-id');
      const mon = allMonuments.find(m => m.id === monId);
      if (mon) {
        selectedMonumentId = mon.id;
        container.querySelectorAll('.tourism-monument-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        displayMonumentDossier(mon);
      }
    });
  });

  // Auto-inspect the currently selected monument (or the first one)
  const initialMon = allMonuments.find(m => m.id === selectedMonumentId) || filtered[0] || allMonuments[0];
  if (initialMon) {
    displayMonumentDossier(initialMon);
  }
}

/**
 * 2. Bhutan Sustainable Development Fee (SDF) Interactive Simulator
 */
function renderBhutanSdf(container) {
  if (typeof Plotly !== 'undefined' && Plotly.purge) {
    try { Plotly.purge(container); } catch (e) { /* ignore */ }
  }

  const sdfData = tourismData.bhutan_sdf;
  if (!sdfData) return;

  const intlRate = 100.0; // USD per night
  const indianRate = 14.40; // USD per night (~BTN 1,200)

  const totalNights = selectedSdfNights;
  const totalTravelers = selectedSdfTravelers;

  const intlTotal = intlRate * totalNights * totalTravelers;
  const indianTotal = indianRate * totalNights * totalTravelers;
  const netSavings = intlTotal - indianTotal;
  const savingsPct = ((netSavings / intlTotal) * 100).toFixed(1);

  let html = `
    <div class="tourism-view-container">
      <!-- Interactive Calculator Controls & Impact Cards -->
      <div class="sdf-scenario-container">
        <div class="sdf-controls-row">
          <div class="sdf-control-group">
            <span class="sdf-control-label">Trip Duration:</span>
            <div class="sdf-pills-wrap" id="sdf-nights-pills">
              ${[1, 3, 5, 7, 10, 14].map(n => `
                <button class="sdf-pill-btn ${selectedSdfNights === n ? 'active' : ''}" data-nights="${n}">
                  ${n} ${n === 1 ? 'Night' : 'Nights'}${n === 7 ? ' (1 Wk)' : n === 14 ? ' (2 Wks)' : ''}
                </button>
              `).join('')}
            </div>
          </div>

          <div class="sdf-control-group">
            <span class="sdf-control-label">Travel Party:</span>
            <div class="sdf-pills-wrap" id="sdf-party-pills">
              ${[
                { count: 1, label: 'Solo (1)' },
                { count: 2, label: 'Couple (2)' },
                { count: 4, label: 'Family of 4' }
              ].map(p => `
                <button class="sdf-pill-btn ${selectedSdfTravelers === p.count ? 'active' : ''}" data-party="${p.count}">
                  ${p.label}
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="sdf-impact-cards-grid">
          <div class="sdf-impact-card international">
            <span class="sdf-card-badge">Standard International Visitor</span>
            <div class="sdf-card-amount">$${intlTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div class="sdf-card-detail">
              Statutory $100/night SDF × ${totalNights} nights × ${totalTravelers} ${totalTravelers === 1 ? 'person' : 'people'} (mandatory USD forex transfer).
            </div>
          </div>

          <div class="sdf-impact-card indian">
            <span class="sdf-card-badge">Indian / Regional Concession</span>
            <div class="sdf-card-amount">$${indianTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div class="sdf-card-detail">
              Capped BTN/INR 1,200 (~$14.40)/night rate. Direct local currency payment without foreign exchange surcharges.
            </div>
          </div>

          <div class="sdf-impact-card savings">
            <span class="sdf-card-badge">Direct Government Tax Savings</span>
            <div class="sdf-card-amount" style="color:#047857;">⚡ $${netSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div class="sdf-card-detail">
              <strong>${savingsPct}% Direct Saving</strong> on government tourist levies alone for the exact same trip itinerary.
            </div>
          </div>
        </div>
      </div>

      <!-- Chart Wrapper for Multi-Day Trajectory -->
      <div class="tourism-chart-wrapper">
        <div class="tourism-chart-header">
          <div class="tourism-chart-title">Bhutan SDF Cumulative Cost by Stay Duration (${totalTravelers} ${totalTravelers === 1 ? 'Traveler' : 'Travelers'})</div>
          <div class="tourism-chart-hint">Mandatory Sustainable Development Fee (SDF) in USD across standard trip durations (Tourism Levy Act of Bhutan)</div>
        </div>
        <div id="tourism-sdf-plotly" style="width: 100%; height: 360px;"></div>
      </div>

      <!-- Legal & Bilateral Framework Briefing Box -->
      <div class="surface-card" style="padding:1.25rem; border:1px solid var(--color-border); border-radius:var(--radius-md);">
        <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.4rem;">
          <span style="font-size:1.15rem;">📜</span>
          <h4 style="font-size:0.95rem; font-weight:800; color:var(--color-black); margin:0;">
            Statutory Basis: Tourism Levy Act of Bhutan 2022 (Act No. 13)
          </h4>
        </div>
        <p style="font-size:0.775rem; color:var(--color-gray-700); line-height:1.45; margin:0 0 0.75rem 0;">
          Bhutan enforces a statutory daily Sustainable Development Fee (SDF) on all inbound leisure tourists to preserve fragile Himalayan ecology and support free healthcare and education. While third-country international tourists pay $100 per adult per night, Indian nationals benefit from a special bilateral treaty concession capping the fee at BTN / INR 1,200 per night.
        </p>
        <div style="display:flex; gap:0.75rem; flex-wrap:wrap; font-size:0.75rem;">
          <div style="background:var(--color-gray-100); padding:0.4rem 0.65rem; border-radius:var(--radius-sm);">
            <strong>Currency Parity:</strong> Indian Rupee (INR) accepted directly at 1:1 parity with Bhutanese Ngultrum (BTN).
          </div>
          <div style="background:var(--color-gray-100); padding:0.4rem 0.65rem; border-radius:var(--radius-sm);">
            <strong>Visa Fee Exemption:</strong> Indian travelers enter with online entry permits without paying the $40 tourist visa fee.
          </div>
          <div style="background:var(--color-gray-100); padding:0.4rem 0.65rem; border-radius:var(--radius-sm);">
            <strong>Bilateral MoUs:</strong> Bangladesh and Maldives maintain reciprocal concessionary visitor arrangements.
          </div>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Render Multi-Night Trajectory Chart
  const chartEl = document.getElementById('tourism-sdf-plotly');
  if (chartEl && typeof Plotly !== 'undefined') {
    const durations = sdfData.stay_durations || [];
    const xLabels = durations.map(d => `${d.nights} Nights`);
    const intlCosts = durations.map(d => d.intl_usd * totalTravelers);
    const indianCosts = durations.map(d => d.indian_usd * totalTravelers);
    const savings = durations.map(d => d.savings_usd * totalTravelers);

    const traces = [
      {
        x: xLabels,
        y: intlCosts,
        name: `International Visitor Cost (${totalTravelers} ${totalTravelers === 1 ? 'pax' : 'people'})`,
        type: 'bar',
        marker: { color: '#ef4444' },
        hovertemplate: '<b>%{x}</b><br>International SDF: $%{y:,.2f}<extra></extra>'
      },
      {
        x: xLabels,
        y: indianCosts,
        name: `Indian / Regional Rate (${totalTravelers} ${totalTravelers === 1 ? 'pax' : 'people'})`,
        type: 'bar',
        marker: { color: '#10b981' },
        hovertemplate: '<b>%{x}</b><br>Regional SDF: $%{y:,.2f}<extra></extra>'
      },
      {
        x: xLabels,
        y: savings,
        name: `Net Cash Savings (${totalTravelers} ${totalTravelers === 1 ? 'pax' : 'people'})`,
        type: 'bar',
        marker: { color: '#2563eb' },
        hovertemplate: '<b>%{x}</b><br>Cash Saved: $%{y:,.2f}<extra></extra>'
      }
    ];

    const isMobile = window.innerWidth <= 640;
    const layout = {
      barmode: 'group',
      margin: isMobile ? { l: 45, r: 15, t: 35, b: 50 } : { l: 55, r: 20, t: 30, b: 50 },
      xaxis: {
        tickfont: { family: 'inherit', size: isMobile ? 10 : 11, color: '#374151' },
        showgrid: false
      },
      yaxis: {
        title: { text: 'Total Tourism Levy (USD $)', font: { size: 11, color: '#4b5563' } },
        gridcolor: '#e5e7eb',
        zerolinecolor: '#e5e7eb'
      },
      legend: {
        orientation: 'h',
        x: isMobile ? 0 : 0.5,
        xanchor: isMobile ? 'left' : 'center',
        y: isMobile ? 1.25 : 1.14,
        font: { family: 'inherit', size: isMobile ? 9 : 11, color: '#374151' }
      },
      plot_bgcolor: 'transparent',
      paper_bgcolor: 'transparent',
      autosize: true
    };

    Plotly.react(chartEl, traces, layout, { responsive: true, displayModeBar: false });
  }

  // Bind Night pills
  container.querySelectorAll('#sdf-nights-pills .sdf-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedSdfNights = parseInt(btn.getAttribute('data-nights'), 10);
      renderBhutanSdf(container);
    });
  });

  // Bind Party pills
  container.querySelectorAll('#sdf-party-pills .sdf-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedSdfTravelers = parseInt(btn.getAttribute('data-party'), 10);
      renderBhutanSdf(container);
    });
  });

  // Populate Inspector Panel with Bhutan SDF details
  displayBhutanSdfDossier();
}

/**
 * 3. Cross-Border Heritage Circuits Cumulative Cost Trajectory
 */
function renderHeritageCircuits(container) {
  if (typeof Plotly !== 'undefined' && Plotly.purge) {
    try { Plotly.purge(container); } catch (e) { /* ignore */ }
  }

  const circuits = tourismData.heritage_circuits || [];
  const currentCircuit = circuits.find(c => c.id === selectedTourismCircuit) || circuits[0];
  if (!currentCircuit) return;

  let html = `
    <div class="tourism-view-container">
      <!-- Circuit Summary Banner -->
      <div class="circuit-itinerary-box">
        <div class="circuit-header-info">
          <div>
            <div style="font-size:0.7rem; font-weight:700; text-transform:uppercase; color:#2563eb; letter-spacing:0.04em;">
              ${escapeHtml(currentCircuit.theme)}
            </div>
            <div class="circuit-route-name">${escapeHtml(currentCircuit.name)}</div>
            <div class="circuit-route-desc">${escapeHtml(currentCircuit.route_description)}</div>
          </div>
          <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
            <div class="tourism-stat-card" style="padding:0.5rem 0.85rem; min-width:140px;">
              <span class="monument-price-label">Intl Tourist Cost</span>
              <span style="font-size:1.15rem; font-weight:900; color:#dc2626;">$${currentCircuit.total_intl_usd.toFixed(2)}</span>
            </div>
            <div class="tourism-stat-card" style="padding:0.5rem 0.85rem; min-width:140px;">
              <span class="monument-price-label">SAARC Regional Cost</span>
              <span style="font-size:1.15rem; font-weight:900; color:#059669;">$${currentCircuit.total_saarc_usd.toFixed(2)}</span>
            </div>
            <div class="tourism-stat-card" style="padding:0.5rem 0.85rem; min-width:140px; background:#ecfdf5; border-color:#a7f3d0;">
              <span class="monument-price-label" style="color:#047857;">Net Trip Savings</span>
              <span style="font-size:1.15rem; font-weight:900; color:#047857;">⚡ $${currentCircuit.total_savings_usd.toFixed(2)} (${currentCircuit.savings_pct}%)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Cumulative Trajectory Chart -->
      <div class="tourism-chart-wrapper">
        <div class="tourism-chart-header">
          <div class="tourism-chart-title">Cumulative Entry Expense Trajectory (${escapeHtml(currentCircuit.name)})</div>
          <div class="tourism-chart-hint">Tracking step-by-step entry expenses and regional savings stop-by-stop</div>
        </div>
        <div id="tourism-circuit-plotly" style="width: 100%; height: 370px;"></div>
      </div>

      <!-- Step-by-Step Route Itinerary Stops -->
      <div class="circuit-stops-list">
        <div style="font-size:0.85rem; font-weight:800; color:var(--color-black); margin-bottom:0.25rem;">
          Route Stops & Entry Ticket Differential:
        </div>
  `;

  currentCircuit.stops.forEach(st => {
    const diff = (st.intl_usd - st.saarc_usd).toFixed(2);
    const pct = ((diff / st.intl_usd) * 100).toFixed(0);

    html += `
      <div class="circuit-stop-row">
        <div class="circuit-stop-index">${st.stop}</div>
        <div class="circuit-stop-name">${st.flag} ${escapeHtml(st.name)}</div>
        <div class="circuit-stop-fees">
          <span class="circuit-stop-intl">Intl: $${st.intl_usd.toFixed(2)}</span>
          <span style="color:var(--color-gray-400);">➔</span>
          <span class="circuit-stop-saarc">SAARC: $${st.saarc_usd.toFixed(2)}</span>
          <span style="background:#ecfdf5; color:#047857; font-weight:700; font-size:0.7rem; padding:0.15rem 0.45rem; border-radius:var(--radius-pill); border:1px solid #a7f3d0;">
            Save $${diff} (${pct}%)
          </span>
        </div>
      </div>
    `;
  });

  html += `
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Render Cumulative Line Chart
  const chartEl = document.getElementById('tourism-circuit-plotly');
  if (chartEl && typeof Plotly !== 'undefined') {
    const stops = currentCircuit.stops;
    const xLabels = stops.map(s => `${s.flag} Stop ${s.stop}: ${s.name.split('(')[0].trim()}`);

    let cumIntl = 0;
    let cumSaarc = 0;
    const yIntl = [];
    const ySaarc = [];

    stops.forEach(s => {
      cumIntl += s.intl_usd;
      cumSaarc += s.saarc_usd;
      yIntl.push(parseFloat(cumIntl.toFixed(2)));
      ySaarc.push(parseFloat(cumSaarc.toFixed(2)));
    });

    const traces = [
      {
        x: xLabels,
        y: yIntl,
        name: 'General International Visitor (Cumulative $)',
        type: 'scatter',
        mode: 'lines+markers',
        line: { color: '#ef4444', width: 3, shape: 'spline' },
        marker: { size: 8, color: '#dc2626' },
        hovertemplate: '<b>%{x}</b><br>International Total: $%{y:.2f}<extra></extra>'
      },
      {
        x: xLabels,
        y: ySaarc,
        name: 'SAARC National Rate (Cumulative $)',
        type: 'scatter',
        mode: 'lines+markers',
        line: { color: '#059669', width: 3, shape: 'spline' },
        marker: { size: 8, color: '#047857' },
        fill: 'tonexty',
        fillcolor: 'rgba(5, 150, 105, 0.08)',
        hovertemplate: '<b>%{x}</b><br>SAARC Total: $%{y:.2f}<extra></extra>'
      }
    ];

    const isMobile = window.innerWidth <= 640;
    const layout = {
      margin: isMobile ? { l: 45, r: 15, t: 35, b: 90 } : { l: 50, r: 25, t: 30, b: 80 },
      xaxis: {
        tickangle: -20,
        tickfont: { family: 'inherit', size: isMobile ? 9 : 10, color: '#374151' },
        showgrid: false
      },
      yaxis: {
        title: { text: 'Cumulative Ticket Expense (USD $)', font: { size: 11, color: '#4b5563' } },
        gridcolor: '#e5e7eb',
        zerolinecolor: '#e5e7eb'
      },
      legend: {
        orientation: 'h',
        x: isMobile ? 0 : 0.5,
        xanchor: isMobile ? 'left' : 'center',
        y: isMobile ? 1.25 : 1.14,
        font: { family: 'inherit', size: isMobile ? 9 : 11, color: '#374151' }
      },
      plot_bgcolor: 'transparent',
      paper_bgcolor: 'transparent',
      autosize: true
    };

    Plotly.react(chartEl, traces, layout, { responsive: true, displayModeBar: false });
  }

  displayCircuitDossier(currentCircuit);
}

/**
 * 4. 8x8 Bilateral Heritage & Tourism Reciprocity Matrix Grid
 */
function renderTourismMatrix(container) {
  if (typeof Plotly !== 'undefined' && Plotly.purge) {
    try { Plotly.purge(container); } catch (e) { /* ignore */ }
  }

  const countries = tourismData.metadata?.countries || ['AFG', 'BGD', 'BTN', 'IND', 'MDV', 'NPL', 'PAK', 'LKA'];
  const matrix = tourismData.reciprocity_matrix || {};
  const tiers = tourismData.reciprocity_tiers || {};

  let tableHtml = `
    <div class="tourism-view-container">
      <div class="tourism-matrix-layout">
        <div class="tourism-matrix-scroll">
          <table class="tourism-matrix-table" role="grid" aria-label="Bilateral Tourism & Heritage Reciprocity Grid">
            <thead>
              <tr>
                <th rowspan="2" style="background:#f1f5f9; font-size:0.7rem; width:130px;">
                  <div>🏛️ DESTINATION ➔</div>
                  <div style="font-size:0.6rem; color:var(--color-gray-600); margin-top:2px;">PASSPORT ORIGIN ⬇</div>
                </th>
                <th colspan="${countries.length}" style="background:#f8fafc; font-size:0.8rem; font-weight:800;">
                  🏛️ DESTINATION STATE (Host of Monuments / Surcharges)
                </th>
              </tr>
              <tr>
  `;

  countries.forEach(c => {
    const flag = COUNTRY_FLAGS[c] || '';
    tableHtml += `<th title="Destination: ${COUNTRY_NAMES[c] || c}">${flag} ${c}</th>`;
  });

  tableHtml += `</tr></thead><tbody>`;

  countries.forEach(orig => {
    const origFlag = COUNTRY_FLAGS[orig] || '';
    tableHtml += `<tr>`;
    tableHtml += `<th title="Citizen / Passport of ${COUNTRY_NAMES[orig] || orig}">${origFlag} ${orig}</th>`;

    countries.forEach(dest => {
      if (orig === dest) {
        tableHtml += `
          <td class="tourism-matrix-cell" style="background:#f8fafc; color:#94a3b8; font-weight:700;" title="Domestic Jurisdiction (${orig})">
            —
          </td>
        `;
        return;
      }

      // Note: In tourism matrix, DEST is the provider/host and ORIG is the beneficiary/traveler
      const cellData = matrix[dest]?.[orig];
      const tierId = cellData?.tier || 'standard_foreign';
      let tierBadge = '⚪ Standard';
      if (tierId === 'domestic_parity') tierBadge = '🟢 Domestic Parity';
      else if (tierId === 'regional_concession') tierBadge = '🔵 Concession';
      else if (tierId === 'bilateral_waiver') tierBadge = '🟡 Strategic Waiver';

      tableHtml += `
        <td class="tourism-matrix-cell" data-dest="${dest}" data-orig="${orig}" title="${escapeHtml(cellData?.summary || '')}">
          <span class="tourism-cell-badge ${tierId}">
            ${tierBadge}
          </span>
        </td>
      `;
    });

    tableHtml += `</tr>`;
  });

  tableHtml += `
            </tbody>
          </table>
        </div>
      </div>

      <!-- Reciprocity Tiers Legend -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:0.65rem;">
        <div style="padding:0.65rem 0.85rem; border-radius:var(--radius-sm); background:#ecfdf5; border:1px solid #a7f3d0; font-size:0.75rem;">
          <strong style="color:#047857;">🟢 Full Domestic Parity</strong>
          <p style="margin:0.2rem 0 0 0; color:#065f46; font-size:0.7rem;">
            India ASI: All SAARC citizens pay identical ticket fees as Indian domestic citizens (e.g. Taj Mahal ₹50 vs ₹1,100 foreign).
          </p>
        </div>

        <div style="padding:0.65rem 0.85rem; border-radius:var(--radius-sm); background:#eff6ff; border:1px solid #bfdbfe; font-size:0.75rem;">
          <strong style="color:#1d4ed8;">🔵 Regional Concession (50–85% off)</strong>
          <p style="margin:0.2rem 0 0 0; color:#1e40af; font-size:0.7rem;">
            Sri Lanka CCF (50%), Nepal Municipalities (50–75%), Pakistan & Bangladesh archaeology (80%).
          </p>
        </div>

        <div style="padding:0.65rem 0.85rem; border-radius:var(--radius-sm); background:#fffbeb; border:1px solid #fde68a; font-size:0.75rem;">
          <strong style="color:#b45309;">🟡 Bilateral Strategic Waiver</strong>
          <p style="margin:0.2rem 0 0 0; color:#92400e; font-size:0.7rem;">
            Bhutan SDF capped at ₹1,200/night for Indian, Bangladeshi, and Maldivian nationals under bilateral MoUs.
          </p>
        </div>

        <div style="padding:0.65rem 0.85rem; border-radius:var(--radius-sm); background:#f8fafc; border:1px solid #cbd5e1; font-size:0.75rem;">
          <strong style="color:#475569;">⚪ Standard Foreign Tariff</strong>
          <p style="margin:0.2rem 0 0 0; color:#64748b; font-size:0.7rem;">
            Maldives uniform resort Green Tax ($6/night) and standard non-regional foreign monument rates.
          </p>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = tableHtml;

  // Bind cell clicks to inspect bilateral dossier
  container.querySelectorAll('.tourism-matrix-cell[data-dest]').forEach(cell => {
    cell.addEventListener('click', () => {
      const dest = cell.getAttribute('data-dest');
      const orig = cell.getAttribute('data-orig');
      container.querySelectorAll('.tourism-matrix-cell').forEach(c => c.style.outline = '');
      cell.style.outline = '2px solid var(--color-black)';
      displayTourismDossier(dest, orig);
    });
  });

  // Auto-inspect the default pair
  const curP = selectedPair?.provider || 'IND';
  const curB = selectedPair?.beneficiary || 'NPL';
  displayTourismDossier(curP, curB);
}

/**
 * Display comprehensive Monument Dossier in the Inspector Panel
 */
function displayMonumentDossier(mon) {
  const container = document.getElementById('provisions-container');
  const placeholder = document.getElementById('placeholder-msg');
  if (placeholder) placeholder.style.display = 'none';
  if (!container || !mon) return;

  if (window.innerWidth <= 960) {
    setTimeout(() => {
      document.getElementById('inspector-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }

  const flag = COUNTRY_FLAGS[mon.country] || '';
  const countryName = COUNTRY_NAMES[mon.country] || mon.country;
  const badgeClass = mon.parity_tier === 'domestic_parity' ? 'parity' : 'concession';

  container.innerHTML = `
    <div class="visa-dossier-wrap">
      <div class="inspector-header" style="margin-bottom:0.25rem;">
        <div class="inspector-top-badge">UNESCO WORLD HERITAGE TARIFF</div>
        <h3 class="inspector-pair-title">
          <span>${flag} ${escapeHtml(mon.name)}</span>
        </h3>
        <p class="inspector-direction-tag">${escapeHtml(mon.state_region)} • ${mon.unesco_year ? `UNESCO Inscribed ${mon.unesco_year}` : 'Protected Heritage Site'}</p>
      </div>

      <div style="display:flex; gap:0.4rem; flex-wrap:wrap; margin-bottom:0.75rem;">
        <span class="monument-tier-badge ${badgeClass}" style="font-size:0.75rem; padding:0.25rem 0.6rem;">
          ${escapeHtml(mon.parity_tier_label)}
        </span>
        <span style="font-size:0.75rem; font-weight:700; background:#f1f5f9; color:#334155; padding:0.25rem 0.6rem; border-radius:var(--radius-pill); border:1px solid #cbd5e1;">
          ${escapeHtml(mon.authority)}
        </span>
      </div>

      <!-- Pricing Comparison Table -->
      <div class="surface-card" style="padding:0.85rem; border:1px solid var(--color-border); border-radius:var(--radius-md); margin-bottom:0.75rem;">
        <div style="font-size:0.75rem; font-weight:800; color:var(--color-black); margin-bottom:0.5rem;">
          Statutory Entry Fee Schedule:
        </div>
        <table style="width:100%; border-collapse:collapse; font-size:0.75rem;">
          <tbody>
            <tr style="border-bottom:1px solid var(--color-border);">
              <td style="padding:0.35rem 0; color:var(--color-gray-600); font-weight:600;">Domestic Resident:</td>
              <td style="padding:0.35rem 0; font-weight:800; text-align:right;">${mon.currency_symbol} ${mon.domestic_fee.toLocaleString()} ($${mon.domestic_usd.toFixed(2)})</td>
            </tr>
            <tr style="border-bottom:1px solid var(--color-border); background:#ecfdf5;">
              <td style="padding:0.35rem 0.4rem; color:#065f46; font-weight:700;">SAARC Citizen:</td>
              <td style="padding:0.35rem 0.4rem; font-weight:900; color:#047857; text-align:right;">${mon.currency_symbol} ${mon.saarc_fee.toLocaleString()} ($${mon.saarc_usd.toFixed(2)})</td>
            </tr>
            <tr style="border-bottom:1px solid var(--color-border);">
              <td style="padding:0.35rem 0; color:var(--color-gray-600); font-weight:600;">General Foreigner:</td>
              <td style="padding:0.35rem 0; font-weight:800; color:#dc2626; text-align:right;">${mon.currency_symbol} ${mon.foreign_fee.toLocaleString()} ($${mon.foreign_usd.toFixed(2)})</td>
            </tr>
            <tr>
              <td style="padding:0.45rem 0; color:#047857; font-weight:800;">Net Regional Savings:</td>
              <td style="padding:0.45rem 0; font-weight:900; color:#047857; text-align:right;">⚡ Save $${mon.savings_usd.toFixed(2)} (${mon.savings_pct}%)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Legal Basis Box -->
      <div class="provision-card" style="margin-bottom:0.75rem;">
        <div class="prov-meta-row">
          <span class="prov-cat-badge cat-tourism_culture">LEGAL FRAMEWORK</span>
        </div>
        <h4 class="prov-title" style="font-size:0.85rem;">Statutory Authority & Regulations</h4>
        <p class="prov-desc" style="font-size:0.75rem;">
          <strong>Legal Basis:</strong> ${escapeHtml(mon.legal_basis)}
        </p>
        <p class="prov-desc" style="font-size:0.75rem; margin-top:0.4rem;">
          ${escapeHtml(mon.notes)}
        </p>
        <div class="prov-source-row" style="margin-top:0.6rem;">
          <a href="${escapeHtml(mon.source_url)}" target="_blank" rel="noopener noreferrer" class="prov-source-link">
            <span>Official Ticketing Authority</span>
            <span class="source-arrow">↗</span>
          </a>
        </div>
      </div>

      <div class="visa-notice-box open">
        <div class="visa-notice-title">
          <span>💡</span>
          <span>Ticketing & Verification Rules</span>
        </div>
        <p style="font-size:0.725rem;">
          SAARC nationals must present an original valid national passport or photo government voter card at entry turns to avail of concessionary or domestic rates.
        </p>
      </div>
    </div>
  `;
}

/**
 * Display Bhutan SDF Dossier in Inspector Panel
 */
function displayBhutanSdfDossier() {
  const container = document.getElementById('provisions-container');
  const placeholder = document.getElementById('placeholder-msg');
  if (placeholder) placeholder.style.display = 'none';
  if (!container) return;

  const sdf = tourismData.bhutan_sdf;
  if (!sdf) return;

  container.innerHTML = `
    <div class="visa-dossier-wrap">
      <div class="inspector-header" style="margin-bottom:0.25rem;">
        <div class="inspector-top-badge">STATUTORY TOURISM LEVY</div>
        <h3 class="inspector-pair-title">
          <span>🇧🇹 Bhutan Sustainable Development Fee (SDF)</span>
        </h3>
        <p class="inspector-direction-tag">Bilateral Treaty Waiver • Tourism Levy Act 2022</p>
      </div>

      <div class="provision-card" style="margin-bottom:0.75rem;">
        <div class="prov-meta-row">
          <span class="prov-cat-badge cat-tourism_culture">STATUTORY REGIME</span>
        </div>
        <h4 class="prov-title" style="font-size:0.85rem;">Bilateral Concession Mechanics</h4>
        <p class="prov-desc" style="font-size:0.75rem;">
          The statutory Sustainable Development Fee (SDF) is levied under Section 7 of the Tourism Levy Act of Bhutan 2022. While third-country international tourists pay <strong>$100 per night</strong>, Indian passport holders pay a concessionary rate of <strong>BTN / INR 1,200 per night (~$14.40)</strong>.
        </p>
        <div style="background:#ecfdf5; border:1px solid #a7f3d0; padding:0.6rem; border-radius:var(--radius-sm); margin:0.6rem 0; font-size:0.725rem; color:#065f46;">
          <strong>Direct Financial Impact:</strong> On a standard 7-night vacation, an individual Indian traveler saves <strong>$599.20</strong>, and a family of four saves <strong>$2,396.80</strong> in statutory tourism taxes alone.
        </div>
        <div class="prov-source-row">
          <a href="${escapeHtml(sdf.official_url)}" target="_blank" rel="noopener noreferrer" class="prov-source-link">
            <span>Department of Tourism Bhutan</span>
            <span class="source-arrow">↗</span>
          </a>
        </div>
      </div>

      <div class="visa-notice-box open">
        <div class="visa-notice-title">
          <span>🇧🇩 🇲🇻</span>
          <span>Bangladesh & Maldives Bilateral Concessions</span>
        </div>
        <p style="font-size:0.725rem;">
          Bhutan has signed bilateral tourism MoUs granting subsidized visitor quotas and concessionary entry terms for visiting citizens of Bangladesh and Maldives.
        </p>
      </div>
    </div>
  `;
}

/**
 * Display Circuit Dossier in Inspector Panel
 */
function displayCircuitDossier(circuit) {
  const container = document.getElementById('provisions-container');
  const placeholder = document.getElementById('placeholder-msg');
  if (placeholder) placeholder.style.display = 'none';
  if (!container || !circuit) return;

  container.innerHTML = `
    <div class="visa-dossier-wrap">
      <div class="inspector-header" style="margin-bottom:0.25rem;">
        <div class="inspector-top-badge">CROSS-BORDER HERITAGE TRAIL</div>
        <h3 class="inspector-pair-title">
          <span>${escapeHtml(circuit.name)}</span>
        </h3>
        <p class="inspector-direction-tag">${circuit.stops.length} Protected Sites • ${circuit.countries_involved.map(c => `${COUNTRY_FLAGS[c] || ''} ${c}`).join(' • ')}</p>
      </div>

      <div class="surface-card" style="padding:0.85rem; border:1px solid var(--color-border); border-radius:var(--radius-md); margin-bottom:0.75rem;">
        <div style="font-size:0.75rem; font-weight:800; color:var(--color-black); margin-bottom:0.4rem;">
          Total Itinerary Ticket Cost Differential:
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:0.3rem;">
          <span style="color:var(--color-gray-600);">Third-Country Foreigner Total:</span>
          <span style="font-weight:800; color:#dc2626;">$${circuit.total_intl_usd.toFixed(2)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.75rem; margin-bottom:0.3rem;">
          <span style="color:var(--color-gray-600);">SAARC Citizen Total:</span>
          <span style="font-weight:900; color:#059669;">$${circuit.total_saarc_usd.toFixed(2)}</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:0.75rem; padding-top:0.3rem; border-top:1px dashed var(--color-border);">
          <span style="font-weight:800; color:#047857;">Total Regional Savings:</span>
          <span style="font-weight:900; color:#047857;">⚡ $${circuit.total_savings_usd.toFixed(2)} (${circuit.savings_pct}%)</span>
        </div>
      </div>

      <div class="provision-card" style="margin-bottom:0.75rem;">
        <h4 class="prov-title" style="font-size:0.85rem;">Regional Integration Impact</h4>
        <p class="prov-desc" style="font-size:0.75rem;">
          ${escapeHtml(circuit.key_benefit)}
        </p>
        <p class="prov-desc" style="font-size:0.75rem; margin-top:0.4rem;">
          <strong>Itinerary Route:</strong> ${escapeHtml(circuit.route_description)}
        </p>
      </div>
    </div>
  `;
}

/**
 * Display Bilateral Tourism Reciprocity Dossier in Inspector Panel
 */
function displayTourismDossier(provider, beneficiary) {
  const container = document.getElementById('provisions-container');
  const placeholder = document.getElementById('placeholder-msg');
  if (placeholder) placeholder.style.display = 'none';
  if (!container) return;

  if (window.innerWidth <= 960) {
    setTimeout(() => {
      document.getElementById('inspector-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }

  const pFlag = COUNTRY_FLAGS[provider] || '';
  const bFlag = COUNTRY_FLAGS[beneficiary] || '';
  const pName = COUNTRY_NAMES[provider] || provider;
  const bName = COUNTRY_NAMES[beneficiary] || beneficiary;

  if (provider === beneficiary) {
    container.innerHTML = `
      <div class="inspector-header">
        <div class="inspector-top-badge">DOMESTIC JURISDICTION</div>
        <h3 class="inspector-pair-title">
          <span>${pFlag} ${pName} (${provider})</span>
        </h3>
        <p class="inspector-direction-tag">Internal Municipal Heritage Code</p>
      </div>
      <div class="domestic-notice">
        <h4 class="domestic-title">Domestic Resident Rates</h4>
        <p class="domestic-desc">
          Domestic residents pay baseline resident ticketing rates across all municipal and national monuments.
        </p>
      </div>
    `;
    return;
  }

  const rec = tourismData?.reciprocity_matrix?.[provider]?.[beneficiary];
  if (!rec) {
    container.innerHTML = `<div style="padding:1rem;color:var(--color-gray-600);">No specific heritage reciprocity data available for ${provider} ➔ ${beneficiary}.</div>`;
    return;
  }

  container.innerHTML = `
    <div class="visa-dossier-wrap">
      <div class="inspector-header" style="margin-bottom:0.25rem;">
        <div class="inspector-top-badge">HERITAGE RECIPROCITY POLICY</div>
        <h3 class="inspector-pair-title">
          <span>${pFlag} ${provider} ➔ ${bFlag} ${beneficiary}</span>
        </h3>
        <p class="inspector-direction-tag">${pName} (Host State) treating visitors from ${bName}</p>
      </div>

      <div style="margin-bottom:0.75rem;">
        <span class="tourism-cell-badge ${rec.tier}" style="font-size:0.75rem; padding:0.25rem 0.6rem;">
          ${escapeHtml(rec.tier_label || 'Heritage Concession')}
        </span>
        <span style="font-size:0.725rem; font-weight:700; color:#047857; margin-left:0.5rem;">
          ⚡ Estimated Discount: ${escapeHtml(rec.discount_est)}
        </span>
      </div>

      <div class="provision-card" style="margin-bottom:0.75rem;">
        <h4 class="prov-title" style="font-size:0.85rem;">Policy Overview</h4>
        <p class="prov-desc" style="font-size:0.75rem;">
          ${escapeHtml(rec.summary)}
        </p>
        <p class="prov-desc" style="font-size:0.75rem; margin-top:0.4rem;">
          <strong>Monument Ticket Examples:</strong> ${escapeHtml(rec.examples)}
        </p>
        <p class="prov-desc" style="font-size:0.75rem; margin-top:0.4rem; color:var(--color-gray-600);">
          <strong>Statutory Instrument:</strong> ${escapeHtml(rec.legal_instrument)}
        </p>
      </div>

      <div class="visa-notice-box open">
        <div class="visa-notice-title">
          <span>🛂</span>
          <span>Eligibility Verification</span>
        </div>
        <p style="font-size:0.725rem;">
          Citizens of ${bName} must produce a valid national passport at official monument ticketing counters to qualify for preferential domestic or concessionary SAARC rates.
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

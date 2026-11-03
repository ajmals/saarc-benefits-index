/**
 * SAARC Bilateral Benefits & Concessions Index
 * Frontend Application Logic with Plotly.js
 * Redesigned in Minimalist Monochrome & Line-Art Aesthetic
 */

(() => {
  'use strict';

  // --- Constants & Config ---
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

  const CATEGORY_LABELS = {
    trade: 'Trade',
    tourism_culture: 'Tourism & Culture',
    education: 'Education',
    mobility_visa: 'Mobility & Visa',
    finance_bilateral: 'Finance & Bilateral'
  };

  const CATEGORY_COLORS = {
    trade: '#2563eb',             // Royal Blue
    tourism_culture: '#f59e0b',   // Amber Orange
    education: '#8b5cf6',         // Violet
    mobility_visa: '#10b981',     // Emerald
    finance_bilateral: '#d97706'  // Deep Ochre
  };

  const LEVEL_DESCRIPTIONS = {
    1: 'Level 1: Multilateral Baseline',
    2: 'Level 2: Substantial Concession',
    3: 'Level 3: Deep Bilateral Treaty'
  };

  // State
  let matrixData = null;
  let activeCategory = 'all';
  let selectedPair = null;

  // DOM Elements
  const heatmapContainer = document.getElementById('heatmap-container');
  const currentViewBadge = document.getElementById('current-view-badge');
  const filterButtons = document.querySelectorAll('.filter-btn');
  const inspectorEmpty = document.getElementById('inspector-empty');
  const inspectorContent = document.getElementById('inspector-content');
  const aboutModal = document.getElementById('about-modal');

  /**
   * Fetch matrix data with resilient fallback URLs
   */
  async function loadData() {
    const candidateUrls = [
      './data/bilateral_matrix.json',
      '../data/bilateral_matrix.json',
      '/data/bilateral_matrix.json',
      'data/bilateral_matrix.json'
    ];

    for (const url of candidateUrls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          matrixData = await response.json();
          console.log(`Successfully loaded dataset from: ${url}`);
          return matrixData;
        }
      } catch (e) {
        // Continue to next candidate
      }
    }
    throw new Error('Failed to load bilateral_matrix.json from any known path.');
  }

  /**
   * Build 2D z-values and hover text based on the selected category filter
   */
  function computeHeatmapArrays(category) {
    const countries = matrixData.metadata.countries;
    const z = [];
    const text = [];

    for (let i = 0; i < countries.length; i++) {
      const p = countries[i];
      const rowScores = [];
      const rowText = [];

      for (let j = 0; j < countries.length; j++) {
        const b = countries[j];
        const cell = matrixData.matrix[p][b];

        let score = 0;
        if (p !== b) {
          if (category === 'all') {
            score = cell.intensity_score;
          } else {
            score = cell.category_scores[category] || 0;
          }
        }
        rowScores.push(score);

        const pName = matrixData.metadata.country_names[p];
        const bName = matrixData.metadata.country_names[b];
        const pFlag = COUNTRY_FLAGS[p] || '';
        const bFlag = COUNTRY_FLAGS[b] || '';

        if (p === b) {
          rowText.push(`<b>${pFlag} ${p} (${pName})</b><br>Domestic Jurisdiction (N/A)`);
        } else {
          const filterName = category === 'all' ? 'Total Intensity' : CATEGORY_LABELS[category];
          rowText.push(
            `<b>${pFlag} ${p} → ${bFlag} ${b}</b><br>` +
            `Provider: ${pName}<br>` +
            `Beneficiary: ${bName}<br>` +
            `${filterName} Score: <b>${score}</b><br>` +
            `Provisions: ${cell.provision_count}<br>` +
            `<i>Click to inspect details</i>`
          );
        }
      }
      z.push(rowScores);
      text.push(rowText);
    }

    return { z, text, countries };
  }

  /**
   * Render or update Plotly Heatmap
   * High-contrast vibrant colorscale for readability on white card surface
   */
  function renderHeatmap() {
    const { z, text, countries } = computeHeatmapArrays(activeCategory);

    // Heatmap Colorscale: High-readability emerald-to-teal gradient on clean white
    // 0 / domestic is light neutral (#f8fafc), scaling up to deep saturated teal (#064e3b)
    const vibrantColorscale = [
      [0.0, '#f8fafc'],       // 0 / Neutral
      [0.05, '#f1f5f9'],      // Baseline empty cell
      [0.15, '#bbf7d0'],      // Low intensity (1) - Mint
      [0.35, '#34d399'],      // Medium-low (2) - Emerald 400
      [0.60, '#0d9488'],      // Medium-high (3-4) - Teal 600
      [0.85, '#0f766e'],      // High (5-7) - Deep Teal
      [1.0, '#064e3b']        // Maximum intensity peak (8+)
    ];

    const plotData = [{
      type: 'heatmap',
      x: countries,
      y: countries,
      z: z,
      text: text,
      hoverinfo: 'text',
      colorscale: vibrantColorscale,
      showscale: true,
      colorbar: {
        title: {
          text: activeCategory === 'all' ? 'Intensity' : 'Points',
          font: { color: '#111827', size: 11, family: '-apple-system, BlinkMacSystemFont, sans-serif' }
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

    const plotLayout = {
      paper_bgcolor: '#ffffff',
      plot_bgcolor: '#ffffff',
      margin: { t: 40, b: 60, l: 80, r: 25 },
      xaxis: {
        title: {
          text: 'Beneficiary State (Recipient)',
          font: { color: '#111827', size: 12, family: '-apple-system, BlinkMacSystemFont, sans-serif' },
          standoff: 15
        },
        tickmode: 'array',
        tickvals: countries,
        ticktext: countries.map(c => `${COUNTRY_FLAGS[c]} ${c}`),
        tickfont: { color: '#111827', size: 11, family: 'monospace', weight: '600' },
        side: 'bottom',
        gridcolor: '#f3f4f6',
        zeroline: false,
        linecolor: '#111111',
        linewidth: 1.5
      },
      yaxis: {
        title: {
          text: 'Granting State (Provider)',
          font: { color: '#111827', size: 12, family: '-apple-system, BlinkMacSystemFont, sans-serif' },
          standoff: 15
        },
        autorange: 'reversed', // Top-to-bottom reading
        tickmode: 'array',
        tickvals: countries,
        ticktext: countries.map(c => `${COUNTRY_FLAGS[c]} ${c}`),
        tickfont: { color: '#111827', size: 11, family: 'monospace', weight: '600' },
        gridcolor: '#f3f4f6',
        zeroline: false,
        linecolor: '#111111',
        linewidth: 1.5
      },
      hoverlabel: {
        bgcolor: '#111111',
        bordercolor: '#111111',
        font: { family: '-apple-system, BlinkMacSystemFont, sans-serif', color: '#ffffff', size: 12 }
      }
    };

    const plotConfig = {
      responsive: true,
      displayModeBar: false
    };

    Plotly.react(heatmapContainer, plotData, plotLayout, plotConfig);

    // Attach click event handler (idempotent with Plotly.react)
    heatmapContainer.removeAllListeners?.('plotly_click');
    heatmapContainer.on('plotly_click', (eventData) => {
      if (eventData.points && eventData.points.length > 0) {
        const pt = eventData.points[0];
        const provider = pt.y;
        const beneficiary = pt.x;
        selectPair(provider, beneficiary);
      }
    });
  }

  /**
   * Helper to build segmented meter HTML (5 discrete block segments)
   * Matching "This week" segmented progress bars from the mockup!
   */
  function buildSegmentedMeter(score, maxScore = 5, color = '#111111') {
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
   * Handle user selecting a country pair
   */
  function selectPair(provider, beneficiary) {
    if (!matrixData || !matrixData.matrix[provider] || !matrixData.matrix[provider][beneficiary]) {
      return;
    }

    selectedPair = { provider, beneficiary };
    const cell = matrixData.matrix[provider][beneficiary];
    const pName = matrixData.metadata.country_names[provider];
    const bName = matrixData.metadata.country_names[beneficiary];
    const pFlag = COUNTRY_FLAGS[provider] || '';
    const bFlag = COUNTRY_FLAGS[beneficiary] || '';

    inspectorEmpty.style.display = 'none';
    inspectorContent.style.display = 'block';

    if (provider === beneficiary) {
      renderDomesticNotice(provider, pName, pFlag);
      return;
    }

    // Filter provisions if category filter is active
    let displayProvisions = cell.provisions;
    if (activeCategory !== 'all') {
      displayProvisions = cell.provisions.filter(p => p.category === activeCategory);
    }

    // Segmented sector breakdown rows matching "This week" in the mockup
    const sectorBreakdownRowsHtml = Object.entries(cell.category_scores)
      .map(([cat, score]) => {
        const catColor = CATEGORY_COLORS[cat] || '#111111';
        const segmentedMeter = buildSegmentedMeter(score, 4, catColor);
        return `
          <div class="sector-progress-row">
            <span class="sector-progress-label">${CATEGORY_LABELS[cat] || cat}</span>
            <div class="sector-progress-meter-wrap">
              ${segmentedMeter}
              <span class="sector-progress-val">${score}</span>
            </div>
          </div>
        `;
      }).join('');

    // Provisions cards styled like habit items / calendar items in the mockup
    const provisionsHtml = displayProvisions.length === 0
      ? `<div class="empty-description" style="margin-top: 1rem;">No specific provisions found under the <strong>${CATEGORY_LABELS[activeCategory]}</strong> sector for this pair.</div>`
      : displayProvisions.map(p => {
          const catColor = CATEGORY_COLORS[p.category] || '#111111';
          return `
            <article class="provision-card" data-benefit-id="${p.benefit_id}">
              <div class="provision-meta">
                <span class="category-tag" style="border-left: 3px solid ${catColor}; color: ${catColor};">
                  ${CATEGORY_LABELS[p.category] || p.category}
                </span>
                <span class="level-tag">
                  <span class="check-icon">✓</span>
                  ${LEVEL_DESCRIPTIONS[p.benefit_level] || `Level ${p.benefit_level}`}
                </span>
              </div>
              <h4 class="provision-title">${escapeHtml(p.title)}</h4>
              <p class="provision-desc">${escapeHtml(p.description)}</p>
              <div class="provision-legal">
                <span class="legal-label">Statutory Instrument:</span>
                <span>${escapeHtml(p.legal_framework)}</span>
              </div>
              <div class="provision-source">
                <span class="source-label">Source: ${escapeHtml(p.source_name)}</span>
                <a href="${escapeHtml(p.source_url)}" class="source-link" target="_blank" rel="noopener noreferrer" title="Open verified treaty reference">
                  Official Document <span class="source-arrow">↗</span>
                </a>
              </div>
            </article>
          `;
        }).join('');

    inspectorContent.innerHTML = `
      <div class="inspector-header">
        <div class="inspector-top-badge">CHANNEL DOSSIER</div>
        <h3 class="inspector-pair-title">
          <span>${pFlag} ${pName}</span>
          <span class="inspector-arrow">→</span>
          <span>${bFlag} ${bName}</span>
        </h3>
        <p class="inspector-direction-tag">
          Grantor / Provider: <strong>${provider}</strong> &nbsp;•&nbsp; Recipient / Beneficiary: <strong>${beneficiary}</strong>
        </p>

        <!-- Circular & Dashed Stat Rings for Intensity & Provisions -->
        <div class="inspector-metrics">
          <div class="inspector-ring-card">
            <div class="inspector-ring">
              <span class="inspector-ring-val">${cell.intensity_score}</span>
              <span class="inspector-ring-sub">pts</span>
            </div>
            <div class="inspector-ring-lbl">Total Intensity</div>
          </div>

          <div class="inspector-ring-card">
            <div class="inspector-ring">
              <span class="inspector-ring-val">${cell.provision_count}</span>
              <span class="inspector-ring-sub">acts</span>
            </div>
            <div class="inspector-ring-lbl">Provisions</div>
          </div>
        </div>

        <!-- Segmented Sector Progress Bars (Direct Mockup Style) -->
        <div class="category-breakdown">
          <div class="breakdown-title">Sector Contribution</div>
          <div class="sector-meters-container">
            ${sectorBreakdownRowsHtml}
          </div>
        </div>
      </div>

      <!-- Bilateral Provisions List -->
      <div class="provisions-container">
        <div class="provisions-heading">
          <span>Bilateral Provisions & Accords</span>
          <span class="provision-count-pill">${displayProvisions.length} of ${cell.provision_count}</span>
        </div>
        ${provisionsHtml}
      </div>
    `;

    // Smooth scroll inspector to top when pair changes
    const card = document.getElementById('inspector-card');
    if (card) {
      card.scrollTop = 0;
    }
  }

  /**
   * Render domestic pair info
   */
  function renderDomesticNotice(iso, name, flag) {
    inspectorContent.innerHTML = `
      <div class="inspector-header">
        <div class="inspector-top-badge">DOMESTIC POLICY</div>
        <h3 class="inspector-pair-title">
          <span>${flag} ${name} (${iso})</span>
        </h3>
        <p class="inspector-direction-tag">National Boundary</p>
      </div>
      <div class="domestic-notice">
        <div class="domestic-symbol">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="1.5">
            <path d="M3 21h18M3 10h18M5 10v11M19 10v11M9 10v11M15 10v11M12 2L2 7h20L12 2z"></path>
          </svg>
        </div>
        <h4 class="domestic-title">Domestic Jurisdiction</h4>
        <p class="domestic-desc">
          Self-pairs (${iso} → ${iso}) denote internal municipal statutes rather than bilateral concessions exchanged between sovereign states. 
          Regional intensity measures cross-border reciprocity exclusively across South Asian partners.
        </p>
      </div>
    `;
  }

  /**
   * Safe HTML escaping helper
   */
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Setup UI Event Listeners
   */
  function setupEventListeners() {
    // Category Filter Buttons
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.dataset.category;

        const categoryTitle = activeCategory === 'all' 
          ? 'Overall Intensity' 
          : `${CATEGORY_LABELS[activeCategory]} Sector`;
        currentViewBadge.textContent = categoryTitle;

        renderHeatmap();

        // Refresh inspector if a pair is currently selected
        if (selectedPair) {
          selectPair(selectedPair.provider, selectedPair.beneficiary);
        }
      });
    });

    // Quick Inspect Buttons and Demo Cards
    document.querySelectorAll('[data-pair]').forEach(el => {
      el.addEventListener('click', () => {
        const pairKey = el.dataset.pair; // e.g. "IND-NPL"
        const [p, b] = pairKey.split('-');
        if (p && b) {
          selectPair(p, b);
        }
      });
    });

    // Cycle pair button (+)
    const cyclePairs = [
      ['IND', 'NPL'],
      ['BTN', 'IND'],
      ['IND', 'BTN'],
      ['BGD', 'NPL'],
      ['IND', 'MDV'],
      ['PAK', 'LKA'],
      ['IND', 'LKA'],
      ['BGD', 'BTN']
    ];
    let cycleIndex = 0;
    const btnCycle = document.getElementById('btn-cycle-pair');
    if (btnCycle) {
      btnCycle.addEventListener('click', () => {
        cycleIndex = (cycleIndex + 1) % cyclePairs.length;
        const [p, b] = cyclePairs[cycleIndex];
        selectPair(p, b);
      });
    }

    // Modal triggers (Info button, Menu button, Dock About button)
    const btnInfo = document.getElementById('btn-info');
    const btnMenu = document.getElementById('btn-menu');
    const modalClose = document.getElementById('modal-close');
    const dockAbout = document.getElementById('dock-btn-about');

    const openModal = () => {
      if (aboutModal) aboutModal.style.display = 'flex';
    };
    const closeModal = () => {
      if (aboutModal) aboutModal.style.display = 'none';
    };

    if (btnInfo) btnInfo.addEventListener('click', openModal);
    if (btnMenu) btnMenu.addEventListener('click', openModal);
    if (dockAbout) dockAbout.addEventListener('click', openModal);
    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (aboutModal) {
      aboutModal.addEventListener('click', (e) => {
        if (e.target === aboutModal) closeModal();
      });
    }

    // Bottom Navigation Dock Smooth Scrolling / Focus
    const dockMatrix = document.getElementById('dock-btn-matrix');
    const dockSectors = document.getElementById('dock-btn-sectors');
    const dockInspector = document.getElementById('dock-btn-inspector');

    if (dockMatrix) {
      dockMatrix.addEventListener('click', () => {
        document.querySelectorAll('.nav-dock-item').forEach(i => i.classList.remove('active'));
        dockMatrix.classList.add('active');
        document.getElementById('matrix-section')?.scrollIntoView({ behavior: 'smooth' });
      });
    }
    if (dockSectors) {
      dockSectors.addEventListener('click', () => {
        document.querySelectorAll('.nav-dock-item').forEach(i => i.classList.remove('active'));
        dockSectors.classList.add('active');
        document.getElementById('filter-buttons')?.scrollIntoView({ behavior: 'smooth' });
      });
    }
    if (dockInspector) {
      dockInspector.addEventListener('click', () => {
        document.querySelectorAll('.nav-dock-item').forEach(i => i.classList.remove('active'));
        dockInspector.classList.add('active');
        document.getElementById('inspector-section')?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  }

  /**
   * Initialization
   */
  async function init() {
    try {
      await loadData();
      setupEventListeners();
      renderHeatmap();

      // Default initial pair selection to showcase the inspector
      selectPair('IND', 'NPL');
    } catch (err) {
      console.error('Initialization error:', err);
      heatmapContainer.innerHTML = `
        <div style="padding: 2rem; color: #111111; text-align: center;">
          <h3>Failed to Load Data</h3>
          <p>${err.message}</p>
        </div>
      `;
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

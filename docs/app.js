/**
 * SAARC Bilateral Benefits & Concessions Index
 * Frontend Application Logic with Plotly.js
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

  const LEVEL_DESCRIPTIONS = {
    1: 'Level 1: Multilateral Resolution / Baseline Exemption',
    2: 'Level 2: Substantial Preference / Subsidized Quota',
    3: 'Level 3: Deep Bilateral Treaty / Unrestricted National Treatment'
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
        rowScores.append ? rowScores.append(score) : rowScores.push(score);

        const pName = matrixData.metadata.country_names[p];
        const bName = matrixData.metadata.country_names[b];
        const pFlag = COUNTRY_FLAGS[p] || '';
        const bFlag = COUNTRY_FLAGS[b] || '';

        if (p === b) {
          rowText.push(`${pFlag} ${p} (${pName})<br>Domestic Jurisdiction (N/A)`);
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
   */
  function renderHeatmap() {
    const { z, text, countries } = computeHeatmapArrays(activeCategory);

    // Heatmap Colorscale: Teal scale per SKILLS.md (#ccfbf1 -> #0f766e -> #042f2e)
    // On dark slate surface (#1e293b for 0, deep teal for low, bright teal for high)
    const tealColorscale = [
      [0.0, '#1e293b'],       // 0 / Domestic
      [0.08, '#042f2e'],      // Low intensity (1)
      [0.35, '#0f766e'],      // Medium intensity
      [0.70, '#14b8a6'],      // High intensity
      [1.0, '#ccfbf1']        // Maximum intensity peak
    ];

    const plotData = [{
      type: 'heatmap',
      x: countries,
      y: countries,
      z: z,
      text: text,
      hoverinfo: 'text',
      colorscale: tealColorscale,
      showscale: true,
      colorbar: {
        title: {
          text: activeCategory === 'all' ? 'Score' : 'Points',
          font: { color: '#94a3b8', size: 12 }
        },
        tickfont: { color: '#94a3b8', size: 11 },
        thickness: 14,
        len: 0.9,
        outlinecolor: '#334155',
        bordercolor: '#334155'
      },
      xgap: 3,
      ygap: 3
    }];

    const plotLayout = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      margin: { t: 40, b: 60, l: 75, r: 25 },
      xaxis: {
        title: {
          text: 'Beneficiary State (Recipient)',
          font: { color: '#94a3b8', size: 12 },
          standoff: 15
        },
        tickmode: 'array',
        tickvals: countries,
        ticktext: countries.map(c => `${COUNTRY_FLAGS[c]} ${c}`),
        tickfont: { color: '#f8fafc', size: 12, family: 'monospace' },
        side: 'bottom',
        gridcolor: '#334155',
        zeroline: false
      },
      yaxis: {
        title: {
          text: 'Granting State (Provider)',
          font: { color: '#94a3b8', size: 12 },
          standoff: 15
        },
        autorange: 'reversed', // Top-to-bottom reading
        tickmode: 'array',
        tickvals: countries,
        ticktext: countries.map(c => `${COUNTRY_FLAGS[c]} ${c}`),
        tickfont: { color: '#f8fafc', size: 12, family: 'monospace' },
        gridcolor: '#334155',
        zeroline: false
      },
      hoverlabel: {
        bgcolor: '#0f172a',
        bordercolor: '#14b8a6',
        font: { family: '-apple-system, BlinkMacSystemFont, sans-serif', color: '#f8fafc', size: 12 }
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

    const categoryChipsHtml = Object.entries(cell.category_scores)
      .map(([cat, score]) => {
        const hasPoints = score > 0;
        return `
          <div class="category-chip ${hasPoints ? 'has-points' : ''}">
            <span>${CATEGORY_LABELS[cat] || cat}</span>
            <span class="category-chip-score">${score}</span>
          </div>
        `;
      }).join('');

    const provisionsHtml = displayProvisions.length === 0
      ? `<div class="empty-description" style="margin-top: 1rem;">No specific provisions found under the <strong>${CATEGORY_LABELS[activeCategory]}</strong> sector for this pair.</div>`
      : displayProvisions.map(p => `
          <article class="provision-card" data-benefit-id="${p.benefit_id}">
            <div class="provision-meta">
              <span class="category-tag cat-${p.category}">${CATEGORY_LABELS[p.category] || p.category}</span>
              <span class="level-tag level-${p.benefit_level}">${LEVEL_DESCRIPTIONS[p.benefit_level] || `Level ${p.benefit_level}`}</span>
            </div>
            <h4 class="provision-title">${escapeHtml(p.title)}</h4>
            <p class="provision-desc">${escapeHtml(p.description)}</p>
            <div class="provision-legal">
              <span class="legal-label">Legal Instrument:</span>
              <span>${escapeHtml(p.legal_framework)}</span>
            </div>
            <div class="provision-source">
              <span class="source-label" style="font-size: 0.75rem; color: var(--color-text-muted);">Source: ${escapeHtml(p.source_name)}</span>
              <a href="${escapeHtml(p.source_url)}" class="source-link" target="_blank" rel="noopener noreferrer" title="Open official reference">
                Official Document <span class="source-icon">↗</span>
              </a>
            </div>
          </article>
        `).join('');

    inspectorContent.innerHTML = `
      <div class="inspector-header">
        <h3 class="inspector-pair-title">
          <span>${pFlag} ${pName}</span>
          <span style="color: var(--color-teal-500); font-weight: 300;">→</span>
          <span>${bFlag} ${bName}</span>
        </h3>
        <p class="inspector-direction-tag">
          Grantor / Provider: <strong>${provider}</strong> &nbsp;•&nbsp; Recipient: <strong>${beneficiary}</strong>
        </p>

        <div class="inspector-metrics">
          <div class="inspector-metric-box">
            <div class="inspector-metric-val">${cell.intensity_score}</div>
            <div class="inspector-metric-lbl">Total Intensity</div>
          </div>
          <div class="inspector-metric-box">
            <div class="inspector-metric-val">${cell.provision_count}</div>
            <div class="inspector-metric-lbl">Provisions</div>
          </div>
        </div>

        <div class="category-breakdown">
          <div class="breakdown-title">Sector Contribution</div>
          <div class="breakdown-chips">
            ${categoryChipsHtml}
          </div>
        </div>
      </div>

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
        <h3 class="inspector-pair-title">
          <span>${flag} ${name} (${iso})</span>
        </h3>
        <p class="inspector-direction-tag">Domestic Jurisdiction</p>
      </div>
      <div class="domestic-notice">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🏛️</div>
        <h4 class="domestic-title">Domestic Policy Excluded</h4>
        <p class="domestic-desc">
          Self-pairs (${iso} → ${iso}) represent domestic statutory frameworks rather than bilateral concessions between sovereign states. 
          Bilateral intensity is defined exclusively across distinct South Asian member states.
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
        <div style="padding: 2rem; color: #f87171; text-align: center;">
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


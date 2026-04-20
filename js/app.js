/* DPP Construccion — Motor de renderizado v1.0
   Code Contract S.L. — 2026
   Compatible con JSON Trackline + metadatos de presentacion */

const DPP = (() => {
  // ── Status ──
  const STATUS = {
    verified:   { label: 'Verificado',   cls: 'st-verified',   icon: '\u2705' },
    partial:    { label: 'Parcial',      cls: 'st-partial',    icon: '\u26A0\uFE0F' },
    pending:    { label: 'Pendiente',    cls: 'st-pending',    icon: '\u274C' },
    pending_ad: { label: 'Pendiente AD', cls: 'st-pending-ad', icon: '\uD83D\uDFE3' }
  };

  const LEGAL_CLS = {
    'LEY':          'legal-ley',
    'PROYECCION':   'legal-proyeccion',
    'PENDIENTE AD': 'legal-pendiente'
  };

  // ── Helpers ──
  function statusBadge(s) {
    var m = STATUS[s] || STATUS.pending;
    return '<span class="status-badge ' + m.cls + '">' + m.icon + ' ' + m.label + '</span>';
  }
  function legalPill(basis) {
    if (!basis) return '';
    for (var k in LEGAL_CLS) {
      if (basis.indexOf(k) >= 0) return '<span class="legal-pill ' + LEGAL_CLS[k] + '">' + basis + '</span>';
    }
    return '<span class="legal-pill">' + basis + '</span>';
  }
  function fmt(val) {
    if (val === null || val === undefined || val === '') return '<span class="no-data">\u2014 sin datos \u2014</span>';
    if (Array.isArray(val)) return val.length ? val.join(', ') : '<span class="no-data">\u2014 vac\u00edo \u2014</span>';
    if (typeof val === 'boolean') return val ? 'S\u00ed' : 'No';
    return String(val);
  }
  function hasValue(v) {
    if (v === null || v === undefined || v === '') return false;
    if (Array.isArray(v) && v.length === 0) return false;
    return true;
  }
  function sourceDocHTML(doc) {
    if (!doc) return '';
    return '<div class="source-doc"><span class="doc-icon">\uD83D\uDCC4</span><div class="doc-info">' +
      '<strong>' + (doc.name || '--') + '</strong>' +
      '<span class="doc-type">' + (doc.type || '') + '</span>' +
      '<span class="doc-gen">Genera: ' + (doc.generatedBy || '--') + '</span>' +
      '<span class="doc-deadline">Plazo: ' + (doc.deadline || '--') + '</span>' +
      '</div></div>';
  }

  // ── Section definitions ──
  function getSections(data) {
    var p  = data.product || {};
    var perf = data.performance_cpr || {};
    var epd = data.epd || {};
    var reach = data.reach || {};
    var eol = data.end_of_life || {};
    var traz = data.traceability || {};
    var act = data.actors || {};
    var reg = data.registry_art13 || {};
    var comps = data.components || [];
    var bs = data.block_status || {};

    return [
      {
        id: 'identification', icon: '\uD83D\uDCCB', title: 'Identificaci\u00f3n del producto',
        status: bs.A_identification || 'pending',
        legal: 'LEY \u2014 CPR (UE) 2024/3110 Art. 7-11',
        doc: { name: 'Declaraci\u00f3n de Prestaciones (DoP)', type: 'Obligatorio CPR', generatedBy: 'Fabricante', deadline: 'Antes de comercializaci\u00f3n' },
        attrs: [
          { label: 'Nombre comercial', value: p.commercial_name },
          { label: 'Tipo de producto', value: p.product_type },
          { label: 'Marca', value: p.brand },
          { label: 'Modelo / C\u00f3digo', value: p.model_code },
          { label: 'Fabricante', value: p.manufacturer },
          { label: 'Direcci\u00f3n', value: p.manufacturer_address },
          { label: 'Pa\u00eds', value: p.manufacturer_country },
          { label: 'GTIN', value: p.gtin },
          { label: 'Lote', value: p.batch },
          p.serial_number ? { label: 'N\u00ba serie', value: p.serial_number } : null,
          { label: 'Fecha fabricaci\u00f3n', value: p.manufacture_date },
          p.dimensions ? { label: 'Dimensiones', value: (p.dimensions.width_mm && p.dimensions.height_mm) ? p.dimensions.width_mm + ' \u00d7 ' + p.dimensions.height_mm + (p.dimensions.depth_mm ? ' \u00d7 ' + p.dimensions.depth_mm : '') + ' mm' : null } : null,
          p.weight_kg ? { label: 'Peso', value: p.weight_kg + ' kg' } : null,
          { label: 'Unidad funcional', value: p.functional_unit },
          { label: 'C\u00f3digo CPV', value: p.cpv_code }
        ].filter(Boolean)
      },
      {
        id: 'materials', icon: '\uD83D\uDD29', title: 'Materiales y componentes',
        status: bs.B_materials || 'pending',
        legal: 'LEY \u2014 ESPR 2024/1781 Art. 9(d) + REACH Art. 33',
        doc: { name: 'Bill of Materials (BoM)', type: 'Requerido ESPR', generatedBy: 'Fabricante + proveedores', deadline: 'Continuo' },
        components: comps
      },
      {
        id: 'performance', icon: '\uD83C\uDFD7\uFE0F', title: 'Prestaciones t\u00e9cnicas (CPR)',
        status: bs.D_technical_performance || 'pending',
        legal: 'LEY \u2014 CPR (UE) 2024/3110 Anexo I',
        doc: { name: 'Declaraci\u00f3n de Prestaciones (DoP)', type: 'Obligatorio CPR', generatedBy: 'Fabricante + Organismo Notificado', deadline: 'Antes de marcado CE' },
        attrs: [
          { label: 'N\u00ba DoP', value: perf.dop_number },
          { label: 'Marcado CE', value: perf.ce_marking != null ? (perf.ce_marking ? 'S\u00ed' : 'No') : null },
          { label: 'Norma armonizada', value: Array.isArray(perf.harmonised_standards) ? perf.harmonised_standards.join(', ') : perf.harmonised_standard },
          perf.notified_body ? { label: 'Organismo Notificado', value: perf.notified_body } : null,
          perf.aenor_certifications_count ? { label: 'Certificaciones AENOR', value: perf.aenor_certifications_count } : null
        ].filter(Boolean).concat(
          Object.values(perf.declared_performances || {}).map(function(dp) {
            return { label: dp.label, value: dp.value, status: dp.status };
          })
        ).concat(
          perf.service_life_years ? [{ label: 'Vida \u00fatil', value: perf.service_life_years + ' a\u00f1os' }] : []
        )
      },
      {
        id: 'environmental', icon: '\uD83C\uDF3F', title: 'Declaraci\u00f3n ambiental (EPD)',
        status: bs.C_environmental || 'pending',
        legal: 'PROYECCION \u2014 ESPR 2024/1781 Art. 9(b)',
        doc: { name: 'EPD (EN 15804+A2)', type: 'Requerido ESPR / Voluntario CPR', generatedBy: 'Consultor LCA + verificador tercero', deadline: 'Acto delegado pendiente' },
        attrs: [
          { label: 'Registro EPD', value: epd.registration },
          { label: 'Programa', value: epd.programme },
          { label: 'PCR', value: epd.pcr },
          { label: 'Fecha emisi\u00f3n', value: epd.issue_date },
          { label: 'Validez', value: epd.validity },
          { label: 'Verificador', value: epd.verifier },
          { label: '\u00c1mbito geogr\u00e1fico', value: epd.geographical_scope },
          { label: 'Practicante LCA', value: epd.lca_practitioner },
          epd.gwp_total ? { label: 'GWP total (' + (epd.gwp_total.scope || '') + ')', value: epd.gwp_total.value != null ? epd.gwp_total.value + ' ' + epd.gwp_total.unit + ' / ' + epd.gwp_total.per_unit : null } : null,
          { label: 'M\u00f3dulos declarados', value: epd.modules_declared }
        ].filter(Boolean).concat(
          (function() {
            var ei = epd.environmental_indicators || {};
            var labels = {
              gwp_a1_a3: 'GWP A1-A3', gwp_a4: 'GWP A4', gwp_a5: 'GWP A5',
              gwp_b1_b7: 'GWP B1-B7', gwp_c1_c4: 'GWP C1-C4',
              gwp_d: 'GWP D (beneficios)', penrt: 'PENRT (energ\u00eda no renovable)',
              pert: 'PERT (energ\u00eda renovable)', adpe: 'ADPE (agotamiento abi\u00f3tico)',
              ap: 'AP (acidificaci\u00f3n)', ep: 'EP (eutrofizaci\u00f3n)',
              odp: 'ODP (destrucci\u00f3n ozono)'
            };
            var out = [];
            Object.keys(ei).forEach(function(k) {
              if (ei[k] && ei[k].value != null) {
                out.push({ label: labels[k] || k, value: ei[k].value + ' ' + ei[k].unit });
              }
            });
            return out;
          })()
        )
      },
      {
        id: 'reach', icon: '\u2697\uFE0F', title: 'Sustancias qu\u00edmicas (REACH / SCIP)',
        status: reach.status || 'pending',
        legal: 'LEY \u2014 REACH 1907/2006 Art. 33 + SCIP',
        doc: { name: 'Declaraci\u00f3n REACH Art.33 + SCIP', type: 'Obligatorio REACH', generatedBy: 'Fabricante', deadline: 'Continuo (cada actualizaci\u00f3n lista candidata)' },
        attrs: [
          { label: 'SVHC presentes', value: reach.svhc_present != null ? (reach.svhc_present ? 'S\u00ed' : 'No') : null },
          { label: 'Concentraci\u00f3n > 0,1%', value: reach.svhc_concentration_above_01 != null ? (reach.svhc_concentration_above_01 ? 'S\u00ed' : 'No') : null },
          { label: 'Versi\u00f3n lista SVHC', value: reach.svhc_list_version },
          { label: 'Sustancias verificadas', value: reach.substances_checked },
          { label: 'Notificaci\u00f3n SCIP', value: reach.scip_notification },
          { label: '\u00daltima comprobaci\u00f3n', value: reach.last_check }
        ]
      },
      {
        id: 'end_of_life', icon: '\u267B\uFE0F', title: 'Fin de vida y circularidad',
        status: bs.E_end_of_life || 'pending',
        legal: 'PROYECCION \u2014 ESPR 2024/1781 Art. 9(f-g)',
        doc: { name: 'Ficha desmontaje + an\u00e1lisis circularidad', type: 'Requerido ESPR', generatedBy: 'Fabricante + gestor RCD', deadline: 'Acto delegado pendiente' },
        attrs: [
          { label: 'Instrucciones desmontaje', value: eol.disassembly_instructions },
          { label: 'Reciclabilidad total', value: eol.recyclability_total_percent != null ? eol.recyclability_total_percent + '%' : null },
          (function() {
            var rpc = eol.recyclability_percent_by_component || {};
            var keys = Object.keys(rpc);
            if (!keys.length) return null;
            return { label: 'Reciclabilidad por componente', value: keys.map(function(k){ return k + ': ' + rpc[k] + '%'; }).join(', ') };
          })(),
          { label: 'C\u00f3digos LER', value: eol.ler_codes },
          { label: 'Esquema de recogida', value: eol.collection_scheme }
        ].filter(Boolean)
      },
      {
        id: 'traceability', icon: '\uD83D\uDD17', title: 'Trazabilidad',
        status: bs.F_traceability || 'pending',
        legal: 'LEY \u2014 ESPR 2024/1781 Art. 9(a) + eIDAS',
        attrs: [
          { label: 'Hash Trackline', value: traz.trackline_hash, isTrackline: true },
          { label: 'Timestamp', value: traz.timestamp_iso8601 },
          { label: 'Token eIDAS TSA', value: traz.eidas_tsa_token },
          { label: 'URL QR', value: traz.qr_payload_url },
          { label: 'Soporte datos', value: traz.data_carrier },
          { label: 'Ubicaci\u00f3n soporte', value: traz.data_carrier_location },
          { label: 'GS1 Digital Link', value: traz.gs1_digital_link }
        ]
      },
      {
        id: 'actors', icon: '\uD83D\uDC65', title: 'Actores de la cadena',
        status: bs.G_actors || 'pending',
        legal: 'LEY \u2014 CPR 2024/3110 Cap. III-IV + ESPR Art. 22',
        attrs: [
          { label: 'Operador responsable', value: act.operator_responsible },
          { label: 'Distribuidor', value: act.distributor },
          { label: 'Instalador', value: act.installer },
          { label: 'Propietario final', value: act.final_owner },
          { label: 'Autoridad de mercado (ES)', value: act.market_authority_es }
        ]
      }
    ];
  }

  function getRegistry(data) {
    var reg = data.registry_art13 || {};
    var bs = data.block_status || {};
    return {
      id: 'registry', icon: '\uD83C\uDFDB\uFE0F', title: 'Registro Central Art. 13 (ESPR)',
      status: bs.H_registry_art13 || 'pending_ad',
      legal: 'PENDIENTE AD \u2014 ESPR 2024/1781 Art. 13',
      attrs: [
        { label: 'Estado', value: reg.label || reg.status },
        { label: 'Campos precargados', value: reg.fields_preloaded },
        { label: 'Nota', value: reg.note }
      ]
    };
  }

  // ── Render: Meta ──
  function renderMeta(data) {
    var p = data.product || {};
    var fw = data.regulation_framework || [];
    return '<div class="dpp-meta">' +
      '<div class="meta-row"><strong>\uD83D\uDCCB</strong> ' + (p.commercial_name || p.product_type || 'Producto de construcci\u00f3n') + '</div>' +
      '<div class="meta-row"><strong>DPP UID:</strong> ' + (data.dpp_uid || '\u2014') + '</div>' +
      '<div class="meta-row"><strong>Regulaci\u00f3n:</strong> ' + fw.join(' \u00b7 ') + '</div>' +
      '<div class="meta-row"><strong>Versi\u00f3n:</strong> ' + (data.dpp_version || '1.0') + ' \u2014 ' + (data.last_updated || '') + '</div>' +
      '<div class="meta-row"><strong>Evidencia:</strong> Trackline by Code Contract S.L.</div>' +
      '</div>';
  }

  // ── Render: Dashboard ──
  function renderDashboard(data) {
    var bs = data.block_status || {};
    var total = 0, verified = 0, partial = 0, pending = 0, pendingAd = 0;
    Object.values(bs).forEach(function(s) {
      total++;
      if (s === 'verified') verified++;
      else if (s === 'partial') partial++;
      else if (s === 'pending_ad') pendingAd++;
      else pending++;
    });
    var pct = total ? Math.round((verified / total) * 100) : 0;
    var dashLen = Math.PI * 100;
    var dashOff = dashLen * (1 - pct / 100);

    // Count trackline evidence
    var traz = data.traceability || {};
    var hasTrackline = traz.trackline_hash && traz.trackline_hash !== '' ? 1 : 0;

    // Count components
    var numComps = (data.components || []).length;

    // Count EPD indicators
    var epd = data.epd || {};
    var eiCount = 0;
    var ei = epd.environmental_indicators || {};
    Object.values(ei).forEach(function(v) { if (v && v.value != null) eiCount++; });

    return '<div class="dpp-dashboard">' +
      '<div class="dashboard-header"><h2>\uD83D\uDCCA Panel ejecutivo DPP</h2></div>' +
      '<div class="dashboard-grid">' +
        '<div class="dashboard-ring">' +
          '<svg viewBox="0 0 120 120">' +
          '<circle cx="60" cy="60" r="50" class="ring-bg"/>' +
          '<circle cx="60" cy="60" r="50" class="ring-fill" stroke-dasharray="' + dashLen + '" stroke-dashoffset="' + dashOff + '"/>' +
          '</svg>' +
          '<span class="ring-label">' + pct + '%</span>' +
        '</div>' +
        '<div class="dashboard-stats">' +
          '<div class="stat"><span class="dot dot-v"></span> Verificados: <strong>' + verified + '</strong></div>' +
          '<div class="stat"><span class="dot dot-pa"></span> Parciales: <strong>' + partial + '</strong></div>' +
          '<div class="stat"><span class="dot dot-pe"></span> Pendientes: <strong>' + pending + '</strong></div>' +
          '<div class="stat"><span class="dot dot-ad"></span> Pendiente AD: <strong>' + pendingAd + '</strong></div>' +
          '<div class="stat-total">Total: ' + total + ' bloques</div>' +
        '</div>' +
        '<div class="dashboard-kpis">' +
          '<div class="kpi"><span class="kpi-number">' + numComps + '</span><span class="kpi-label">\uD83D\uDD29 Componentes</span></div>' +
          '<div class="kpi"><span class="kpi-number">' + eiCount + '</span><span class="kpi-label">\uD83C\uDF3F Indicadores EPD</span></div>' +
          '<div class="kpi"><span class="kpi-number">' + hasTrackline + '</span><span class="kpi-label">\u26D3\uFE0F Trackline</span></div>' +
          '<div class="kpi"><span class="kpi-number">' + pendingAd + '</span><span class="kpi-label">\uD83D\uDFE3 Pendiente AD</span></div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  // ── Render: Section ──
  function renderAttr(a) {
    var st = a.status || (hasValue(a.value) ? 'verified' : 'pending');
    var badge = statusBadge(st);
    var tracklineHTML = '';
    if (a.isTrackline && hasValue(a.value)) {
      var sh = String(a.value);
      if (sh.length > 20) sh = sh.slice(0, 10) + '\u2026' + sh.slice(-8);
      tracklineHTML = '<div class="trackline-badge verified"><span class="tl-icon">\u26D3\uFE0F</span><div class="tl-info">' +
        '<strong>Trackline verificado</strong>' +
        '<span class="tl-hash" title="' + a.value + '">Tx: ' + sh + '</span>' +
        '</div></div>';
    } else if (a.isTrackline && !hasValue(a.value)) {
      tracklineHTML = '<div class="trackline-badge pending"><span class="tl-icon">\u26D3\uFE0F</span><span class="tl-pending">Sin evidencia blockchain</span></div>';
    }
    return '<div class="attribute" data-status="' + st + '">' +
      '<div class="attr-header"><h3>' + a.label + '</h3>' + badge + '</div>' +
      '<div class="attr-body"><div class="attr-data">' + fmt(a.value) + '</div>' +
      tracklineHTML +
      '</div></div>';
  }

  function renderComponent(c) {
    var st = c.status || 'pending';
    var badge = statusBadge(st);
    var fields = '';
    if (c.material) fields += '<span class="field-name">Material:</span> ' + c.material + '<br>';
    if (c.barrier) fields += '<span class="field-name">Barrera:</span> ' + c.barrier + '<br>';
    if (c.origin) fields += '<span class="field-name">Origen:</span> ' + c.origin + '<br>';
    if (c.mass_kg != null) fields += '<span class="field-name">Masa:</span> ' + c.mass_kg + ' kg<br>';
    if (c.mass_kg_per_m2 != null) fields += '<span class="field-name">Masa:</span> ' + c.mass_kg_per_m2 + ' kg/m\u00b2<br>';
    if (c.mass_kg_per_unit != null) fields += '<span class="field-name">Masa:</span> ' + c.mass_kg_per_unit + ' kg/ud<br>';
    if (c.recycled_content_percent != null) fields += '<span class="field-name">Contenido reciclado:</span> ' + c.recycled_content_percent + '%<br>';
    if (c.standard) fields += '<span class="field-name">Norma:</span> ' + c.standard + '<br>';
    if (c.supplier) fields += '<span class="field-name">Proveedor:</span> ' + c.supplier + '<br>';
    if (c.aenor_certified) fields += '<span class="field-name">Certificado AENOR:</span> S\u00ed<br>';
    if (c.u_value_center_glass) fields += '<span class="field-name">U vidrio centro:</span> ' + c.u_value_center_glass + ' W/m\u00b2K<br>';
    if (!fields) fields = '<span class="no-data">\u2014 sin datos \u2014</span>';
    return '<div class="attribute" data-status="' + st + '">' +
      '<div class="attr-header"><h3>' + (c.name || c.id) + '</h3>' + badge + '</div>' +
      '<div class="attr-body"><div class="attr-data">' + fields + '</div></div></div>';
  }

  function renderSection(sec, extraCls) {
    var cls = extraCls ? ' ' + extraCls : '';
    var sectionStatus = sec.status || 'pending';
    var headerBadge = statusBadge(sectionStatus);

    // Count statuses within section
    var counts = { verified: 0, partial: 0, pending: 0 };
    if (sec.components) {
      sec.components.forEach(function(c) {
        var s = c.status || 'pending';
        counts[s] = (counts[s] || 0) + 1;
      });
    } else if (sec.attrs) {
      sec.attrs.forEach(function(a) {
        var s = a.status || (hasValue(a.value) ? 'verified' : 'pending');
        counts[s] = (counts[s] || 0) + 1;
      });
    }

    var countsHTML = '<div class="section-counts">' +
      (counts.verified ? '<span class="cnt cnt-v">' + counts.verified + '</span>' : '') +
      (counts.partial ? '<span class="cnt cnt-pa">' + counts.partial + '</span>' : '') +
      (counts.pending ? '<span class="cnt cnt-pe">' + counts.pending + '</span>' : '') +
      '</div>';

    var bodyHTML = '';

    // Legal pill
    bodyHTML += legalPill(sec.legal);

    // Source doc
    bodyHTML += sourceDocHTML(sec.doc);

    // Content
    if (sec.components) {
      sec.components.forEach(function(c) { bodyHTML += renderComponent(c); });
    } else if (sec.attrs) {
      sec.attrs.forEach(function(a) { bodyHTML += renderAttr(a); });
    }

    return '<section class="dpp-section' + cls + '" id="sec-' + sec.id + '">' +
      '<div class="section-header" onclick="DPP.toggle(\'' + sec.id + '\')">' +
        '<span class="section-icon">' + sec.icon + '</span>' +
        '<h2>' + sec.title + '</h2>' +
        countsHTML +
        '<span class="chevron" id="chev-' + sec.id + '">\u25B6</span>' +
      '</div>' +
      '<div class="section-body collapsed" id="body-' + sec.id + '">' + bodyHTML + '</div>' +
    '</section>';
  }

  // ── Render: Legend ──
  function renderLegend() {
    return '<div class="legend"><h3>Leyenda</h3><div class="legend-grid">' +
      '<div class="legend-item"><span class="legend-swatch" style="background:#38a169"></span> Verificado \u2014 dato completo y validado</div>' +
      '<div class="legend-item"><span class="legend-swatch" style="background:#d69e2e"></span> Parcial \u2014 dato disponible, requiere revisi\u00f3n</div>' +
      '<div class="legend-item"><span class="legend-swatch" style="background:#e53e3e"></span> Pendiente \u2014 sin dato, acci\u00f3n requerida</div>' +
      '<div class="legend-item"><span class="legend-swatch" style="background:#c6f6d5;border:1px solid #38a169"></span> LEY \u2014 legislaci\u00f3n en vigor</div>' +
      '<div class="legend-item"><span class="legend-swatch" style="background:#fefcbf;border:1px solid #d69e2e"></span> PROYECCI\u00d3N \u2014 regulaci\u00f3n proyectada</div>' +
      '<div class="legend-item"><span class="legend-swatch" style="background:#e9d8fd;border:1px solid #d6bcfa"></span> PENDIENTE AD \u2014 pendiente acto delegado</div>' +
      '<div class="legend-item"><span class="legend-swatch" style="background:#6b46c1"></span> Trackline \u2014 evidencia blockchain registrada</div>' +
      '<div class="legend-item"><span class="legend-swatch" style="background:#faf5ff;border:2px solid #6b46c1"></span> Registro Central Art. 13 \u2014 campos obligatorios</div>' +
    '</div></div>';
  }

  // ── Render: Filters ──
  function renderFilters() {
    return '<div class="filter-bar">' +
      '<button class="filter-btn active" data-filter="all">Todos</button>' +
      '<button class="filter-btn" data-filter="verified">\u2705 Verificados</button>' +
      '<button class="filter-btn" data-filter="partial">\u26A0\uFE0F Parciales</button>' +
      '<button class="filter-btn" data-filter="pending">\u274C Pendientes</button>' +
    '</div>';
  }

  function bindFilters() {
    document.querySelectorAll('.filter-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        var f = btn.dataset.filter;
        document.querySelectorAll('.attribute').forEach(function(el) {
          el.style.display = (f === 'all' || el.dataset.status === f) ? '' : 'none';
        });
      });
    });
  }

  // ── Toggle ──
  function toggle(id) {
    var body = document.getElementById('body-' + id);
    var chev = document.getElementById('chev-' + id);
    if (!body) return;
    if (body.classList.contains('collapsed')) {
      body.classList.remove('collapsed');
      chev.textContent = '\u25BC';
    } else {
      body.classList.add('collapsed');
      chev.textContent = '\u25B6';
    }
  }

  // ── Init ──
  async function init(jsonPath, containerId) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '<div class="loading">Cargando DPP\u2026</div>';
    try {
      var res = await fetch(jsonPath, { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var data = await res.json();
      window._dppData = data;

      var html = renderMeta(data);
      html += renderDashboard(data);
      html += renderLegend();

      // Registry section (highlighted, first)
      var reg = getRegistry(data);
      html += renderSection(reg, 'registry-highlight');

      // Filters
      html += renderFilters();

      // Sections
      var sections = getSections(data);
      sections.forEach(function(sec) {
        html += renderSection(sec, '');
      });

      container.innerHTML = html;
      bindFilters();
    } catch (err) {
      container.innerHTML = '<div class="error"><strong>\u26A0\uFE0F Error cargando el DPP</strong><br>' +
        '<span style="font-size:.9rem">' + err.message + '</span><br>' +
        '<span style="font-size:.8rem;color:#718096;margin-top:.5rem;display:block">' +
        'Revisa la consola (F12) o recarga con Ctrl+F5.</span></div>';
    }
  }

  return { init: init, toggle: toggle };
})();

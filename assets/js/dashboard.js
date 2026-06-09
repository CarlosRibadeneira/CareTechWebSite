(function () {
  const plotlyLayoutBase = {
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { color: "#cbd5e1", family: "Inter, sans-serif" },
    margin: { l: 60, r: 20, t: 30, b: 70 },
    xaxis: { gridcolor: "rgba(255,255,255,0.08)", linecolor: "rgba(255,255,255,0.25)" },
    yaxis: { gridcolor: "rgba(255,255,255,0.08)", linecolor: "rgba(255,255,255,0.25)" }
  };

  let projects = [];
  let charts = null;
  let activeFilter = "All";
  let currentProject = null;

  function normalizeTag(value) {
    return value.toLowerCase().replace(/\s+/g, "");
  }

  function byFilter(project) {
    if (activeFilter === "All") return true;
    if (project.track === activeFilter) return true;
    return project.tags.some((tag) => normalizeTag(tag) === normalizeTag(activeFilter));
  }

  function setActiveFilter(tag) {
    activeFilter = tag;
    document.querySelectorAll(".filter-chip[data-filter]").forEach((chip) => {
      chip.classList.toggle("is-active", chip.dataset.filter === tag);
    });
    renderWorkCards();
  }

  function getProjectById(projectId) {
    return projects.find((project) => project.id === projectId) || projects[0];
  }

  function getNextProject(project) {
    const idx = projects.findIndex((item) => item.id === project.id);
    if (idx < 0) return projects[0];
    return projects[(idx + 1) % projects.length];
  }

  function buildWorkCard(project) {
    const article = document.createElement("article");
    article.className = "work-card dashboard-card";
    article.innerHTML = [
      `<p class="work-label">${project.track}</p>`,
      `<h3>${project.title}</h3>`,
      `<p>${project.summary}</p>`,
      `<p class="work-meta"><strong>Outcome:</strong> ${project.outcome}</p>`,
      `<a class="btn btn-secondary detail-btn" href="case.html?id=${project.id}">View case details</a>`
    ].join("");
    return article;
  }

  function renderWorkCards() {
    const root = document.getElementById("projects-grid");
    if (!root) return;
    root.innerHTML = "";
    projects.filter(byFilter).forEach((project) => root.appendChild(buildWorkCard(project)));
  }

  function bindWorkEvents() {
    const filterRoot = document.getElementById("dashboard-filters");
    if (!filterRoot) return;
    filterRoot.addEventListener("click", (event) => {
      const target = event.target.closest(".filter-chip[data-filter]");
      if (!target) return;
      setActiveFilter(target.dataset.filter);
    });
  }

  function renderCaseMeta(project) {
    document.getElementById("case-title").textContent = project.title;
    document.getElementById("case-track").textContent = project.track;
    document.getElementById("case-summary").textContent = project.summary;
    document.getElementById("case-context").textContent = project.contextLine;
    document.getElementById("case-technique").textContent = project.technique;
    document.getElementById("case-how-read").textContent = project.howToRead;
    document.getElementById("case-interact").textContent = project.interact;
    document.getElementById("case-conclusion").textContent = project.conclusion;
  }

  function renderNextCaseNav(project) {
    const next = getNextProject(project);
    const nextLink = document.getElementById("next-case-link");
    if (!nextLink) return;
    nextLink.href = `case.html?id=${next.id}`;
    nextLink.textContent = `Next case study: ${next.track} - ${next.title}`;
  }

  function hideSqlViewer() {
    const sql = document.getElementById("sql-viewer");
    if (sql) sql.classList.add("is-hidden");
  }

  function showSqlViewer() {
    const sql = document.getElementById("sql-viewer");
    if (sql) sql.classList.remove("is-hidden");
  }

  function resetCaseChart() {
    const chartNode = document.getElementById("case-chart");
    if (!chartNode) return;
    if (typeof Plotly !== "undefined") {
      Plotly.purge(chartNode);
    }
    chartNode.innerHTML = "";
  }

  function renderEplStandingsTable(seasonKey) {
    const chartNode = document.getElementById("case-chart");
    if (!chartNode) return;
    const rows = charts.epl_snapshots[seasonKey] || [];
    const tableRows = rows
      .map(
        (team, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td>${team.team}</td>
            <td>${team.points}</td>
            <td>${team.wins}</td>
            <td>${team.draws}</td>
            <td>${team.losses}</td>
          </tr>`
      )
      .join("");

    chartNode.innerHTML = `
      <div class="table-wrap">
        <table class="result-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>Points</th>
              <th>W</th>
              <th>D</th>
              <th>L</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
    `;
  }

  function chartByProject(project) {
    const key = project.chartKey;
    const plotTarget = "case-chart";
    const controls = document.getElementById("case-controls");
    if (controls) controls.classList.add("is-hidden");
    hideSqlViewer();
    resetCaseChart();

    if (key === "renewal_importance") {
      const points = [...charts.renewal_importance].sort((a, b) => b.importance - a.importance);
      const top = points[0];
      Plotly.newPlot(
        plotTarget,
        [
          {
            type: "bar",
            orientation: "h",
            y: points.map((p) => p.feature),
            x: points.map((p) => p.importance),
            marker: { color: ["#38bdf8", "#4fc3f7", "#68c7ef", "#f97316", "#fb923c", "#fdba74"] }
          }
        ],
        {
          ...plotlyLayoutBase,
          margin: { l: 170, r: 30, t: 30, b: 50 },
          xaxis: { ...plotlyLayoutBase.xaxis, title: "Influence Strength" },
          yaxis: { ...plotlyLayoutBase.yaxis, automargin: true, autorange: "reversed" },
          annotations: [
            {
              x: top.importance,
              y: top.feature,
              text: "Top driver",
              showarrow: true,
              arrowhead: 2,
              ax: 55,
              ay: -25,
              font: { color: "#fdba74", size: 12 },
              arrowcolor: "#fdba74"
            }
          ]
        },
        { displayModeBar: false, responsive: true }
      );
      return;
    }

    if (key === "runkeeper_totals") {
      if (controls) controls.classList.remove("is-hidden");
      const metric = document.querySelector(".metric-chip.is-active")?.dataset.metric || "distance_km";
      const labels = Object.keys(charts.runkeeper_totals[metric]);
      const values = Object.values(charts.runkeeper_totals[metric]);
      const title = metric === "distance_km" ? "Distance share (%)" : metric === "climb_m" ? "Climb share (%)" : "Activity volume share (%)";

      Plotly.newPlot(
        plotTarget,
        [
          {
            type: "pie",
            labels,
            values,
            hole: 0.56,
            sort: false,
            marker: { colors: ["#38bdf8", "#0ea5e9", "#f97316"] },
            textinfo: "label+percent"
          }
        ],
        {
          ...plotlyLayoutBase,
          margin: { l: 20, r: 20, t: 30, b: 20 },
          showlegend: true,
          annotations: [{ text: title, showarrow: false, font: { color: "#cbd5e1", size: 12 }, x: 0.5, y: 0.5 }]
        },
        { displayModeBar: false, responsive: true }
      );
      return;
    }

    if (key === "sports_compensation") {
      const positions = Object.keys(charts.sports_compensation.top10_position_means);
      const top10 = positions.map((p) => charts.sports_compensation.top10_position_means[p].top10_yes);
      const nonTop10 = positions.map((p) => charts.sports_compensation.top10_position_means[p].top10_no);
      Plotly.newPlot(
        plotTarget,
        [
          { type: "bar", name: "Top 10", x: positions, y: top10, marker: { color: "#f97316" } },
          { type: "bar", name: "Outside Top 10", x: positions, y: nonTop10, marker: { color: "#38bdf8" } }
        ],
        {
          ...plotlyLayoutBase,
          barmode: "group",
          yaxis: { ...plotlyLayoutBase.yaxis, title: "Average Salary (USD)" },
          annotations: [
            {
              x: "A",
              y: top10[0],
              text: "Attacker premium",
              showarrow: true,
              arrowhead: 2,
              ax: 35,
              ay: -35,
              font: { color: "#fdba74", size: 12 },
              arrowcolor: "#fdba74"
            },
            {
              x: "M",
              y: top10[3],
              text: "Midfield premium",
              showarrow: true,
              arrowhead: 2,
              ax: -20,
              ay: -35,
              font: { color: "#fdba74", size: 12 },
              arrowcolor: "#fdba74"
            }
          ]
        },
        { displayModeBar: false, responsive: true }
      );
      return;
    }

    if (key === "parks_distribution") {
      const rows = charts.parks_distribution;
      Plotly.newPlot(
        plotTarget,
        [
          {
            type: "choropleth",
            locationmode: "USA-states",
            locations: rows.map((r) => r.code),
            z: rows.map((r) => r.count),
            text: rows.map((r) => `${r.state}: ${r.count}`),
            colorscale: [
              [0, "#0ea5e9"],
              [1, "#f97316"]
            ],
            marker: { line: { color: "rgba(255,255,255,0.3)", width: 1 } },
            colorbar: { title: "Count" }
          }
        ],
        {
          ...plotlyLayoutBase,
          margin: { l: 10, r: 10, t: 20, b: 10 },
          geo: {
            scope: "usa",
            bgcolor: "rgba(0,0,0,0)",
            lakecolor: "rgba(0,0,0,0)",
            showlakes: false
          }
        },
        { displayModeBar: false, responsive: true }
      );
      return;
    }

    if (key === "library_usage") {
      const rows = charts.library_usage;
      Plotly.newPlot(
        plotTarget,
        [
          {
            type: "bar",
            orientation: "h",
            y: rows.map((r) => r.label),
            x: rows.map((r) => r.value),
            marker: { color: "#0ea5e9" }
          }
        ],
        {
          ...plotlyLayoutBase,
          margin: { l: 210, r: 20, t: 20, b: 50 },
          xaxis: { ...plotlyLayoutBase.xaxis, title: "Checkout Count" },
          yaxis: { ...plotlyLayoutBase.yaxis, automargin: true, autorange: "reversed" }
        },
        { displayModeBar: false, responsive: true }
      );
      renderSqlViewer("books_checked_out", ["books_checked_out", "top_patrons"]);
      return;
    }

    if (key === "retail_margin") {
      const rows = [...charts.retail_margin].sort((a, b) => b.margin_pct - a.margin_pct);
      const total = rows.reduce((sum, row) => sum + row.margin_pct, 0);
      let cumulative = 0;
      const cumulativePct = rows.map((row) => {
        cumulative += row.margin_pct;
        return (cumulative / total) * 100;
      });

      Plotly.newPlot(
        plotTarget,
        [
          { type: "bar", name: "Margin %", x: rows.map((r) => r.category), y: rows.map((r) => r.margin_pct), marker: { color: "#f97316" } },
          { type: "scatter", name: "Cumulative %", x: rows.map((r) => r.category), y: cumulativePct, mode: "lines+markers", line: { color: "#38bdf8", width: 3 }, marker: { color: "#38bdf8", size: 7 }, yaxis: "y2" }
        ],
        {
          ...plotlyLayoutBase,
          yaxis: { ...plotlyLayoutBase.yaxis, title: "Average Margin (%)" },
          yaxis2: {
            title: "Cumulative (%)",
            overlaying: "y",
            side: "right",
            range: [0, 110],
            gridcolor: "rgba(255,255,255,0.03)",
            tickfont: { color: "#cbd5e1" }
          }
        },
        { displayModeBar: false, responsive: true }
      );
      renderSqlViewer("retail_margin_categories", ["retail_margin_categories", "retail_stock_risk"]);
      return;
    }

    if (key === "econometric_curve") {
      const rows = charts.econometric_curve;
      const minPoint = rows.reduce((min, row) => (row.predicted < min.predicted ? row : min), rows[0]);
      Plotly.newPlot(
        plotTarget,
        [{ type: "scatter", mode: "lines+markers", x: rows.map((r) => r.age), y: rows.map((r) => r.predicted), line: { color: "#38bdf8", width: 3 }, marker: { color: "#f97316", size: 7 } }],
        {
          ...plotlyLayoutBase,
          xaxis: { ...plotlyLayoutBase.xaxis, title: "Age" },
          yaxis: { ...plotlyLayoutBase.yaxis, title: "Predicted Outcome" },
          annotations: [
            {
              x: minPoint.age,
              y: minPoint.predicted,
              text: "Lowest around age ~45",
              showarrow: true,
              arrowhead: 2,
              ax: 55,
              ay: -35,
              font: { color: "#fdba74", size: 12 },
              arrowcolor: "#fdba74"
            }
          ]
        },
        { displayModeBar: false, responsive: true }
      );
      return;
    }

    if (key === "epl_snapshot") {
      renderEplStandingsTable("2020_21");
      return;
    }

    const rows = charts.foundations_maturity;
    Plotly.newPlot(
      plotTarget,
      [
        {
          type: "scatterpolar",
          r: rows.map((r) => r.score),
          theta: rows.map((r) => r.area),
          fill: "toself",
          fillcolor: "rgba(56, 189, 248, 0.25)",
          line: { color: "#38bdf8", width: 3 },
          marker: { color: "#f97316", size: 6 },
          name: "Capability profile"
        }
      ],
      {
        ...plotlyLayoutBase,
        margin: { l: 30, r: 30, t: 25, b: 20 },
        polar: {
          radialaxis: {
            visible: true,
            range: [0, 100],
            gridcolor: "rgba(255,255,255,0.1)",
            linecolor: "rgba(255,255,255,0.2)",
            tickfont: { color: "#cbd5e1" }
          },
          angularaxis: {
            gridcolor: "rgba(255,255,255,0.08)",
            linecolor: "rgba(255,255,255,0.2)",
            tickfont: { color: "#cbd5e1", size: 11 }
          },
          bgcolor: "rgba(0,0,0,0)"
        }
      },
      { displayModeBar: false, responsive: true }
    );
  }

  function renderSqlViewer(defaultId, allowedIds = null) {
    showSqlViewer();
    const select = document.getElementById("sql-case-select");
    const q = document.getElementById("sql-case-question");
    const query = document.getElementById("sql-case-query");
    const head = document.getElementById("sql-case-head");
    const body = document.getElementById("sql-case-body");
    if (!select || !q || !query || !head || !body) return;
    const sqlCases = Array.isArray(allowedIds) && allowedIds.length
      ? charts.sql_cases.filter((item) => allowedIds.includes(item.id))
      : charts.sql_cases;
    if (!sqlCases.length) return;

    select.innerHTML = "";
    sqlCases.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = item.title;
      if (item.id === defaultId) option.selected = true;
      select.appendChild(option);
    });
    if (!select.value && sqlCases[0]) {
      select.value = sqlCases[0].id;
    }

    const paintCase = (caseId) => {
      const selected = sqlCases.find((item) => item.id === caseId) || sqlCases[0];
      q.textContent = selected.question;
      query.textContent = selected.query.replace(/\\n/g, "\n");

      head.innerHTML = "";
      selected.columns.forEach((col) => {
        const th = document.createElement("th");
        th.textContent = col;
        th.title = col;
        head.appendChild(th);
      });

      body.innerHTML = "";
      selected.rows.forEach((row) => {
        const tr = document.createElement("tr");
        row.forEach((cell) => {
          const td = document.createElement("td");
          td.textContent = cell;
          td.title = String(cell);
          tr.appendChild(td);
        });
        body.appendChild(tr);
      });
    };

    paintCase(select.value);
    select.onchange = () => paintCase(select.value);
  }

  function bindCaseEvents() {
    const metricButtons = document.querySelectorAll(".metric-chip");
    metricButtons.forEach((button) => {
      button.onclick = () => {
        metricButtons.forEach((item) => item.classList.remove("is-active"));
        button.classList.add("is-active");
        if (currentProject && currentProject.chartKey === "runkeeper_totals") {
          chartByProject(currentProject);
        }
      };
    });
  }

  function renderCasePage() {
    const params = new URLSearchParams(window.location.search);
    currentProject = getProjectById(params.get("id"));
    document.title = `${currentProject.title} | CareTech Innovations LLC`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && currentProject.summary) {
      metaDescription.setAttribute("content", currentProject.summary);
    }
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", `${currentProject.title} | CareTech Innovations LLC`);
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription && currentProject.summary) ogDescription.setAttribute("content", currentProject.summary);
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute("content", `${currentProject.title} | CareTech Innovations LLC`);
    const twitterDescription = document.querySelector('meta[name="twitter:description"]');
    if (twitterDescription && currentProject.summary) twitterDescription.setAttribute("content", currentProject.summary);
    renderCaseMeta(currentProject);
    renderNextCaseNav(currentProject);
    chartByProject(currentProject);
    bindCaseEvents();
  }

  async function loadData() {
    const [projectRes, chartsRes] = await Promise.all([
      fetch("assets/data/projects.json"),
      fetch("assets/data/charts.json")
    ]);
    projects = await projectRes.json();
    charts = await chartsRes.json();
  }

  async function init() {
    if (typeof Plotly === "undefined") return;
    await loadData();

    if (document.body.dataset.page === "work") {
      bindWorkEvents();
      setActiveFilter("All");
      return;
    }

    if (document.body.dataset.page === "case") {
      renderCasePage();
    }
  }

  init().catch(() => {
    /* graceful fallback */
  });
})();

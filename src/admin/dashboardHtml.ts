// src/admin/dashboardHtml.ts
// Description: Embedded read-only dashboard HTML for local observation.
// Expects: No runtime inputs.
// Provides: A static HTML page that polls authorized admin JSON endpoints.

export const DASHBOARD_HTML: string = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SwISD Observation Deck</title>
  <link rel="icon" href="data:," />
  <style>
    :root {
      color-scheme: dark;
    }

    body {
      font-family: monospace;
      background: #0b0f14;
      color: #d7e0ea;
      margin: 1rem;
    }

    h1 {
      margin-bottom: 0.25rem;
    }

    .controls {
      background: #121820;
      border: 1px solid #2a3848;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
    }

    label {
      display: block;
      margin-top: 0.75rem;
      margin-bottom: 0.25rem;
    }

    input,
    textarea {
      width: 100%;
      box-sizing: border-box;
      background: #0b0f14;
      color: #d7e0ea;
      border: 1px solid #2a3848;
      border-radius: 6px;
      padding: 0.5rem;
      font-family: monospace;
    }

    button {
      margin-top: 0.75rem;
      margin-right: 0.5rem;
      background: #203040;
      color: #ffffff;
      border: 1px solid #3d5570;
      border-radius: 6px;
      padding: 0.5rem 0.9rem;
      cursor: pointer;
    }

    button:hover {
      background: #2b4157;
    }

    .hint {
      color: #8aa0b8;
    }

    .card {
      background: #121820;
      border: 1px solid #2a3848;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1rem;
      overflow-wrap: anywhere;
    }

    .card.error {
      border-color: #7c2f39;
      background: #190f12;
    }

    .error {
      color: #ff6b7a;
    }

    dl {
      display: grid;
      grid-template-columns: max-content auto;
      gap: 0.35rem 1rem;
      margin: 0;
    }

    dt {
      color: #8aa0b8;
    }

    dd {
      margin: 0;
    }

    pre {
      background: #0b0f14;
      border: 1px solid #2a3848;
      border-radius: 6px;
      padding: 0.75rem;
      overflow: auto;
    }

    ul.events {
      margin: 0;
      padding-left: 1.2rem;
    }

    code {
      color: #8fd3ff;
    }
  </style>
</head>
<body>
  <h1>SwISD Observation Deck</h1>
  <p class="hint">Read-only dashboard. Polls <code>/v1/snapshot</code>. No write actions are exposed.</p>

  <section class="controls">
    <label for="token">Admin token</label>
    <input id="token" type="password" autocomplete="off" />

    <label for="endpoints">Endpoints, one per line</label>
    <textarea id="endpoints" rows="4" spellcheck="false"></textarea>

    <div>
      <button id="save">Save</button>
      <button id="refresh">Refresh</button>
    </div>
  </section>

  <section id="output"></section>

  <script>
    (function () {
      var tokenInput = document.getElementById('token');
      var endpointsInput = document.getElementById('endpoints');
      var saveButton = document.getElementById('save');
      var refreshButton = document.getElementById('refresh');
      var output = document.getElementById('output');

      var refreshing = false;
      var NEWLINE = String.fromCharCode(10);

      function clear(node) {
        if (!node) return;
        while (node.firstChild) {
          node.removeChild(node.firstChild);
        }
      }

      function createEl(tag, className, text) {
        var el = document.createElement(tag);
        if (className) {
          el.className = className;
        }
        if (text !== undefined && text !== null) {
          el.textContent = text;
        }
        return el;
      }

      function loadState() {
        if (!tokenInput || !endpointsInput) return;

        var savedToken = window.localStorage.getItem('swisd-dashboard-token');
        if (savedToken) {
          tokenInput.value = savedToken;
        }

        var savedEndpoints = window.localStorage.getItem('swisd-dashboard-endpoints');
        if (savedEndpoints) {
          endpointsInput.value = savedEndpoints;
        } else {
          endpointsInput.value = window.location.origin;
        }
      }

      function saveState() {
        if (!tokenInput || !endpointsInput) return;

        window.localStorage.setItem('swisd-dashboard-token', tokenInput.value.trim());
        window.localStorage.setItem('swisd-dashboard-endpoints', endpointsInput.value.trim());
      }

      function trimTrailingSlashes(line) {
        var result = line;

        while (result.length > 0 && result.charAt(result.length - 1) === '/') {
          result = result.slice(0, -1);
        }

        return result;
      }

      function parseEndpoints(raw) {
        return raw
          .split(NEWLINE)
          .map(function (line) {
            return line.trim();
          })
          .filter(function (line) {
            return line.length > 0;
          })
          .map(function (line) {
            return trimTrailingSlashes(line);
          });
      }

      async function fetchJson(base, token, path) {
        var response = await fetch(base + path, {
          headers: {
            Authorization: 'Bearer ' + token
          }
        });

        if (response.status === 401) {
          throw new Error('Unauthorized (401)');
        }

        if (!response.ok) {
          throw new Error('HTTP ' + response.status);
        }

        return response.json();
      }

      function createSection(title) {
        var section = createEl('section', 'card');
        section.appendChild(createEl('h2', '', title));
        return section;
      }

      function createDefinitionList(obj) {
        var dl = createEl('dl', '', '');

        if (!obj || typeof obj !== 'object') {
          return dl;
        }

        var keys = Object.keys(obj);

        for (var i = 0; i < keys.length; i += 1) {
          var key = keys[i];
          var value = obj[key];

          if (value !== null && typeof value === 'object') {
            continue;
          }

          dl.appendChild(createEl('dt', '', key));
          dl.appendChild(createEl('dd', '', String(value)));
        }

        return dl;
      }

      function createErrorSection(endpoint, message) {
        var section = createSection(endpoint);
        section.classList.add('error');
        section.appendChild(createEl('pre', '', message));
        return section;
      }

      async function renderEndpoint(base, token) {
        try {
          var snapshot = await fetchJson(base, token, '/v1/snapshot');

          if (!snapshot || typeof snapshot !== 'object') {
            throw new Error('Invalid snapshot payload');
          }

          var section = createSection(base);

          section.appendChild(createEl('h3', '', 'Process'));
          section.appendChild(createDefinitionList(snapshot.process));

          section.appendChild(createEl('h3', '', 'Load'));
          section.appendChild(createDefinitionList(snapshot.load));

          section.appendChild(createEl('h3', '', 'Network'));
          section.appendChild(createDefinitionList(snapshot.network));

          section.appendChild(createEl('h3', '', 'Delivery'));
          section.appendChild(createDefinitionList(snapshot.delivery));

          if (snapshot.crdt) {
            section.appendChild(createEl('h3', '', 'CRDT roots'));
            section.appendChild(createEl('pre', '', JSON.stringify(snapshot.crdt.roots, null, 2)));
          }

          if (Array.isArray(snapshot.recentEvents)) {
            section.appendChild(createEl('h3', '', 'Recent events'));

            var ul = createEl('ul', 'events', '');

            for (var i = 0; i < snapshot.recentEvents.length; i += 1) {
              var event = snapshot.recentEvents[i];

              if (!event || typeof event !== 'object') {
                continue;
              }

              var li = createEl(
                'li',
                '',
                '[' + event.sequence + '] ' + event.topic + ' / ' + event.level + ' - ' + event.message
              );

              ul.appendChild(li);
            }

            section.appendChild(ul);
          }

          return section;
        } catch (err) {
          return createErrorSection(base, err instanceof Error ? err.message : String(err));
        }
      }

      async function refresh() {
        if (refreshing || !output) return;

        refreshing = true;

        try {
          clear(output);

          var token = tokenInput ? tokenInput.value.trim() : '';
          var endpoints = parseEndpoints(endpointsInput ? endpointsInput.value : '');

          if (!token) {
            output.appendChild(createEl('p', 'error', 'Token required.'));
            return;
          }

          if (endpoints.length === 0) {
            endpoints = [window.location.origin];
          }

          for (var i = 0; i < endpoints.length; i += 1) {
            var card = await renderEndpoint(endpoints[i], token);
            output.appendChild(card);
          }
        } finally {
          refreshing = false;
        }
      }

      if (saveButton) {
        saveButton.addEventListener('click', function () {
          saveState();
          refresh();
        });
      }

      if (refreshButton) {
        refreshButton.addEventListener('click', function () {
          refresh();
        });
      }

      loadState();
      refresh();

      setInterval(function () {
        refresh();
      }, 3000);
    })();
  </script>
</body>
</html>`;
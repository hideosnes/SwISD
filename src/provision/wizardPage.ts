/**
 * 1. Relative path: src/provision/wizardPage.ts
 * 2. Description: Self-contained HTML/CSS/JS template for the Out-of-Box Setup Portal.
 * 3. Expects: Strictly typed portal state and error strings.
 * 4. Provides: A zero-dependency, smartphone-friendly captive portal UI.
 */

import type { PortalState } from './schema.js';

export function renderWizardPage(state: PortalState, error?: string, joinedSsid?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>SwISD Setup</title>
<style>
  :root {
    --bg: #0f172a;
    --surface: #1e293b;
    --primary: #38bdf8;
    --text: #f8fafc;
    --text-muted: #94a3b8;
    --error: #ef4444;
    --success: #22c55e;
    --border: #334155;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background: var(--bg); color: var(--text);
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    padding: 1rem;
  }
  .card {
    background: var(--surface); padding: 2rem; border-radius: 1rem;
    width: 100%; max-width: 400px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
    border: 1px solid var(--border);
  }
  h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: var(--primary); }
  p.sub { color: var(--text-muted); margin-bottom: 1.5rem; font-size: 0.9rem; }
  label { display: block; font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem; }
  input, select {
    width: 100%; padding: 0.75rem; background: var(--bg); border: 1px solid var(--border);
    border-radius: 0.5rem; color: var(--text); font-size: 1rem; margin-bottom: 1rem;
    outline: none; transition: border-color 0.2s;
  }
  input:focus, select:focus { border-color: var(--primary); }
  .toggle-pass { position: relative; }
  .toggle-pass button {
    position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%);
    background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 0.8rem;
  }
  .checkbox-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1.5rem; }
  .checkbox-row input { width: auto; margin: 0; }
  button.submit {
    width: 100%; padding: 0.85rem; background: var(--primary); color: var(--bg);
    border: none; border-radius: 0.5rem; font-size: 1rem; font-weight: 600;
    cursor: pointer; transition: opacity 0.2s;
  }
  button.submit:disabled { opacity: 0.5; cursor: not-allowed; }
  .error { color: var(--error); background: rgba(239,68,68,0.1); padding: 0.75rem; border-radius: 0.5rem; margin-bottom: 1rem; font-size: 0.9rem; }
  .success { text-align: center; }
  .success h2 { color: var(--success); margin-bottom: 1rem; }
  .spinner {
    width: 40px; height: 40px; border: 4px solid var(--border);
    border-top-color: var(--primary); border-radius: 50%;
    animation: spin 1s linear infinite; margin: 2rem auto;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>
</head>
<body>
  <div class="card">
    <div id="app"></div>
  </div>
  <script>
    const app = document.getElementById('app');
    let state = '${state}';
    let error = ${JSON.stringify(error || '')};
    let joinedSsid = ${JSON.stringify(joinedSsid || '')};

    function render() {
      if (state === 'idle' || state === 'failed') {
        app.innerHTML = \`
          <h1>SwISD Setup</h1>
          <p class="sub">Connect this node to your local WiFi network.</p>
          \${state === 'failed' ? \`<div class="error">Failed to connect: \${error}</div>\` : ''}
          <form id="joinForm">
            <label for="ssid">Network Name (SSID)</label>
            <input type="text" id="ssid" name="ssid" required autocomplete="off" autocapitalize="none">
            
            <label for="country">Country Code</label>
            <input type="text" id="country" name="country" value="US" maxlength="2" required>
            
            <label for="security">Security</label>
            <select id="security" name="security">
              <option value="wpa2-psk">WPA2 Personal</option>
              <option value="wpa3-sae">WPA3 Personal</option>
              <option value="open">Open (None)</option>
            </select>
            
            <div id="passGroup">
              <label for="passphrase">Passphrase</label>
              <div class="toggle-pass">
                <input type="password" id="passphrase" name="passphrase" required autocomplete="off">
                <button type="button" id="togglePassBtn">SHOW</button>
              </div>
            </div>
            
            <div class="checkbox-row">
              <input type="checkbox" id="hidden" name="hidden">
              <label for="hidden" style="margin:0; color: var(--text);">Hidden Network</label>
            </div>
            
            <button type="submit" class="submit">Connect</button>
          </form>
        \`;
        
        document.getElementById('joinForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          state = 'joining';
          render();
          
          const ssid = document.getElementById('ssid').value;
          const country = document.getElementById('country').value.toUpperCase();
          const security = document.getElementById('security').value;
          const passphrase = document.getElementById('passphrase')?.value || null;
          const hidden = document.getElementById('hidden').checked;
          
          try {
            const res = await fetch('/join', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ssid, security, passphrase, hidden, country })
            });
            const data = await res.json();
            if (data.status === 'joined') {
              state = 'joined';
            } else {
              state = 'failed';
              error = data.message || data.reason || 'Unknown error';
            }
          } catch (err) {
            state = 'failed';
            error = 'Network error';
          }
          render();
        });
        
        const sec = document.getElementById('security');
        const passGroup = document.getElementById('passGroup');
        const passInput = document.getElementById('passphrase');
        sec.addEventListener('change', () => {
          if (sec.value === 'open') {
            passGroup.style.display = 'none';
            passInput.required = false;
          } else {
            passGroup.style.display = 'block';
            passInput.required = true;
          }
        });
        
        document.getElementById('togglePassBtn').addEventListener('click', () => {
          const btn = document.getElementById('togglePassBtn');
          if (passInput.type === 'password') {
            passInput.type = 'text';
            btn.textContent = 'HIDE';
          } else {
            passInput.type = 'password';
            btn.textContent = 'SHOW';
          }
        });
        
      } else if (state === 'joining') {
        app.innerHTML = \`
          <h1>Connecting...</h1>
          <p class="sub">Please wait while the node joins the network.</p>
          <div class="spinner"></div>
        \`;
      } else if (state === 'joined') {
        app.innerHTML = \`
          <div class="success">
            <h1>Success!</h1>
            <p class="sub">The node has joined your network.</p>
            <p class="sub" style="margin-top: 1rem;">You can now disconnect from the setup network and access the cockpit at:</p>
            <p style="font-family: monospace; font-size: 1.2rem; color: var(--primary); margin-top: 0.5rem;">http://swisd.local:4101</p>
          </div>
        \`;
      }
    }
    render();
  </script>
</body>
</html>`;
}
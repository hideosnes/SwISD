/**
 * 1. Relative path: src/provision/wizardPage.ts
 * 2. Description: Self-contained HTML/CSS/JS template for the Out-of-Box Setup Portal.
 * 3. Expects: Strictly typed portal state and error strings from the portal server.
 * 4. Provides: A zero-dependency, smartphone-friendly captive portal UI that perfectly mirrors the Conductor Cockpit's Midnight Violet design bench.
 * 5. SPDX-License-Identifier: MPL-2.0
 * 6. Copyright (c) 2026 Homahuki GmbH
 */

import type { PortalState } from './schema.js';

export function renderWizardPage(state: PortalState, error?: string, joinedSsid?: string): string {
  const escapedError = error ? error.replace(/"/g, '&quot;') : '';
  const escapedSsid = joinedSsid ? joinedSsid.replace(/"/g, '&quot;') : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<title>SwISD Setup</title>
<style>
  :root {
    /* Midnight Violet Regime Tokens */
    --bg: #0b0f19;
    --surface: #151b2b;
    --text-1: #f8fafc;
    --text-2: #94a3b8;
    --text-3: #64748b;
    --border: transparent;
    --accent: #38bdf8;
    --accent-2: #0ea5e9;
    --live: #22c55e;
    --warn: #f59e0b;
    
    /* Chameleon Logic: Fields on the dark page become medium */
    --field-bg: var(--surface);
    
    --font-ui: 'Space Grotesk', system-ui, sans-serif;
    --font-mono: 'IBM Plex Mono', Consolas, monospace;
    
    --r-sm: 2px;
    --ease: cubic-bezier(0.2, 0.7, 0.2, 1);
    --duration-fast: 150ms;
  }

  * { box-sizing: border-box; margin: 0; padding: 0; }
  
  body {
    background: var(--bg);
    color: var(--text-1);
    font-family: var(--font-ui);
    font-size: 16px;
    line-height: 1.5;
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    -webkit-font-smoothing: antialiased;
  }

  main {
    max-width: 448px;
    width: 100%;
    margin: 0 auto;
    padding: 32px 24px;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .state { display: none; }
  .state.active { display: flex; flex-direction: column; }

  /* Header */
  .header { text-align: center; margin-bottom: 32px; }
  .header h1 { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
  .header p { margin-top: 4px; font-size: 14px; color: var(--text-2); }

  /* Error Banner */
  .error-banner {
    background: color-mix(in srgb, var(--warn) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--warn) 30%, transparent);
    border-radius: var(--r-sm);
    padding: 12px 16px;
    color: var(--warn);
    font-size: 14px;
    margin-bottom: 20px;
    display: none;
  }
  .error-banner.visible { display: block; }

  /* Form */
  .form { display: flex; flex-direction: column; gap: 20px; }

  /* Field (TextField parity) */
  .field { display: flex; flex-direction: column; gap: 6px; }
  .field label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-2);
    font-family: var(--font-mono);
  }
  .field input[type="text"],
  .field input[type="password"] {
    width: 100%;
    padding: 11px 14px;
    background: var(--field-bg);
    color: var(--text-1);
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    font-family: var(--font-mono);
    font-size: 13px;
    transition: border-color var(--duration-fast) var(--ease), box-shadow var(--duration-fast) var(--ease);
  }
  .field input:focus {
    outline: none;
    border-color: var(--accent-2);
    box-shadow: 0 0 0 1px var(--accent-2), 0 0 16px color-mix(in srgb, var(--accent-2) 25%, transparent);
  }

  /* Passphrase Wrap */
  .pass-wrap { position: relative; }
  .pass-wrap input { padding-right: 60px; }
  .show-pass-btn {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: var(--accent);
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    cursor: pointer;
    padding: 4px 8px;
  }

  /* Custom Select (Select.svelte parity) */
  .select-wrap { position: relative; }
  .select-trigger {
    width: 100%;
    padding: 11px 14px;
    background: var(--field-bg);
    color: var(--text-1);
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    font-family: var(--font-mono);
    font-size: 13px;
    text-align: left;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    transition: border-color var(--duration-fast) var(--ease), box-shadow var(--duration-fast) var(--ease);
  }
  .select-trigger:focus {
    outline: none;
    border-color: var(--accent-2);
    box-shadow: 0 0 0 1px var(--accent-2), 0 0 16px color-mix(in srgb, var(--accent-2) 25%, transparent);
  }
  .select-icon { font-size: 10px; color: var(--text-3); transition: transform var(--duration-fast) var(--ease); }
  .select-wrap.open .select-icon { transform: rotate(180deg); }
  
  .select-panel {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: var(--field-bg);
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    z-index: 100;
    max-height: 240px;
    overflow-y: auto;
    padding: 4px;
    display: none;
  }
  .select-wrap.open .select-panel { display: block; }
  
  .select-option {
    padding: 8px 10px;
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--text-1);
    border-radius: var(--r-sm);
    cursor: pointer;
    transition: background var(--duration-fast) var(--ease);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .select-option:hover, .select-option.active { background: color-mix(in srgb, var(--text-1) 10%, transparent); }
  .select-option[aria-selected="true"] { color: var(--accent); }
  .select-option-check { font-size: 14px; margin-left: 8px; }

  /* Toggles (Toggle.svelte parity) */
  .toggles { display: flex; flex-direction: column; gap: 16px; }
  .toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  .toggle-label-wrap { display: flex; flex-direction: column; gap: 2px; }
  .toggle-label-wrap label {
    font-size: 14px;
    color: var(--text-1);
    cursor: pointer;
  }
  .toggle-desc { font-size: 12px; color: var(--text-3); }
  
  .toggle {
    position: relative;
    width: 44px;
    height: 24px;
    border-radius: 999px;
    background: var(--surface);
    border: 1px solid var(--border);
    cursor: pointer;
    transition: background var(--duration-fast) var(--ease);
    flex-shrink: 0;
  }
  .toggle[aria-checked="true"] { background: var(--accent); }
  .toggle-thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--text-1);
    transition: transform var(--duration-fast) var(--ease);
  }
  .toggle[aria-checked="true"] .toggle-thumb { transform: translateX(20px); }

  /* Submit Button */
  .submit-row { display: flex; justify-content: flex-end; margin-top: 8px; }
  .btn {
    padding: 10px 20px;
    border-radius: var(--r-sm);
    font-family: var(--font-ui);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: opacity var(--duration-fast) var(--ease);
  }
  .btn-primary { background: var(--accent); color: var(--bg); }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Joining State */
  .spinner-wrap { display: flex; justify-content: center; margin-bottom: 24px; }
  .spinner {
    width: 96px;
    height: 96px;
    border: 4px solid var(--surface);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  #state-joining h1, #state-joined h1 { text-align: center; font-size: 20px; font-weight: 700; }
  #state-joining p, #state-joined p { text-align: center; font-size: 14px; color: var(--text-2); margin-top: 8px; }

  /* Joined State */
  .success-icon {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--live) 15%, transparent);
    color: var(--live);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    margin: 0 auto 24px;
  }
  #state-joined code {
    display: block;
    text-align: center;
    margin-top: 24px;
    padding: 12px 16px;
    background: var(--surface);
    border-radius: var(--r-sm);
    font-family: var(--font-mono);
    font-size: 14px;
    color: var(--accent);
  }
</style>
</head>
<body>
  <main>
    <!-- IDLE / FAILED STATE -->
    <div id="state-idle" class="state active">
      <header class="header">
        <h1>SwISD Setup</h1>
        <p>Connect this node to your WiFi network.</p>
      </header>

      <div id="error-banner" class="error-banner">
        <p id="error-msg"></p>
      </div>

      <form id="join-form" class="form">
        <div class="field">
          <label for="ssid">Network name (SSID)</label>
          <input type="text" id="ssid" name="ssid" required autocomplete="off">
        </div>

        <div class="field">
          <label for="country">Country code</label>
          <input type="text" id="country" name="country" value="AT" maxlength="2" required>
        </div>

        <div class="field">
          <label id="security-label">Security</label>
          <div class="select-wrap" id="security-wrap">
            <button type="button" class="select-trigger" id="security-trigger" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="security-label">
              <span class="select-value">WPA2 Personal</span>
              <span class="select-icon">▼</span>
            </button>
            <div class="select-panel" id="security-panel" role="listbox" tabindex="-1">
              <div class="select-option" role="option" aria-selected="true" data-value="wpa2-psk" tabindex="-1">WPA2 Personal <span class="select-option-check">✓</span></div>
              <div class="select-option" role="option" aria-selected="false" data-value="wpa3-sae" tabindex="-1">WPA3 Personal</div>
              <div class="select-option" role="option" aria-selected="false" data-value="open" tabindex="-1">Open (no password)</div>
            </div>
            <input type="hidden" name="security" id="security-value" value="wpa2-psk">
          </div>
        </div>

        <div class="field" id="pass-field">
          <label for="passphrase">Passphrase</label>
          <div class="pass-wrap">
            <input type="password" id="passphrase" name="passphrase" required autocomplete="off">
            <button type="button" class="show-pass-btn" id="toggle-pass">Show</button>
          </div>
        </div>

        <div class="toggles">
          <div class="toggle-row">
            <label for="hidden-toggle">Hidden network</label>
            <button type="button" role="switch" aria-checked="false" class="toggle" id="hidden-toggle">
              <span class="toggle-thumb"></span>
            </button>
            <input type="hidden" name="hidden" id="hidden-value" value="false">
          </div>
          <div class="toggle-row">
            <div class="toggle-label-wrap">
              <label for="temp-toggle">Temporary</label>
              <p class="toggle-desc">Nodes forget these credentials on reboot.</p>
            </div>
            <button type="button" role="switch" aria-checked="false" class="toggle" id="temp-toggle">
              <span class="toggle-thumb"></span>
            </button>
            <input type="hidden" name="temporary" id="temp-value" value="false">
          </div>
        </div>

        <div class="submit-row">
          <button type="submit" class="btn btn-primary" id="connect-btn">Connect</button>
        </div>
      </form>
    </div>

    <!-- JOINING STATE -->
    <div id="state-joining" class="state">
      <div class="spinner-wrap"><div class="spinner"></div></div>
      <h1>Joining network…</h1>
      <p>Applying credentials and connecting. Keep this page open.</p>
    </div>

    <!-- JOINED STATE -->
    <div id="state-joined" class="state">
      <div class="success-icon">✓</div>
      <h1>Connected</h1>
      <p>This node joined your network. Every available node connected to this setup portal has received the credentials and will join the network as well.</p>
      <p>Reconnect your phone to your usual WiFi, then open the cockpit.</p>
      <code>http://swisd.local:4101</code>
    </div>
  </main>

  <script>
    // State management
    const states = {
      idle: document.getElementById('state-idle'),
      joining: document.getElementById('state-joining'),
      joined: document.getElementById('state-joined')
    };
    const errorBanner = document.getElementById('error-banner');
    const errorMsg = document.getElementById('error-msg');

    function showState(name) {
      Object.values(states).forEach(el => el.classList.remove('active'));
      states[name].classList.add('active');
      errorBanner.classList.remove('visible');
    }

    function showError(msg) {
      errorMsg.textContent = msg;
      errorBanner.classList.add('visible');
      showState('idle');
    }

    // Custom Select Logic
    const selectWrap = document.getElementById('security-wrap');
    const selectTrigger = document.getElementById('security-trigger');
    const selectPanel = document.getElementById('security-panel');
    const selectValue = document.getElementById('security-value');
    const selectValueText = selectTrigger.querySelector('.select-value');
    const selectOptions = selectPanel.querySelectorAll('.select-option');
    const passField = document.getElementById('pass-field');

    selectTrigger.addEventListener('click', () => {
      const isOpen = selectWrap.classList.contains('open');
      selectWrap.classList.toggle('open');
      selectTrigger.setAttribute('aria-expanded', !isOpen);
    });

    selectOptions.forEach(opt => {
      opt.addEventListener('click', () => {
        const val = opt.getAttribute('data-value');
        selectValue.value = val;
        selectValueText.textContent = opt.textContent.trim().replace('✓', '').trim();
        
        selectOptions.forEach(o => {
          o.setAttribute('aria-selected', 'false');
          o.innerHTML = o.textContent.trim().replace('✓', '').trim();
        });
        opt.setAttribute('aria-selected', 'true');
        if (val !== 'open') opt.innerHTML += ' <span class="select-option-check">✓</span>';

        selectWrap.classList.remove('open');
        selectTrigger.setAttribute('aria-expanded', 'false');

        // Hide passphrase if open
        passField.style.display = val === 'open' ? 'none' : 'flex';
        document.getElementById('passphrase').required = val !== 'open';
      });
    });

    document.addEventListener('click', (e) => {
      if (!selectWrap.contains(e.target)) {
        selectWrap.classList.remove('open');
        selectTrigger.setAttribute('aria-expanded', 'false');
      }
    });

    // Toggle Logic
    function setupToggle(id, hiddenId) {
      const toggle = document.getElementById(id);
      const hidden = document.getElementById(hiddenId);
      toggle.addEventListener('click', () => {
        const isChecked = toggle.getAttribute('aria-checked') === 'true';
        toggle.setAttribute('aria-checked', !isChecked);
        hidden.value = !isChecked;
      });
    }
    setupToggle('hidden-toggle', 'hidden-value');
    setupToggle('temp-toggle', 'temp-value');

    // Show/Hide Passphrase
    const passInput = document.getElementById('passphrase');
    const togglePassBtn = document.getElementById('toggle-pass');
    togglePassBtn.addEventListener('click', () => {
      if (passInput.type === 'password') {
        passInput.type = 'text';
        togglePassBtn.textContent = 'Hide';
      } else {
        passInput.type = 'password';
        togglePassBtn.textContent = 'Show';
      }
    });

    // Form Submission & Polling
    const form = document.getElementById('join-form');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      showState('joining');

      const security = selectValue.value;
      const data = {
        ssid: document.getElementById('ssid').value,
        country: document.getElementById('country').value.toUpperCase(),
        security: security,
        passphrase: security === 'open' ? null : passInput.value,
        hidden: document.getElementById('hidden-value').value === 'true',
        temporary: document.getElementById('temp-value').value === 'true'
      };

      try {
        const res = await fetch('/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (res.status === 202 || res.status === 200) {
          pollStatus();
        } else {
          const err = await res.json();
          showError(err.message || 'Join rejected');
        }
      } catch (err) {
        showError('Network error');
      }
    });

    async function pollStatus() {
      try {
        const res = await fetch('/status');
        const data = await res.json();

        if (data.status === 'joined') {
          showState('joined');
        } else if (data.status === 'failed') {
          showError(data.error || 'Connection failed');
        } else {
          setTimeout(pollStatus, 1500);
        }
      } catch (err) {
        setTimeout(pollStatus, 2500);
      }
    }

    // Initial state from server
    const initialState = '${state}';
    const initialError = '${escapedError}';
    if (initialState === 'failed' && initialError) {
      showError(initialError);
    } else if (initialState === 'joined') {
      showState('joined');
    }
  </script>
</body>
</html>`;
}
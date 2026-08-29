<!-- 1. Relative path: cockpit/src/lib/components/ui/TextField.svelte
     2. Description: Text input with label and helper text.
     3. Expects: Label, value binding, and optional helper text.
     4. Provides: A themed, accessible text field with stable ID generation. -->

<script lang="ts">
  type InputType = 'text' | 'email' | 'password' | 'search' | 'url';

  interface Props {
    label: string;
    value?: string;
    type?: InputType;
    placeholder?: string;
    helper?: string;
    id?: string;
    icon?: string;
    oninput?: (value: string) => void;
  }

  let {
    label,
    value = $bindable(''),
    type = 'text',
    placeholder,
    helper,
    id: propId,
    icon,
    oninput,
  }: Props = $props();

  const generatedId = $derived(propId ?? `field-${Math.random().toString(36).slice(2, 9)}`);

  function handleInput(e: Event) {
    const target = e.target as HTMLInputElement;
    value = target.value;
    oninput?.(value);
  }
</script>

<div class="field" class:field--search={icon === 'search'}>
  <label for={generatedId}>{label}</label>
  <div class="field-input-wrap">
    {#if icon}
      <span class="mi field-icon">{icon}</span>
    {/if}
    <input
      id={generatedId}
      {type}
      {placeholder}
      value={value}
      oninput={handleInput}
    />
  </div>
  {#if helper}
    <span class="helper mono">{helper}</span>
  {/if}
</div>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .field label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-2);
  }

  .field-input-wrap {
    position: relative;
  }

  .field input {
    width: 100%;
    padding: 11px 14px;
    background: var(--bg);
    color: var(--text-1);
    border: 1px solid var(--border);
    border-radius: var(--r-sm);
    font-family: var(--font-mono);
    font-size: 13px;
    transition: border-color var(--duration-fast) var(--ease), box-shadow var(--duration-fast) var(--ease);
  }

  .field input::placeholder {
    color: var(--text-3);
  }

  .field input:focus {
    outline: none;
    border-color: var(--accent-2);
    box-shadow: 0 0 0 1px var(--accent-2), 0 0 16px rgba(0,255,200,.25);
  }

  .field--search input {
    padding-left: 38px;
  }

  .field-icon {
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--text-3);
    font-size: 17px;
    pointer-events: none;
  }

  .helper {
    font-size: 10px;
    color: var(--text-3);
    letter-spacing: 0.04em;
  }
</style>
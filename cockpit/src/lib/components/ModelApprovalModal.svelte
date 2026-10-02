<!--
1. Relative path: cockpit/src/lib/components/ModelApprovalModal.svelte
2. Description: Modal dialog for requesting and approving HuggingFace model downloads.
3. Expects: Open state, onclose callback, and optional initial URL.
4. Provides: A gated approval flow with metadata preview and capability selection.
5. SPDX-License-Identifier: MPL-2.0
6. Copyright (c) 2026 Homahuki GmbH
-->

<script lang="ts">
  import { Modal, Button, TextField } from '$lib/components/ui';

  // BFF DTOs — local mirrors of the /api/models/* response shapes.
  // Client components must never import from $core (GUIDE.md Domain C rule).
  interface HuggingFaceFileDto {
    readonly rfilename: string;
    readonly sizeBytes: number | null;
  }

  interface HuggingFaceMetadataDto {
    readonly repoId: string;
    readonly sanitizedModelId: string;
    readonly pipelineTag: string | null;
    readonly tags: ReadonlyArray<string>;
    readonly files: ReadonlyArray<HuggingFaceFileDto>;
    readonly totalSizeBytes: number;
    readonly isSizeAccurate: boolean;
  }

  interface ModelFileDto {
    readonly path: string;
    readonly sizeBytes: number;
    readonly isRequired: boolean;
  }

  interface RequestResponseDto {
    readonly metadata: HuggingFaceMetadataDto;
    readonly filteredFiles: ReadonlyArray<ModelFileDto>;
    readonly nonce: string;
  }

  interface ErrorResponseDto {
    readonly message?: string;
  }

  type Capability = 'inference' | 'embedding' | 'vision';

  interface Props {
    open: boolean;
    onclose: () => void;
    initialUrl?: string;
  }

  let { open, onclose, initialUrl = '' }: Props = $props();

  // Form state
  let url = $state('');
  let metadata = $state<HuggingFaceMetadataDto | null>(null);
  let selectedFiles = $state<ReadonlyArray<string>>([]);
  let requiredCapability = $state<Capability>('inference');
  let nonce = $state<string | null>(null);

  // UI state
  let loading = $state(false);
  let error = $state<string | null>(null);
  let submitting = $state(false);

  // Sync url when modal opens with a new initialUrl
  $effect(() => {
    if (open) {
      url = initialUrl;
    }
  });

  // Reset all state when modal closes
  $effect(() => {
    if (!open) {
      metadata = null;
      selectedFiles = [];
      requiredCapability = 'inference';
      nonce = null;
      error = null;
      loading = false;
      submitting = false;
    }
  });

  async function fetchMetadata(): Promise<void> {
    if (!url.trim()) {
      error = 'Please enter a HuggingFace URL';
      return;
    }

    error = null;
    loading = true;

    try {
      const response = await fetch('/api/models/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          selectedFiles: []
        })
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ErrorResponseDto;
        throw new Error(errorData.message ?? 'Failed to fetch metadata');
      }

      const data = (await response.json()) as RequestResponseDto;
      metadata = data.metadata;
      selectedFiles = data.filteredFiles.map((f: ModelFileDto) => f.path);
      nonce = data.nonce;
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : 'Failed to fetch metadata';
    } finally {
      loading = false;
    }
  }

  async function approveDownload(): Promise<void> {
    if (!nonce || selectedFiles.length === 0) {
      error = 'Please select at least one file to download';
      return;
    }

    error = null;
    submitting = true;

    try {
      const response = await fetch('/api/models/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nonce,
          requiredCapability
        })
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ErrorResponseDto;
        throw new Error(errorData.message ?? 'Failed to approve download');
      }

      onclose();
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : 'Failed to approve download';
    } finally {
      submitting = false;
    }
  }

  function toggleFile(path: string): void {
    selectedFiles = selectedFiles.includes(path)
      ? selectedFiles.filter((f: string) => f !== path)
      : [...selectedFiles, path];
  }

  function selectAll(): void {
    if (metadata) {
      selectedFiles = metadata.files.map((f: HuggingFaceFileDto) => f.rfilename);
    }
  }

  function deselectAll(): void {
    selectedFiles = [];
  }

  const totalSize = $derived(
    metadata?.files
      .filter((f: HuggingFaceFileDto) => selectedFiles.includes(f.rfilename))
      .reduce((sum: number, f: HuggingFaceFileDto) => sum + (f.sizeBytes ?? 0), 0) ?? 0
  );

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes: ReadonlyArray<string> = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };
</script>

<Modal {open} {onclose} title="Request Model from HuggingFace">
  {#snippet children()}
    <div class="approval-form">
      <TextField
        label="HuggingFace Repository URL"
        bind:value={url}
        type="url"
        placeholder="https://huggingface.co/org/model"
        helper="Enter the URL of the HuggingFace model repository"
        icon="link"
      />

      <div class="fetch-action">
        <Button
          variant="secondary"
          size="lg"
          icon="download"
          disabled={loading || !url.trim()}
          onclick={fetchMetadata}
        >
          {loading ? 'Fetching...' : 'Fetch Metadata'}
        </Button>
      </div>

      {#if error}
        <div class="error-message" role="alert">
          {error}
        </div>
      {/if}

      {#if metadata}
        <div class="metadata-section">
          <div class="metadata-header">
            <h4 class="metadata-title">{metadata.repoId}</h4>
            <div class="metadata-stats">
              <span class="stat">{metadata.files.length} files</span>
              <span class="stat">
                {metadata.isSizeAccurate ? formatBytes(totalSize) : 'Size unknown'} selected
              </span>
            </div>
          </div>

          <div class="file-controls">
            <button type="button" class="control-btn" onclick={selectAll}>Select All</button>
            <button type="button" class="control-btn" onclick={deselectAll}>Deselect All</button>
          </div>

          <fieldset class="file-list" aria-label="Model files">
            {#each metadata.files as file (file.rfilename)}
              <label class="file-item">
                <input
                  type="checkbox"
                  checked={selectedFiles.includes(file.rfilename)}
                  onchange={() => toggleFile(file.rfilename)}
                />
                <div class="file-info">
                  <span class="file-path">{file.rfilename}</span>
                  <span class="file-size">
                    {file.sizeBytes != null ? formatBytes(file.sizeBytes) : '—'}
                  </span>
                </div>
              </label>
            {/each}
          </fieldset>

          <fieldset class="capability-section" aria-label="Required capability">
            <legend class="capability-label">Required Capability</legend>
            <div class="capability-options">
              <label class="capability-option">
                <input
                  type="radio"
                  name="capability"
                  value="inference"
                  bind:group={requiredCapability}
                />
                <span>Inference</span>
              </label>
              <label class="capability-option">
                <input
                  type="radio"
                  name="capability"
                  value="embedding"
                  bind:group={requiredCapability}
                />
                <span>Embedding</span>
              </label>
              <label class="capability-option">
                <input
                  type="radio"
                  name="capability"
                  value="vision"
                  bind:group={requiredCapability}
                />
                <span>Vision</span>
              </label>
            </div>
          </fieldset>
        </div>
      {/if}
    </div>
  {/snippet}

  {#snippet footer()}
    <Button variant="ghost" onclick={onclose}>Cancel</Button>
    <Button
      variant="primary"
      icon="check"
      disabled={!metadata || selectedFiles.length === 0 || submitting}
      onclick={approveDownload}
    >
      {submitting ? 'Approving...' : 'Approve Download'}
    </Button>
  {/snippet}
</Modal>

<style>
  @layer components {
    .approval-form {
      display: flex;
      flex-direction: column;
      gap: var(--space-lg);
    }

    .fetch-action {
      display: flex;
      justify-content: flex-start;
    }

    .error-message {
      padding: var(--space-md);
      background: rgba(255, 59, 78, 0.1);
      border: 1px solid var(--danger);
      border-radius: var(--r-sm);
      color: var(--danger);
      font-size: 13px;
    }

    .metadata-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-md);
      padding: var(--space-lg);
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: var(--r-sm);
    }

    .metadata-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: var(--space-md);
    }

    .metadata-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-1);
      margin: 0;
    }

    .metadata-stats {
      display: flex;
      gap: var(--space-sm);
      flex-shrink: 0;
    }

    .stat {
      font-size: 12px;
      color: var(--text-2);
      padding: 4px 8px;
      background: var(--surface-2);
      border-radius: var(--r-xs);
    }

    .file-controls {
      display: flex;
      gap: var(--space-sm);
    }

    .control-btn {
      padding: 6px 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--accent-2);
      background: transparent;
      border: 1px solid var(--accent-2);
      border-radius: var(--r-sm);
      cursor: pointer;
      transition: all var(--duration-fast) var(--ease);
    }

    .control-btn:hover {
      background: rgba(0, 255, 200, 0.1);
    }

    .file-list {
      display: flex;
      flex-direction: column;
      gap: 2px;
      max-height: 300px;
      overflow-y: auto;
      padding: 4px;
      margin: -4px;
      border: none;
    }

    .file-item {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      padding: var(--space-sm) var(--space-md);
      border-radius: var(--r-xs);
      cursor: pointer;
      transition: background var(--duration-fast) var(--ease);
    }

    .file-item:hover {
      background: var(--surface-2);
    }

    .file-item input[type="checkbox"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
      accent-color: var(--accent);
    }

    .file-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex: 1;
      gap: var(--space-md);
    }

    .file-path {
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--text-1);
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .file-size {
      font-size: 11px;
      color: var(--text-3);
      flex-shrink: 0;
    }

    .capability-section {
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
      border: none;
      padding: 0;
      margin: 0;
    }

    .capability-label {
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--text-2);
    }

    .capability-options {
      display: flex;
      gap: var(--space-md);
    }

    .capability-option {
      display: flex;
      align-items: center;
      gap: var(--space-xs);
      cursor: pointer;
    }

    .capability-option input[type="radio"] {
      width: 16px;
      height: 16px;
      cursor: pointer;
      accent-color: var(--accent);
    }

    .capability-option span {
      font-size: 13px;
      color: var(--text-1);
    }
  }
</style>
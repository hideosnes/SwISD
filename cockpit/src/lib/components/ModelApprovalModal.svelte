<!--
1. Relative path: cockpit/src/lib/components/ModelApprovalModal.svelte
2. Description: Modal dialog for requesting and approving HuggingFace model downloads with offline degradation.
3. Expects: Open state, onclose callback, and optional initial URL.
4. Provides: A gated approval flow with metadata preview, capability selection, and risk acknowledgment.
5. SPDX-License-Identifier: MPL-2.0
6. Copyright (c) 2026 Homahuki GmbH
-->

<script lang="ts">
  import { Modal, Button, TextField, StatusPill } from '$lib/components/ui';

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
    readonly degraded: boolean;
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

  let url = $state('');
  let metadata = $state<HuggingFaceMetadataDto | null>(null);
  let selectedFiles = $state<ReadonlyArray<string>>([]);
  let requiredCapability = $state<Capability>('inference');
  let nonce = $state<string | null>(null);
  
  let degraded = $state(false);
  let riskAcknowledged = $state(false);

  let loading = $state(false);
  let error = $state<string | null>(null);
  let submitting = $state(false);

  $effect(() => {
    if (open) {
      url = initialUrl;
    }
  });

  $effect(() => {
    if (!open) {
      url = '';
      metadata = null;
      selectedFiles = [];
      requiredCapability = 'inference';
      nonce = null;
      degraded = false;
      riskAcknowledged = false;
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
        body: JSON.stringify({ url: url.trim(), selectedFiles: [] })
      });

      if (!response.ok) {
        const errorData = (await response.json()) as ErrorResponseDto;
        throw new Error(errorData.message ?? 'Failed to fetch metadata');
      }

      const data = (await response.json()) as RequestResponseDto;
      metadata = data.metadata;
      selectedFiles = data.filteredFiles.map((f: ModelFileDto) => f.path);
      nonce = data.nonce;
      degraded = data.degraded;
      
      if (degraded) {
        error = 'Size unknown — metadata unavailable. HuggingFace API could not be reached.';
      }
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : 'Failed to fetch metadata';
    } finally {
      loading = false;
    }
  }

  async function approveDownload(): Promise<void> {
    if (!nonce) {
      error = 'Missing approval nonce';
      return;
    }
    if (!degraded && selectedFiles.length === 0) {
      error = 'Please select at least one file to download';
      return;
    }
    if (degraded && !riskAcknowledged) {
      error = 'You must acknowledge the risk to proceed';
      return;
    }

    error = null;
    submitting = true;

    try {
      const response = await fetch('/api/models/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nonce, requiredCapability })
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
    const sizes: ReadonlyArray<string> = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / (k ** i)).toFixed(2)} ${sizes[i]}`;
  };

  const canApprove = $derived(
    !submitting && 
    nonce !== null && 
    (
      (!degraded && metadata !== null && selectedFiles.length > 0) || 
      (degraded && riskAcknowledged)
    )
  );
</script>

<Modal {open} {onclose} title="Request Model from HuggingFace">
  <div class="flex flex-col gap-6">
    <TextField
      label="HuggingFace Repository URL"
      bind:value={url}
      type="url"
      placeholder="https://huggingface.co/org/model"
      helper="Enter the URL of the HuggingFace model repository"
      icon="link"
    />

    <div class="flex justify-start">
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
      <div class="p-4 bg-[rgba(255,59,78,0.1)] border border-[var(--danger)] rounded-sm text-[var(--danger)] text-sm" role="alert">
        {error}
      </div>
    {/if}

    {#if degraded && metadata}
      <div class="p-4 bg-[var(--surface-2)] border border-[var(--warn)] rounded-sm flex flex-col gap-3" role="alert">
        <div class="flex items-center gap-2">
          <StatusPill status="warn" label="Offline Mode" />
          <span class="text-sm font-bold text-text-1">Size unknown — metadata unavailable</span>
        </div>
        <p class="text-sm text-text-2">
          The HuggingFace API could not be reached. Proceeding will attempt to download the repository blindly. 
          This may fail if the repo is private, gated, or requires a valid token.
        </p>
        <label class="flex items-center gap-3 cursor-pointer mt-2">
          <input 
            type="checkbox" 
            bind:checked={riskAcknowledged}
            class="w-4 h-4 accent-[var(--accent)] cursor-pointer"
          />
          <span class="text-sm font-medium text-text-1">I acknowledge the risk and want to proceed anyway.</span>
        </label>
      </div>
    {:else if metadata && !degraded}
      <div class="flex flex-col gap-4 p-6 bg-[var(--bg)] border border-[var(--border)] rounded-sm">
        <div class="flex justify-between items-start gap-4">
          <h4 class="text-base font-semibold text-text-1 m-0">{metadata.repoId}</h4>
          <div class="flex gap-2 shrink-0">
            <span class="text-xs text-text-2 px-2 py-1 bg-[var(--surface-2)] rounded-xs">{metadata.files.length} files</span>
            <span class="text-xs text-text-2 px-2 py-1 bg-[var(--surface-2)] rounded-xs">
              {metadata.isSizeAccurate ? formatBytes(totalSize) : 'Size unknown'} selected
            </span>
          </div>
        </div>

        <div class="flex gap-2">
          <button type="button" class="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-2)] bg-transparent border border-[var(--accent-2)] rounded-sm cursor-pointer hover:bg-[rgba(0,255,200,0.1)] transition-colors" onclick={selectAll}>Select All</button>
          <button type="button" class="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-2)] bg-transparent border border-[var(--accent-2)] rounded-sm cursor-pointer hover:bg-[rgba(0,255,200,0.1)] transition-colors" onclick={deselectAll}>Deselect All</button>
        </div>

        <fieldset class="flex flex-col gap-1 max-h-[300px] overflow-y-auto p-1 -m-1 border-0" aria-label="Model files">
          {#each metadata.files as file (file.rfilename)}
            <label class="flex items-center gap-4 px-3 py-2 rounded-xs cursor-pointer hover:bg-[var(--surface-2)] transition-colors">
              <input
                type="checkbox"
                checked={selectedFiles.includes(file.rfilename)}
                onchange={() => toggleFile(file.rfilename)}
                class="w-4 h-4 cursor-pointer accent-[var(--accent)]"
              />
              <div class="flex justify-between items-center flex-1 gap-4">
                <span class="font-mono text-xs text-text-1 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{file.rfilename}</span>
                <span class="text-[11px] text-text-3 shrink-0">
                  {file.sizeBytes != null ? formatBytes(file.sizeBytes) : '—'}
                </span>
              </div>
            </label>
          {/each}
        </fieldset>

        <fieldset class="flex flex-col gap-2 border-0 p-0 m-0" aria-label="Required capability">
          <legend class="text-[11px] font-semibold tracking-widest uppercase text-text-2">Required Capability</legend>
          <div class="flex gap-4">
            {#each ['inference', 'embedding', 'vision'] as cap (cap)}
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="capability"
                  value={cap}
                  bind:group={requiredCapability}
                  class="w-4 h-4 cursor-pointer accent-[var(--accent)]"
                />
                <span class="text-sm text-text-1 capitalize">{cap}</span>
              </label>
            {/each}
          </div>
        </fieldset>
      </div>
    {/if}
  </div>

  {#snippet footer()}
    <Button variant="ghost" onclick={onclose}>Cancel</Button>
    <Button
      variant="primary"
      icon="check"
      disabled={!canApprove}
      onclick={approveDownload}
    >
      {submitting ? 'Approving...' : (degraded ? 'Acknowledge & Download' : 'Approve Download')}
    </Button>
  {/snippet}
</Modal>
<!--
1. Relative path: cockpit/src/lib/components/ModelApprovalModal.svelte
2. Description: Modal dialog for requesting and approving HuggingFace model downloads.
3. Expects: Open state, onclose callback, onapproved callback, and optional initial URL.
4. Provides: A gated approval flow with metadata preview and optimistic UI handoff.
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

  interface RequestResponseDto {
    readonly metadata: HuggingFaceMetadataDto;
    readonly filteredFiles: ReadonlyArray<{ path: string; sizeBytes: number; isRequired: boolean }>;
    readonly nonce: string;
    readonly degraded: boolean;
  }

  interface ErrorResponseDto {
    readonly message?: string;
  }

  export interface OptimisticDownload {
    readonly modelId: string;
    readonly repoId: string;
    readonly totalSizeBytes: number;
    readonly requiredCapability: string;
  }

  type Capability = 'inference' | 'embedding' | 'vision';

  interface Props {
    open: boolean;
    onclose: () => void;
    onapproved: (model: OptimisticDownload) => void;
    initialUrl?: string;
  }

  let { open, onclose, onapproved, initialUrl = '' }: Props = $props();

  let url = $state('');
  let metadata = $state<HuggingFaceMetadataDto | null>(null);
  let selectedVariants = $state<ReadonlyArray<string>>([]);
  let requiredCapability = $state<Capability>('inference');
  let nonce = $state<string | null>(null);
  let degraded = $state(false);
  let riskAcknowledged = $state(false);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let submitting = $state(false);

  interface ModelVariant {
    readonly name: string;
    readonly description: string;
    readonly recommended: boolean;
    readonly files: ReadonlyArray<HuggingFaceFileDto>;
    readonly totalSizeBytes: number;
  }

  let variants = $state<ReadonlyArray<ModelVariant>>([]);
  let supportingFiles = $state<ReadonlyArray<HuggingFaceFileDto>>([]);

  const SUPPORTING_FILE_PATTERNS = [
    /^config\.json$/i, /^generation_config\.json$/i, /^tokenizer\.json$/i, /^tokenizer_config\.json$/i,
    /^special_tokens_map\.json$/i, /^added_tokens\.json$/i, /^merges\.txt$/i, /^vocab\.json$/i,
    /^\.gitattributes$/i, /^README\.md$/i
  ];

  const KNOWN_QUANTS = [
    'IQ1_S', 'IQ1_M', 'IQ2_XXS', 'IQ2_XS', 'IQ2_S', 'IQ2_M', 'Q2_K',
    'IQ3_XXS', 'IQ3_XS', 'IQ3_S', 'IQ3_M', 'Q3_K_S', 'Q3_K_M', 'Q3_K_L',
    'IQ4_XS', 'IQ4_NL', 'Q4_K_S', 'Q4_K_M', 'Q4_K_L', 'Q4_0', 'Q4_1',
    'Q5_K_S', 'Q5_K_M', 'Q5_K_L', 'Q5_0', 'Q5_1',
    'Q6_K', 'Q8_0', 'F16', 'BF16', 'F32'
  ];

  function getQuantDescription(quant: string): { desc: string; recommended: boolean } {
    if (quant.includes('Q4')) return { desc: 'Best balance of speed, size, and quality.', recommended: quant === 'Q4_K_M' || quant === 'Q4_K_S' };
    if (quant.includes('Q5')) return { desc: 'Near-lossless quality. Slightly larger.', recommended: quant === 'Q5_K_M' };
    if (quant.includes('Q3') || quant.includes('IQ3') || quant.includes('IQ2') || quant.includes('Q2')) return { desc: 'High compression. Noticeable quality loss.', recommended: false };
    if (quant.includes('Q6')) return { desc: 'Excellent quality. Marginal gains over Q5.', recommended: false };
    if (quant.includes('Q8') || quant.includes('F16') || quant.includes('BF16') || quant.includes('F32')) return { desc: 'Near-original quality. Maximum resources.', recommended: false };
    if (quant.includes('IQ4')) return { desc: 'Advanced 4-bit. Excellent ratio.', recommended: true };
    return { desc: 'Standard variant.', recommended: false };
  }

  function categorizeFiles(files: ReadonlyArray<HuggingFaceFileDto>): void {
    const suppFiles: HuggingFaceFileDto[] = [];
    const variantMap: Record<string, HuggingFaceFileDto[]> = {};

    for (const file of files) {
      const isSupporting = SUPPORTING_FILE_PATTERNS.some(pattern => pattern.test(file.rfilename));
      if (isSupporting) { suppFiles.push(file); continue; }

      if (file.rfilename.toLowerCase().endsWith('.gguf')) {
        let variantName = 'Default';
        for (const q of KNOWN_QUANTS) {
          if (file.rfilename.includes(q)) { variantName = q; break; }
        }
        let bucket = variantMap[variantName];
        if (!bucket) { bucket = []; variantMap[variantName] = bucket; }
        bucket.push(file);
      }
    }

    const parsedVariants = Object.entries(variantMap).map(([name, files]) => {
      const totalSize = files.reduce((sum, f) => sum + (f.sizeBytes ?? 0), 0);
      const { desc, recommended } = getQuantDescription(name);
      return { name, files, totalSizeBytes: totalSize, description: desc, recommended };
    });

    parsedVariants.sort((a, b) => {
      if (a.recommended && !b.recommended) return -1;
      if (!a.recommended && b.recommended) return 1;
      return a.name.localeCompare(b.name);
    });

    variants = parsedVariants;
    supportingFiles = suppFiles;
    
    const recommended = parsedVariants.find(v => v.recommended);
    if (recommended) selectedVariants = [recommended.name];
  }

  $effect(() => { if (open) url = initialUrl; });

  $effect(() => {
    if (!open) {
      url = ''; metadata = null; selectedVariants = []; variants = []; supportingFiles = [];
      requiredCapability = 'inference'; nonce = null; degraded = false; riskAcknowledged = false;
      error = null; loading = false; submitting = false;
    }
  });

  const selectedFilesWithSize = $derived.by(() => {
    if (selectedVariants.length === 0) return [];
    const files: { path: string; sizeBytes: number }[] = [];
    for (const f of supportingFiles) {
      if (!files.find(x => x.path === f.rfilename)) files.push({ path: f.rfilename, sizeBytes: f.sizeBytes ?? 0 });
    }
    for (const variantName of selectedVariants) {
      const variant = variants.find(v => v.name === variantName);
      if (variant) {
        for (const f of variant.files) {
          if (!files.find(x => x.path === f.rfilename)) files.push({ path: f.rfilename, sizeBytes: f.sizeBytes ?? 0 });
        }
      }
    }
    return files;
  });

  const totalSelectedSize = $derived(selectedFilesWithSize.reduce((sum, f) => sum + f.sizeBytes, 0));

  async function fetchMetadata(): Promise<void> {
    if (!url.trim()) { error = 'Please enter a HuggingFace URL'; return; }
    error = null; loading = true;
    try {
      const response = await fetch('/api/models/request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), selectedFiles: [] })
      });
      if (!response.ok) {
        const errorData = (await response.json()) as ErrorResponseDto;
        throw new Error(errorData.message ?? 'Failed to fetch metadata');
      }
      const data = (await response.json()) as RequestResponseDto;
      metadata = data.metadata; nonce = data.nonce; degraded = data.degraded;
      categorizeFiles(data.metadata.files);
      if (degraded) error = 'Size unknown — metadata unavailable.';
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : 'Failed to fetch metadata';
    } finally { loading = false; }
  }

  async function approveDownload(): Promise<void> {
    if (!nonce) { error = 'Missing approval nonce'; return; }
    if (!degraded && selectedFilesWithSize.length === 0) { error = 'Please select at least one variant'; return; }
    if (degraded && !riskAcknowledged) { error = 'You must acknowledge the risk'; return; }
    error = null; submitting = true;
    try {
      const response = await fetch('/api/models/approve', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nonce, requiredCapability, selectedFiles: selectedFilesWithSize })
      });
      if (!response.ok) {
        const errorData = (await response.json()) as ErrorResponseDto;
        throw new Error(errorData.message ?? 'Failed to approve');
      }
      
      const data = (await response.json()) as { status: string; model: OptimisticDownload };
      onapproved(data.model);
      onclose();
    } catch (err: unknown) {
      error = err instanceof Error ? err.message : 'Failed to approve';
    } finally { submitting = false; }
  }

  function toggleVariant(name: string): void {
    selectedVariants = selectedVariants.includes(name)
      ? selectedVariants.filter(v => v !== name)
      : [...selectedVariants, name];
  }

  function selectAll(): void { selectedVariants = variants.map(v => v.name); }
  function deselectAll(): void { selectedVariants = []; }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes: ReadonlyArray<string> = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / (k ** i)).toFixed(2)} ${sizes[i]}`;
  };

  const canApprove = $derived(
    !submitting && nonce !== null &&
    ((!degraded && selectedFilesWithSize.length > 0) || (degraded && riskAcknowledged))
  );
</script>

<Modal {open} {onclose} title="Request Model from HuggingFace">
  <div class="flex flex-col gap-6">
    <TextField label="HuggingFace Repository URL" bind:value={url} type="url" placeholder="https://huggingface.co/org/model" helper="Enter the URL of the HuggingFace model repository" icon="link" />
    
    <div class="flex justify-start">
      <Button variant="secondary" size="lg" icon="download" disabled={loading || !url.trim()} onclick={fetchMetadata}>
        {loading ? 'Fetching...' : 'Fetch Metadata'}
      </Button>
    </div>

    {#if error}
      <div class="p-4 bg-[rgba(255,59,78,0.1)] border border-[var(--danger)] rounded-sm text-[var(--danger)] text-sm" role="alert">{error}</div>
    {/if}

    {#if degraded && metadata}
      <div class="p-4 bg-[var(--surface-2)] border border-[var(--warn)] rounded-sm flex flex-col gap-3" role="alert">
        <div class="flex items-center gap-2">
          <StatusPill status="warn" label="Offline Mode" />
          <span class="text-sm font-bold text-text-1">Size unknown</span>
        </div>
        <p class="text-sm text-text-2">The HuggingFace API could not be reached. Proceeding will attempt to download blindly.</p>
        <label class="flex items-center gap-3 cursor-pointer mt-2">
          <input type="checkbox" bind:checked={riskAcknowledged} class="w-4 h-4 accent-[var(--accent)] cursor-pointer" />
          <span class="text-sm font-medium text-text-1">I acknowledge the risk.</span>
        </label>
      </div>
    {:else if metadata && !degraded}
      <div class="flex flex-col gap-4 p-6 bg-[var(--bg)] border border-[var(--border)] rounded-sm">
        <div class="flex justify-between items-start gap-4">
          <h4 class="text-base font-semibold text-text-1 m-0">{metadata.repoId}</h4>
          <div class="flex gap-2 shrink-0">
            <span class="text-xs text-text-2 px-2 py-1 bg-[var(--surface-2)] rounded-xs">{variants.length} variants</span>
            <span class="text-xs text-text-2 px-2 py-1 bg-[var(--surface-2)] rounded-xs">{metadata.isSizeAccurate ? formatBytes(totalSelectedSize) : 'Size unknown'} selected</span>
          </div>
        </div>

        <div class="flex gap-2">
          <button type="button" class="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-2)] bg-transparent border border-[var(--accent-2)] rounded-sm cursor-pointer hover:bg-[rgba(0,255,200,0.1)] transition-colors" onclick={selectAll}>Select All</button>
          <button type="button" class="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--accent-2)] bg-transparent border border-[var(--accent-2)] rounded-sm cursor-pointer hover:bg-[rgba(0,255,200,0.1)] transition-colors" onclick={deselectAll}>Deselect All</button>
        </div>

        {#if variants.length === 0}
          <div class="p-4 text-sm text-text-2 text-center border border-dashed border-[var(--border)] rounded-sm">No GGUF model files found.</div>
        {:else}
          <div class="flex flex-col gap-2 max-h-[300px] overflow-y-auto p-1 -m-1" role="group" aria-label="Model variants">
            {#each variants as variant (variant.name)}
              <label class="flex items-start gap-4 px-4 py-3 rounded-xs cursor-pointer hover:bg-[var(--surface-2)] transition-colors border border-transparent hover:border-[var(--border)]">
                <input type="checkbox" checked={selectedVariants.includes(variant.name)} onchange={() => toggleVariant(variant.name)} class="w-4 h-4 mt-1 cursor-pointer accent-[var(--accent)]" />
                <div class="flex flex-col flex-1 gap-1">
                  <div class="flex justify-between items-center">
                    <span class="font-mono text-sm font-semibold text-text-1">{variant.name}</span>
                    {#if variant.recommended}<StatusPill status="accent" label="Recommended" />{/if}
                  </div>
                  <p class="text-xs text-text-2">{variant.description}</p>
                  <div class="flex items-center gap-3 text-[11px] text-text-3">
                    <span>{variant.files.length} file{variant.files.length > 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span>{formatBytes(variant.totalSizeBytes)}</span>
                  </div>
                </div>
              </label>
            {/each}
          </div>
          <div class="pt-2 border-t border-[var(--border)]">
            <p class="text-xs text-text-3 flex items-center gap-2">
              <span class="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"></span>
              Selecting a variant automatically includes all required supporting files.
            </p>
          </div>
        {/if}

        <fieldset class="flex flex-col gap-2 border-0 p-0 m-0 pt-2" aria-label="Required capability">
          <legend class="text-[11px] font-semibold tracking-widest uppercase text-text-2">Required Capability</legend>
          <div class="flex gap-4">
            {#each ['inference', 'embedding', 'vision'] as cap (cap)}
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="capability" value={cap} bind:group={requiredCapability} class="w-4 h-4 cursor-pointer accent-[var(--accent)]" />
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
    <Button variant="primary" icon="check" disabled={!canApprove} onclick={approveDownload}>
      {submitting ? 'Approving...' : (degraded ? 'Acknowledge & Download' : 'Approve Download')}
    </Button>
  {/snippet}
</Modal>
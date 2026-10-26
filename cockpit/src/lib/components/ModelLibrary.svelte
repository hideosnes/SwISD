<!--
1. Relative path: cockpit/src/lib/components/ModelLibrary.svelte
2. Description: Unified model library with optimistic UI, SSE telemetry, and repair capability.
3. Expects: Optimistic downloads array and removal callback.
4. Provides: A seamless, real-time view of model distribution states with repair and delete actions.
5. SPDX-License-Identifier: MPL-2.0
6. Copyright (c) 2026 Homahuki GmbH
-->

<script lang="ts">
	import { onMount } from 'svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import { Button, StatusPill, ProgressBar, Modal } from '$lib/components/ui';
	import type { OptimisticDownload } from './ModelApprovalModal.svelte';

	interface DownloadProgress {
		readonly modelId: string;
		readonly repoId: string;
		readonly storagePath: string;
		readonly bytesDownloaded: number;
		readonly totalBytes: number;
		readonly throughputBytesPerSec: number;
		readonly status: 'downloading' | 'chunking' | 'completed' | 'failed';
		readonly error?: string;
	}

	interface LibraryItem {
		readonly modelId: string;
		readonly repoId: string;
		readonly displayName?: string;
		readonly pipelineTag?: string | null;
		readonly tags?: ReadonlyArray<string>;
		readonly requiredCapability: string;
		readonly totalSizeBytes: number;
		readonly createdAt?: number;
		readonly healthStatus:
			'verified' | 'missing_chunks' | 'not_found' | 'downloading' | 'chunking' | 'failed';
		readonly bytesDownloaded?: number;
		readonly throughputBytesPerSec?: number;
		readonly error?: string;
		readonly isRepairable?: boolean;
		readonly sourcePeerId?: string;
		readonly storagePath?: string;
	}

	interface Props {
		optimisticDownloads: ReadonlyArray<OptimisticDownload>;
		onremoveoptimistic: (modelId: string) => void;
	}

	let { optimisticDownloads, onremoveoptimistic }: Props = $props();

	let library = $state<LibraryItem[]>([]);
	let activeDownloads = $state<Record<string, DownloadProgress>>({});
	let eventSource = $state<EventSource | null>(null);
	let expandedModelId = $state<string | null>(null);
	let editName = $state('');

	let modelToDelete = $state<LibraryItem | null>(null);
	let deleteError = $state<string | null>(null);

	// Terminal SSE states (completed/failed) are re-broadcast by the 500ms telemetry
	// poll until the server evicts them; each one must trigger at most one library
	// refetch. Re-armed on any non-terminal event (e.g. a resumed/repair download).
	const terminalHandled = new SvelteSet<string>();
	let libraryFetchInFlight = false;

	async function fetchLibrary() {
		if (libraryFetchInFlight) return;
		libraryFetchInFlight = true;
		try {
			const res = await fetch('/api/models/library');
			if (res.ok) {
				const data = await res.json();
				library = data.models || [];
			}
		} catch {
			// Silent fail for library fetch to avoid UI spam, errors are handled by fallback states
		} finally {
			libraryFetchInFlight = false;
		}
	}

	function connectSSE() {
		if (eventSource) return;

		try {
			eventSource = new EventSource('/api/models/status');

			eventSource.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data) as DownloadProgress | { status: string };
					if ('modelId' in data) {
						if (data.status === 'completed' || data.status === 'failed') {
							if (terminalHandled.has(data.modelId)) return;
							terminalHandled.add(data.modelId);
							const rest = { ...activeDownloads };
							delete rest[data.modelId];
							activeDownloads = rest;
							onremoveoptimistic(data.modelId);
							fetchLibrary();
						} else {
							terminalHandled.delete(data.modelId);
							activeDownloads = { ...activeDownloads, [data.modelId]: data };
							onremoveoptimistic(data.modelId);
						}
					}
				} catch {
					// Ignore malformed JSON payloads from the stream
				}
			};

			eventSource.onerror = () => {
				// EventSource automatically attempts to reconnect natively.
				// We do not nullify it here to allow the browser's reconnection logic to work.
			};
		} catch {
			// Silent fail if EventSource creation fails
		}
	}

	onMount(() => {
		fetchLibrary();
		connectSSE();

		return () => {
			if (eventSource) {
				eventSource.close();
				eventSource = null;
			}
		};
	});

	async function repairModel(modelId: string) {
		try {
			const res = await fetch(`/api/models/${modelId}/repair`, { method: 'POST' });
			if (res.ok) {
				library = library.map((m) =>
					m.modelId === modelId
						? {
								...m,
								healthStatus: 'downloading' as const,
								bytesDownloaded: 0,
								throughputBytesPerSec: 0,
								error: undefined
							}
						: m
				);
			}
		} catch {
			// Silent fail
		}
	}

	function requestDelete(model: LibraryItem) {
		modelToDelete = model;
		deleteError = null;
	}

	function cancelDelete() {
		modelToDelete = null;
		deleteError = null;
	}

	async function confirmDelete() {
		const target = modelToDelete;
		if (!target) return;

		deleteError = null;
		try {
			const res = await fetch(`/api/models/${target.modelId}`, { method: 'DELETE' });
			if (res.ok) {
				library = library.filter((m) => m.modelId !== target.modelId);
				if (expandedModelId === target.modelId) {
					cancelEdit();
				}
				cancelDelete();
			} else {
				const errData = await res.json().catch(() => ({}));
				deleteError = errData.message || 'Failed to delete model';
			}
		} catch {
			deleteError = 'Failed to delete model';
		}
	}

	const mergedLibrary = $derived.by(() => {
		const map: Record<string, LibraryItem> = {};

		for (const m of library) {
			map[m.modelId] = { ...m, healthStatus: m.healthStatus as LibraryItem['healthStatus'] };
		}

		for (const [modelId, dl] of Object.entries(activeDownloads)) {
			const mappedStatus = dl.status === 'completed' ? 'verified' : dl.status;

			const existing = map[modelId];
			if (existing) {
				map[modelId] = {
					...existing,
					healthStatus: mappedStatus,
					bytesDownloaded: dl.bytesDownloaded,
					throughputBytesPerSec: dl.throughputBytesPerSec,
					totalSizeBytes: dl.totalBytes > 0 ? dl.totalBytes : existing.totalSizeBytes,
					storagePath: dl.storagePath || existing.storagePath,
					error: dl.error
				};
			} else {
				map[modelId] = {
					modelId,
					repoId: dl.repoId,
					requiredCapability: 'unknown',
					totalSizeBytes: dl.totalBytes,
					healthStatus: mappedStatus,
					bytesDownloaded: dl.bytesDownloaded,
					throughputBytesPerSec: dl.throughputBytesPerSec,
					storagePath: dl.storagePath,
					error: dl.error
				};
			}
		}

		for (const opt of optimisticDownloads) {
			if (!map[opt.modelId]) {
				const isActive = Object.keys(activeDownloads).includes(opt.modelId);
				map[opt.modelId] = {
					modelId: opt.modelId,
					repoId: opt.repoId,
					requiredCapability: opt.requiredCapability,
					totalSizeBytes: opt.totalSizeBytes,
					healthStatus: 'downloading',
					bytesDownloaded: 0,
					throughputBytesPerSec: 0,
					storagePath: isActive ? undefined : 'Connecting to telemetry stream...'
				};
			}
		}

		return Object.values(map).sort((a, b) => {
			const aDown = a.healthStatus === 'downloading' || a.healthStatus === 'chunking';
			const bDown = b.healthStatus === 'downloading' || b.healthStatus === 'chunking';
			if (aDown && !bDown) return -1;
			if (!aDown && bDown) return 1;
			return (b.createdAt ?? 0) - (a.createdAt ?? 0);
		});
	});

	function startEdit(model: LibraryItem) {
		expandedModelId = model.modelId;
		editName = model.displayName || model.repoId;
	}

	function cancelEdit() {
		expandedModelId = null;
		editName = '';
	}

	async function saveEdit(model: LibraryItem) {
		try {
			const res = await fetch('/api/models/rename', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ modelId: model.modelId, displayName: editName.trim() || undefined })
			});
			if (res.ok) {
				library = library.map((m) =>
					m.modelId === model.modelId ? { ...m, displayName: editName.trim() || undefined } : m
				);
				cancelEdit();
			}
		} catch {
			// Silent fail
		}
	}

	const formatSize = (bytes: number): string => {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${(bytes / k ** i).toFixed(2)} ${sizes[i]}`;
	};

	const formatThroughput = (bytesPerSec: number): string => `${formatSize(bytesPerSec)}/s`;

	const calculateProgress = (item: LibraryItem): number => {
		if (!item.totalSizeBytes || item.totalSizeBytes <= 0) return 0;
		return Math.min(100, ((item.bytesDownloaded ?? 0) / item.totalSizeBytes) * 100);
	};

	const formatProgressLabel = (item: LibraryItem): string => {
		if (!item.totalSizeBytes || item.totalSizeBytes <= 0) return '...';
		return `${Math.round(calculateProgress(item))}%`;
	};

	const getHealthStatus = (
		health: string
	): { label: string; status: 'live' | 'warn' | 'accent' | 'idle' } => {
		if (health === 'verified') return { label: 'Verified', status: 'live' };
		if (health === 'missing_chunks' || health === 'failed')
			return { label: health === 'failed' ? 'Failed' : 'Missing Chunks', status: 'warn' };
		if (health === 'downloading' || health === 'chunking')
			return { label: health === 'chunking' ? 'Chunking' : 'Downloading', status: 'warn' };
		return { label: 'Not Found', status: 'idle' };
	};
</script>

<div class="flex flex-col gap-3">
	<h3 class="text-xs font-semibold tracking-widest text-text-2 uppercase">Model Library</h3>

	{#if mergedLibrary.length === 0}
		<div class="rounded-sm border border-dashed border-[var(--border)] p-8 text-center text-text-2">
			<p class="text-sm">No models found. Fetch a model from HuggingFace or upload a local file.</p>
		</div>
	{:else}
		{#each mergedLibrary as item (item.modelId)}
			{@const health = getHealthStatus(item.healthStatus)}
			{@const isDownloading =
				item.healthStatus === 'downloading' || item.healthStatus === 'chunking'}
			{@const isFailed = item.healthStatus === 'failed' || item.healthStatus === 'missing_chunks'}

			<div
				class="overflow-hidden rounded-sm border border-[var(--border)] bg-[var(--bg)] transition-colors"
			>
				<div
					class="flex w-full items-center justify-between p-4 {isDownloading || isFailed
						? 'bg-[var(--surface-2)]'
						: 'hover:bg-[var(--surface-2)]'} text-left transition-colors"
				>
					<div class="flex min-w-0 flex-1 items-center gap-3">
						<h4 class="truncate font-mono text-sm font-semibold text-text-1">
							{item.displayName || item.repoId}
						</h4>
						{#if item.displayName && !isDownloading && !isFailed}
							<span class="truncate font-mono text-xs text-text-3">({item.repoId})</span>
						{/if}
					</div>
					<div class="flex shrink-0 items-center gap-3">
						{#if isDownloading}
							<span class="hidden font-mono text-xs text-text-2 tabular-nums sm:inline">
								{formatProgressLabel(item)} • {formatThroughput(item.throughputBytesPerSec ?? 0)}
							</span>
							<StatusPill status={health.status} label={health.label} />
						{:else}
							<StatusPill status={health.status} label={health.label} />
							<button
								class="rounded-xs p-1 transition-colors hover:bg-[var(--surface-2)]"
								onclick={() => (expandedModelId === item.modelId ? cancelEdit() : startEdit(item))}
								aria-expanded={expandedModelId === item.modelId}
								aria-label="Expand model details"
							>
								<svg
									class="h-4 w-4 text-text-3 transition-transform duration-200 {expandedModelId ===
									item.modelId
										? 'rotate-180'
										: ''}"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							</button>
						{/if}
					</div>
				</div>

				{#if isDownloading}
					<div class="bg-[var(--surface-2)] px-4 pb-4">
						<div class="flex items-center gap-3">
							<ProgressBar class="flex-1" value={calculateProgress(item)} />
						</div>
						<p class="mt-1 text-xs text-text-3">
							{formatSize(item.bytesDownloaded ?? 0)} / {item.totalSizeBytes > 0
								? formatSize(item.totalSizeBytes)
								: 'Calculating total size...'}
						</p>
						{#if item.storagePath}
							<p class="mt-1 truncate font-mono text-[10px] text-text-3" title={item.storagePath}>
								{item.storagePath.startsWith('Connecting')
									? item.storagePath
									: `Storing: ${item.storagePath}`}
							</p>
						{/if}
						{#if item.error}
							<p class="mt-2 text-xs text-[var(--danger)]">{item.error}</p>
						{/if}
					</div>
				{:else if expandedModelId === item.modelId}
					<div
						class="flex flex-col gap-4 border-t border-[var(--border)] bg-[var(--surface-2)] p-4"
					>
						<div class="flex flex-col gap-2">
							<label
								for="edit-name-{item.modelId}"
								class="text-[11px] font-semibold tracking-widest text-text-2 uppercase"
								>Display Name</label
							>
							<div class="flex items-center gap-2">
								<input
									id="edit-name-{item.modelId}"
									type="text"
									bind:value={editName}
									class="flex-1 rounded-xs border border-[var(--border)] bg-[var(--bg)] px-3 py-2 font-mono text-sm text-text-1 focus:border-[var(--accent)] focus:outline-none"
									placeholder={item.repoId}
									onkeydown={(e: KeyboardEvent) => {
										if (e.key === 'Enter') saveEdit(item);
										if (e.key === 'Escape') cancelEdit();
									}}
								/>
								<Button variant="primary" size="sm" onclick={() => saveEdit(item)}>Save</Button>
								<Button variant="ghost" size="sm" onclick={cancelEdit}>Cancel</Button>
							</div>
						</div>

						{#if item.storagePath && !item.storagePath.startsWith('Connecting')}
							<div class="rounded-xs border border-[var(--border)] bg-[var(--bg)] p-3">
								<p class="text-[10px] text-text-3 uppercase">Storage Path</p>
								<p class="truncate font-mono text-xs text-text-1" title={item.storagePath}>
									{item.storagePath}
								</p>
							</div>
						{/if}

						{#if item.sourcePeerId}
							<div class="rounded-xs border border-[var(--border)] bg-[var(--bg)] p-3">
								<p class="text-[10px] text-text-3 uppercase">Source Node</p>
								<p class="truncate font-mono text-xs text-text-1">{item.sourcePeerId}</p>
							</div>
						{/if}

						<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
							<div class="rounded-xs border border-[var(--border)] bg-[var(--bg)] p-3">
								<p class="text-[10px] text-text-3 uppercase">Size</p>
								<p class="font-mono text-sm text-text-1">{formatSize(item.totalSizeBytes)}</p>
							</div>
							<div class="rounded-xs border border-[var(--border)] bg-[var(--bg)] p-3">
								<p class="text-[10px] text-text-3 uppercase">Capability</p>
								<p class="font-mono text-sm text-text-1 capitalize">{item.requiredCapability}</p>
							</div>
							<div class="col-span-2 rounded-xs border border-[var(--border)] bg-[var(--bg)] p-3">
								<p class="text-[10px] text-text-3 uppercase">Modalities & Tags</p>
								<div class="mt-1 flex flex-wrap gap-2">
									{#if item.pipelineTag}
										<span
											class="rounded-xs border border-[var(--border)] bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] tracking-wider text-text-2 uppercase"
										>
											{item.pipelineTag}
										</span>
									{/if}
									{#each (item.tags || []).slice(0, 5) as tag (tag)}
										<span
											class="rounded-xs border border-[var(--border)] bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] text-text-3"
										>
											{tag}
										</span>
									{/each}
								</div>
							</div>
						</div>

						<div class="flex justify-end gap-2 border-t border-[var(--border)] pt-2">
							{#if item.isRepairable}
								<Button
									variant="secondary"
									size="sm"
									icon="build"
									onclick={() => repairModel(item.modelId)}>Repair</Button
								>
							{/if}
							<Button variant="danger" size="sm" icon="delete" onclick={() => requestDelete(item)}
								>Delete Model</Button
							>
						</div>
					</div>
				{/if}
			</div>
		{/each}
	{/if}
</div>

<Modal open={modelToDelete !== null} onclose={cancelDelete} title="Confirm Deletion">
	<div class="flex flex-col gap-3">
		<p class="text-sm text-text-2">
			Are you sure you want to delete <span class="font-mono font-semibold text-text-1"
				>{modelToDelete?.displayName || modelToDelete?.repoId}</span
			>? This will permanently remove the model files from disk and cannot be undone.
		</p>
		{#if deleteError}
			<p
				class="rounded-sm border border-[var(--danger)] bg-[rgba(255,59,78,0.1)] p-3 text-xs text-[var(--danger)]"
				role="alert"
			>
				{deleteError}
			</p>
		{/if}
	</div>
	{#snippet footer()}
		<Button variant="ghost" onclick={cancelDelete}>Cancel</Button>
		<Button variant="danger" icon="delete" onclick={confirmDelete}>Delete Permanently</Button>
	{/snippet}
</Modal>

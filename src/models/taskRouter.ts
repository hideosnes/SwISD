// src/models/taskRouter.ts
import type { Libp2p } from 'libp2p'
import type { PubSub } from '@libp2p/interface-pubsub'
import type { Stream, Connection } from '@libp2p/interface'
import { RoleAssignmentManager, NodeType, DeviceCapabilities, HealthMetrics } from '../protocols/discovery/roleAssignment.ts'
import { PROTOCOLS, TOPICS } from '../protocols/protocols.ts'

export interface TaskBlueprint {
    id: string
    type: string
    payload: Record<string, unknown>
    dependencies?: string[]
    priority: 'high' | 'normal' | 'low'
    redundancy: 'parallel' | 'queue' | 'none'
    timeoutMs: number
    requiredCapabilities?: Partial<DeviceCapabilities>
    metadata?: Record<string, unknown>
}

export interface TaskResult {
    taskId: string
    status: 'success' | 'error' | 'timeout'
    output?: unknown
    errorMessage?: string
    latencyMs: number
    executedBy: string
    timestamp: number
}

export interface TaskSubmission {
    blueprint: TaskBlueprint
    submitterPeerId: string
    submitterSessionId?: string
    timestamp: number
}

export class TaskRouter {
    private node: Libp2p
    private pubsub?: PubSub
    private roleManager: RoleAssignmentManager
    private nodeId: string
    private pendingTasks: Map<string, TaskBlueprint> = new Map()
    private taskResults: Map<string, TaskResult[]> = new Map()
    private resultCallbacks: Map<string, (result: TaskResult) => void> = new Map()
    private readonly DEFAULT_TIMEOUT = 30_000

    constructor(node: Libp2p, roleManager: RoleAssignmentManager) {
        this.node = node
        this.roleManager = roleManager
        this.nodeId = node.peerId.toString()
        this.pubsub = (node as any).pubsub
    }

    public async initialize(): Promise<void> {
        if (this.pubsub) {
            await this.setupGossipSubHandlers()
        }
        this.setupStreamHandlers()
    }

    private async setupGossipSubHandlers(): Promise<void> {
        if (!this.pubsub) return

        this.pubsub.addEventListener('message', (event) => {
            const { topic, data, from } = event.detail
            if (from.toString() === this.nodeId) return

            try {
                switch (topic) {
                    case TOPICS.TASK_ANNOUNCE:
                        this.handleTaskAnnouncement(JSON.parse(new TextDecoder().decode(data)), from.toString())
                        break
                    case TOPICS.TASK_RESULT:
                        this.handleTaskResult(JSON.parse(new TextDecoder().decode(data)), from.toString())
                        break
                }
            } catch (err) {
                console.error('Failed to parse gossip message:', err)
            }
        })

        await this.pubsub.subscribe(TOPICS.TASK_ANNOUNCE)
        await this.pubsub.subscribe(TOPICS.TASK_RESULT)
    }

    private setupStreamHandlers(): void {
        this.node.handle([PROTOCOLS.TASK_DELEGATION], async (stream: Stream, connection: Connection) => {
            const remotePeerId = connection.remotePeer.toString()
            for await (const data of stream) {
                try {
                    const submission: TaskSubmission = JSON.parse(new TextDecoder().decode(data.subarray()))
                    const result = await this.executeTask(submission.blueprint, remotePeerId)
                    stream.send(new TextEncoder().encode(JSON.stringify(result)))
                } catch (err: any) {
                    const errorResult: TaskResult = {
                        taskId: 'unknown',
                        status: 'error',
                        errorMessage: err.message,
                        latencyMs: 0,
                        executedBy: this.nodeId,
                        timestamp: Date.now()
                    }
                    stream.send(new TextEncoder().encode(JSON.stringify(errorResult)))
                }
            }
        })
    }

    private handleTaskAnnouncement(task: TaskBlueprint, announcerId: string): void {
        if (this.roleManager.getCurrentRole() !== NodeType.GATE) return
        this.routeTask(task, announcerId)
    }

    private handleTaskResult(result: TaskResult, senderId: string): void {
        const results = this.taskResults.get(result.taskId) || []
        results.push(result)
        this.taskResults.set(result.taskId, results)

        const callback = this.resultCallbacks.get(result.taskId)
        if (callback) {
            callback(result)
        }
    }

    public async submitTask(blueprint: TaskBlueprint, submitterPeerId: string, sessionId?: string): Promise<string> {
        this.pendingTasks.set(blueprint.id, blueprint)

        const submission: TaskSubmission = {
            blueprint,
            submitterPeerId,
            submitterSessionId: sessionId,
            timestamp: Date.now()
        }

        if (this.pubsub && this.roleManager.getCurrentRole() === NodeType.GATE) {
            this.pubsub.publish(TOPICS.TASK_ANNOUNCE, new TextEncoder().encode(JSON.stringify(submission)))
        }

        this.routeTask(blueprint, submitterPeerId)
        return blueprint.id
    }

    private async routeTask(blueprint: TaskBlueprint, submitterId: string): Promise<void> {
        const candidates = this.selectCandidates(blueprint)

        if (blueprint.priority === 'high' && blueprint.redundancy === 'parallel') {
            await this.dispatchParallel(blueprint, candidates, submitterId)
        } else {
            await this.dispatchQueued(blueprint, candidates, submitterId)
        }
    }

    private selectCandidates(blueprint: TaskBlueprint): string[] {
        let candidates = this.roleManager.getAvailableWorkers()

        if (blueprint.requiredCapabilities) {
            for (const [key, value] of Object.entries(blueprint.requiredCapabilities)) {
                candidates = candidates.filter(peerId => {
                    const caps = this.roleManager.getPeersWithCapability(key as keyof DeviceCapabilities, value)
                    return caps.includes(peerId)
                })
            }
        }

        candidates.sort((a, b) => {
            const scoreA = this.roleManager.getPeerScore(a, blueprint.type)
            const scoreB = this.roleManager.getPeerScore(b, blueprint.type)
            return scoreB - scoreA
        })

        return candidates.slice(0, 3)
    }

    private async dispatchParallel(blueprint: TaskBlueprint, candidates: string[], submitterId: string): Promise<void> {
        const timeout = blueprint.timeoutMs || this.DEFAULT_TIMEOUT
        const results: TaskResult[] = []
        let resolved = false

        const timeoutPromise = new Promise<TaskResult>((resolve) => {
            setTimeout(() => {
                if (!resolved) {
                    resolved = true
                    resolve({
                        taskId: blueprint.id,
                        status: 'timeout',
                        latencyMs: timeout,
                        executedBy: 'timeout',
                        timestamp: Date.now()
                    })
                }
            }, timeout)
        })

        const dispatchPromises = candidates.map(async (peerId) => {
            try {
                const result = await this.sendTaskToPeer(blueprint, peerId)
                if (!resolved) {
                    resolved = true
                    this.taskResults.set(blueprint.id, [result])
                    this.notifyResult(blueprint.id, result)
                }
                return result
            } catch {
                return null
            }
        })

        const firstResult = await Promise.race([
            ...dispatchPromises,
            timeoutPromise
        ])

        if (firstResult && firstResult.status !== 'timeout') {
            this.roleManager.updateReputation(firstResult.executedBy, blueprint.type, true, firstResult.latencyMs)
        }
    }

    private async dispatchQueued(blueprint: TaskBlueprint, candidates: string[], submitterId: string): Promise<void> {
        for (const peerId of candidates) {
            try {
                const result = await this.sendTaskToPeer(blueprint, peerId)
                this.taskResults.set(blueprint.id, [result])
                this.notifyResult(blueprint.id, result)
                this.roleManager.updateReputation(result.executedBy, blueprint.type, result.status === 'success', result.latencyMs)
                return
            } catch (err) {
                console.error(`Task failed on ${peerId}:`, err)
                continue
            }
        }

        const fallbackResult: TaskResult = {
            taskId: blueprint.id,
            status: 'error',
            errorMessage: 'No suitable executor found',
            latencyMs: 0,
            executedBy: this.nodeId,
            timestamp: Date.now()
        }
        this.notifyResult(blueprint.id, fallbackResult)
    }

    private async sendTaskToPeer(blueprint: TaskBlueprint, peerId: string): Promise<TaskResult> {
        const peerIdObj = peerIdFromString(peerId)
        const connections = this.node.getConnections(peerIdObj)
        if (connections.length === 0) {
            throw new Error(`No connection to ${peerId}`)
        }

        const startTime = Date.now()
        const stream = await connections[0].newStream(PROTOCOLS.TASK_DELEGATION)
        const submission: TaskSubmission = {
            blueprint,
            submitterPeerId: this.nodeId,
            timestamp: Date.now()
        }
        stream.send(new TextEncoder().encode(JSON.stringify(submission)))

        let result: TaskResult | null = null
        for await (const data of stream) {
            result = JSON.parse(new TextDecoder().decode(data.subarray())) as TaskResult
            break
        }
        await stream.close()

        if (!result) {
            throw new Error('No result received')
        }

        result.latencyMs = Date.now() - startTime
        return result
    }

    private async executeTask(blueprint: TaskBlueprint, submitterId: string): Promise<TaskResult> {
        const startTime = Date.now()
        try {
            const output = await this.executeTaskLogic(blueprint)
            return {
                taskId: blueprint.id,
                status: 'success',
                output,
                latencyMs: Date.now() - startTime,
                executedBy: this.nodeId,
                timestamp: Date.now()
            }
        } catch (err: any) {
            return {
                taskId: blueprint.id,
                status: 'error',
                errorMessage: err.message,
                latencyMs: Date.now() - startTime,
                executedBy: this.nodeId,
                timestamp: Date.now()
            }
        }
    }

    private async executeTaskLogic(blueprint: TaskBlueprint): Promise<unknown> {
        switch (blueprint.type) {
            case 'tts':
                return this.executeTTS(blueprint.payload)
            case 'image-classify':
                return this.executeImageClassify(blueprint.payload)
            case 'sensor-read':
                return this.executeSensorRead(blueprint.payload)
            default:
                throw new Error(`Unknown task type: ${blueprint.type}`)
        }
    }

    private async executeTTS(payload: Record<string, unknown>): Promise<unknown> {
        const { KokoroManager } = await import('./_O_textToSpeech.ts')
        const manager = new KokoroManager()
        await manager.initialize()
        const result = await manager.generateSpeech(
            payload.text as string,
            payload.settings as Record<string, unknown>
        )
        await manager.dispose()
        return { audioLength: result.audio.length, samplingRate: result.sampling_rate }
    }

    private async executeImageClassify(payload: Record<string, unknown>): Promise<unknown> {
        return { classification: 'placeholder', confidence: 0.95 }
    }

    private async executeSensorRead(payload: Record<string, unknown>): Promise<unknown> {
        return { sensorData: 'placeholder', timestamp: Date.now() }
    }

    public onResult(taskId: string, callback: (result: TaskResult) => void): void {
        this.resultCallbacks.set(taskId, callback)
        const existing = this.taskResults.get(taskId)
        if (existing && existing.length > 0) {
            callback(existing[existing.length - 1])
        }
    }

    private notifyResult(taskId: string, result: TaskResult): void {
        const callback = this.resultCallbacks.get(taskId)
        if (callback) {
            callback(result)
        }
        if (this.pubsub) {
            this.pubsub.publish(TOPICS.TASK_RESULT, new TextEncoder().encode(JSON.stringify(result)))
        }
    }

    public getTaskHistory(taskId?: string): TaskResult[] | Record<string, TaskResult[]> {
        if (taskId) {
            return this.taskResults.get(taskId) || []
        }
        return Object.fromEntries(this.taskResults)
    }
}

function peerIdFromString(id: string): any {
    return { toString: () => id }
}
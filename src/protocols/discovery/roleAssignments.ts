// src/protocols/discovery/roleAssignments.ts
import type { Libp2p } from "libp2p";
import type { PubSub } from "@libp2p/interface-pubsub";
import { peerIdFromString } from '@libp2p/peer-id'
import type { Stream, Connection } from "@libp2p/interface";
import { ConfigManager } from "../config/configManager.ts";
import { PROTOCOLS, TOPICS } from "../protocols.ts";

export interface DeviceCapabilities {
    sensors: string[]
    hasCamera: boolean
    hasMicrophone: boolean
    computeClass: 'low' | 'mid' | 'high'
    batteryLevel?: number
    os?: string
    model?: string
    supportedTaskTypes?: string[]
}

export interface RoleMessage {
    type: 'role_request' | 'role_assignment' | 'role_announcement' | 'capability_register' | 'health_update' | 'reputation_update'
    senderId: string
    role?: 'gate' | 'worker' | 'input'
    targetPeerId?: string
    capabilities?: DeviceCapabilities
    health?: HealthMetrics
    reputation?: ReputationScore
    timestamp: number
}

export interface HealthMetrics {
    uptime: number
    lastActive: number
    avgLatency: number
    successRate: number
    batteryLevel?: number
}

export interface ReputationScore {
    peerId: string
    score: number
    taskTypes: Record<string, number>
    lastUpdated: number
}

export const NodeType = {
    GATE: 'gate',
    WORKER: 'worker',
    INPUT: 'input',
    UNKNOWN: 'unknown'
} as const

export type NodeType = typeof NodeType[keyof typeof NodeType]

export interface HardwareProfile {
    hasCamera: boolean
    hasSpecificSensors: string[]
    deviceModel?: string
    raspberryPiModel?: string
}

export class RoleAssignmentManager {
    private node: Libp2p
    private pubsub?: PubSub
    private nodeId: string
    private currentRole: NodeType = NodeType.UNKNOWN
    private connectedPeers: Map<string, NodeType> = new Map()
    private availableWorkers: Set<string> = new Set()
    private availableInputs: Set<string> = new Set()
    private gateAnnounced: boolean = false
    private configManager: ConfigManager
    private peerCapabilities: Map<string, DeviceCapabilities> = new Map()
    private peerHealth: Map<string, HealthMetrics> = new Map()
    private peerReputation: Map<string, ReputationScore> = new Map()
    private readonly REPUTATION_DECAY = 0.99
    private readonly HEALTH_WINDOW_MS = 5 * 60_000

    constructor(node: Libp2p) {
        this.node = node
        this.nodeId = node.peerId.toString()
        this.configManager = new ConfigManager()
        this.currentRole = this.configManager.predefinedRole
        this.pubsub = (node as any).pubsub
    }

    public get isSwISDNode(): boolean {
        return this.configManager.isSwISD
    }

    public getCurrentRole(): NodeType {
        return this.currentRole
    }

    public getConnectedPeers(): Map<string, NodeType> {
        return new Map(this.connectedPeers)
    }

    public getAvailableWorkers(): string[] {
        return Array.from(this.availableWorkers)
    }

    public getAvailableInputs(): string[] {
        return Array.from(this.availableInputs)
    }

    public getPeersWithCapability(capability: keyof DeviceCapabilities, value?: any): string[] {
        const result: string[] = []
        for (const [peerId, caps] of this.peerCapabilities.entries()) {
            if (value === undefined) {
                if (capability === 'hasCamera' && caps.hasCamera) result.push(peerId)
                else if (capability === 'hasMicrophone' && caps.hasMicrophone) result.push(peerId)
                else if (capability === 'sensors' && caps.sensors.length > 0) result.push(peerId)
                else if (caps[capability] !== undefined) result.push(peerId)
            } else {
                if (caps[capability] === value) result.push(peerId)
            }
        }
        return result
    }

    public async startRoleAssignment(): Promise<void> {
        if (this.pubsub) {
            await this.setupGossipSubHandlers()
        }

        if (this.currentRole !== NodeType.UNKNOWN) {
            console.log(`Adapting role: ${this.currentRole}`)
            if (this.currentRole === NodeType.GATE) {
                this.announceGateRole()
            } else {
                await this.advertiseCapabilities()
            }
            this.setupMessageHandler()
            this.setupEventListener()
            return
        }

        setTimeout(() => {
            if (this.currentRole === NodeType.UNKNOWN) {
                this.tryBecomeGate()
            }
        }, 5000)

        this.setupMessageHandler()
        this.setupEventListener()
    }

    private async setupGossipSubHandlers(): Promise<void> {
        if (!this.pubsub) return

        this.pubsub.addEventListener('message', (event) => {
            const { topic, data, from } = event.detail
            try {
                const message = JSON.parse(new TextDecoder().decode(data)) as RoleMessage
                this.handleGossipMessage(message, from.toString(), topic)
            } catch (err) {
                console.error('Failed to parse gossip message:', err)
            }
        })

        await this.pubsub.subscribe(TOPICS.CAPABILITY)
        await this.pubsub.subscribe(TOPICS.HEALTH)
        await this.pubsub.subscribe(TOPICS.REPUTATION)
    }

    private handleGossipMessage(message: RoleMessage, senderId: string, topic: string): void {
        if (senderId === this.nodeId) return

        switch (topic) {
            case TOPICS.CAPABILITY:
                if (message.capabilities) {
                    this.peerCapabilities.set(senderId, message.capabilities)
                    if (this.currentRole === NodeType.GATE) {
                        this.updatePeerRole(senderId, message.capabilities)
                    }
                }
                break
            case TOPICS.HEALTH:
                if (message.health) {
                    this.peerHealth.set(senderId, message.health)
                }
                break
            case TOPICS.REPUTATION:
                if (message.reputation) {
                    this.peerReputation.set(senderId, message.reputation)
                }
                break
        }
    }

    private tryBecomeGate(): void {
        if (this.configManager.predefinedRole !== NodeType.UNKNOWN) {
            this.currentRole = this.configManager.predefinedRole
            console.log(`Successfully adapted role: ${this.currentRole}`)
            if (this.currentRole === NodeType.GATE) {
                this.announceGateRole()
            } else {
                this.advertiseCapabilities()
            }
            return
        }

        const allPeers = Array.from(this.connectedPeers.keys()).concat(this.nodeId)
        allPeers.sort()
        const winner = allPeers[allPeers.length - 1]

        if (winner === this.nodeId && !this.gateAnnounced) {
            console.log(`Elected gate: ${this.nodeId}`)
            this.currentRole = NodeType.GATE
            this.announceGateRole()
        } else if (winner !== this.nodeId) {
            this.currentRole = NodeType.WORKER
            this.advertiseCapabilities()
        }
    }

    public getConfigRole(): NodeType {
        return this.configManager.predefinedRole
    }

    private setupMessageHandler(): void {
        this.node.handle([PROTOCOLS.ROLE_ASSIGNMENT], async (stream: Stream, connection: Connection) => {
            console.log(`Received role assignment message from: ${connection.remotePeer.toString()}`)

            for await (const data of stream) {
                try {
                    const messageData = new TextDecoder().decode(data.subarray())
                    const message: RoleMessage = JSON.parse(messageData)
                    await this.handleRoleMessage(message, connection.remotePeer.toString())
                } catch (err: any) {
                    console.error('Error parsing role:', err)
                }
            }
        })
    }

    private setupEventListener(): void {
        this.node.addEventListener('peer:discovery', (event) => {
            const { detail: peerInfo } = event
            console.log(`Discovered peer: ${peerInfo.id.toString()}`)
        })

        this.node.addEventListener('peer:connect', (event) => {
            const detail = event.detail
            let peerId: string

            if (typeof detail === 'object' && detail !== null && 'remotePeer' in detail) {
                const remotePeer = (detail as any).remotePeer
                peerId = typeof remotePeer === 'object' && remotePeer !== null
                    ? remotePeer.toString()
                    : detail.toString()
            } else {
                peerId = detail.toString()
            }

            console.log(`Connected to: ${peerId}`)

            if (this.currentRole === NodeType.GATE) {
                setTimeout(() => this.requestRoleFromNewPeer(peerId), 1000)
            }
        })
    }

    private async requestRoleFromNewPeer(peerId: string): Promise<void> {
        if (this.currentRole !== NodeType.GATE) return

        try {
            const peerIdObj = peerIdFromString(peerId)
            const connections = this.node.getConnections(peerIdObj)
            if (connections.length > 0) {
                const stream = await connections[0].newStream(PROTOCOLS.ROLE_REQUEST)
                const message: RoleMessage = {
                    type: 'role_request',
                    senderId: this.nodeId,
                    timestamp: Date.now()
                }
                const encodedMessage = new TextEncoder().encode(JSON.stringify(message))
                stream.send(encodedMessage)
                await stream.close()
            }
        } catch (err) {
            console.error(`Failed to request role from peer ${peerId}:`, err)
        }
    }

    private async handleRoleMessage(message: RoleMessage, senderId: string): Promise<void> {
        switch (message.type) {
            case 'role_announcement':
                if (message.role === 'gate') {
                    this.gateAnnounced = true
                    if (this.currentRole === NodeType.GATE) {
                        console.log(`Another gate detected. Demoting...`)
                        this.currentRole = NodeType.WORKER
                    }
                }
                break
            case 'role_request':
                if (this.currentRole === NodeType.GATE) {
                    await this.assignRoleToPeer(senderId)
                }
                break
            case 'capability_register':
                if (this.currentRole === NodeType.GATE && message.capabilities) {
                    console.log(`Registered capabilities from ${senderId}:`, message.capabilities)
                    this.peerCapabilities.set(senderId, message.capabilities)
                    this.updatePeerRole(senderId, message.capabilities)
                }
                break
        }
    }

    private updatePeerRole(peerId: string, caps: DeviceCapabilities): void {
        const role = (caps.hasCamera || caps.hasMicrophone || caps.sensors.length > 0)
            ? NodeType.INPUT
            : NodeType.WORKER

        if (role === NodeType.INPUT) {
            this.availableInputs.add(peerId)
        } else {
            this.availableWorkers.add(peerId)
        }
        this.connectedPeers.set(peerId, role)
        console.log(`Assigned role ${role} to ${peerId} based on capabilities`)
    }

    private async announceGateRole(): Promise<void> {
        const message: RoleMessage = {
            type: 'role_announcement',
            senderId: this.nodeId,
            role: 'gate',
            timestamp: Date.now()
        }

        if (this.pubsub) {
            this.pubsub.publish(TOPICS.CAPABILITY, new TextEncoder().encode(JSON.stringify(message)))
        }

        const connections = this.node.getConnections()
        for (const connection of connections) {
            try {
                const stream = await connection.newStream(PROTOCOLS.ROLE_ANNOUNCEMENT)
                const encodedMessage = new TextEncoder().encode(JSON.stringify(message))
                stream.send(encodedMessage)
                await stream.close()
            } catch (err: any) {
                console.error('Failed to announce gate role:', err)
            }
        }
    }

    private async assignRoleToPeer(peerId: string): Promise<void> {
        if (!this.peerCapabilities.has(peerId)) {
            let assignedRole: 'worker' | 'input'
            if (this.availableInputs.size < 2) {
                assignedRole = 'input'
                this.availableInputs.add(peerId)
            } else {
                assignedRole = 'worker'
                this.availableWorkers.add(peerId)
            }
            await this.sendRoleAssignment(peerId, assignedRole)
            this.connectedPeers.set(peerId, assignedRole as NodeType)
            console.log(`Assigned role ${assignedRole} to ${peerId} (fallback)`)
            return
        }

        const caps = this.peerCapabilities.get(peerId)!
        const role = (caps.hasCamera || caps.hasMicrophone || caps.sensors.length > 0)
            ? NodeType.INPUT
            : NodeType.WORKER

        if (role === NodeType.INPUT) {
            this.availableInputs.add(peerId)
        } else {
            this.availableWorkers.add(peerId)
        }

        await this.sendRoleAssignment(peerId, role)
        this.connectedPeers.set(peerId, role)
        console.log(`Assigned role ${role} to ${peerId} based on capabilities`)
    }

    private async sendRoleAssignment(targetPeerId: string, role: NodeType) {
        const peerIdObj = peerIdFromString(targetPeerId)
        const connections = this.node.getConnections(peerIdObj)
        if (connections.length > 0) {
            const stream = await connections[0].newStream(PROTOCOLS.ROLE_ASSIGNMENT)
            const message: RoleMessage = {
                type: 'role_assignment',
                senderId: this.nodeId,
                targetPeerId,
                role: role as 'worker' | 'input',
                timestamp: Date.now()
            }
            const encodedMessage = new TextEncoder().encode(JSON.stringify(message))
            stream.send(encodedMessage)
            await stream.close()
        }
    }

    private async advertiseCapabilities(): Promise<void> {
        const capabilities: DeviceCapabilities = await this.detectCapabilities()
        const message: RoleMessage = {
            type: 'capability_register',
            senderId: this.nodeId,
            capabilities,
            timestamp: Date.now()
        }

        if (this.pubsub) {
            this.pubsub.publish(TOPICS.CAPABILITY, new TextEncoder().encode(JSON.stringify(message)))
        }

        const connections = this.node.getConnections()
        for (const connection of connections) {
            try {
                const stream = await connection.newStream(PROTOCOLS.INPUT_CAPABILITY)
                const encodedMessage = new TextEncoder().encode(JSON.stringify(message))
                stream.send(encodedMessage)
                await stream.close()
            } catch (err: any) {
                console.error('Failed to advertise capabilities:', err)
            }
        }
    }

    public async broadcastHealth(health: HealthMetrics): Promise<void> {
        const message: RoleMessage = {
            type: 'health_update',
            senderId: this.nodeId,
            health,
            timestamp: Date.now()
        }
        if (this.pubsub) {
            this.pubsub.publish(TOPICS.HEALTH, new TextEncoder().encode(JSON.stringify(message)))
        }
    }

    public async updateReputation(peerId: string, taskType: string, success: boolean, latency: number): Promise<void> {
        const existing = this.peerReputation.get(peerId) || {
            peerId,
            score: 0.5,
            taskTypes: {},
            lastUpdated: Date.now()
        }

        const alpha = 0.1
        const outcome = success ? 1 : 0
        existing.score = (1 - alpha) * existing.score + alpha * outcome
        existing.taskTypes[taskType] = existing.taskTypes[taskType]
            ? (1 - alpha) * existing.taskTypes[taskType] + alpha * (success ? 1 : 0)
            : outcome
        existing.lastUpdated = Date.now()

        existing.score *= this.REPUTATION_DECAY
        for (const key of Object.keys(existing.taskTypes)) {
            existing.taskTypes[key] *= this.REPUTATION_DECAY
        }

        this.peerReputation.set(peerId, existing)

        if (this.pubsub) {
            const message: RoleMessage = {
                type: 'reputation_update',
                senderId: this.nodeId,
                reputation: existing,
                timestamp: Date.now()
            }
            this.pubsub.publish(TOPICS.REPUTATION, new TextEncoder().encode(JSON.stringify(message)))
        }
    }

    public getPeerScore(peerId: string, taskType?: string): number {
        const rep = this.peerReputation.get(peerId)
        if (!rep) return 0.5
        if (taskType && rep.taskTypes[taskType] !== undefined) {
            return rep.taskTypes[taskType]
        }
        return rep.score
    }

    private async detectCapabilities(): Promise<DeviceCapabilities> {
        const [hasCamera, hasMic, raspberryModel] = await Promise.all([
            this.checkForCamera(),
            this.checkForMicrophone(),
            this.getRaspberryPiModel()
        ])

        return {
            sensors: await this.detectSensors(),
            hasCamera,
            hasMicrophone: hasMic,
            computeClass: this.estimateComputeClass(),
            batteryLevel: await this.getBatteryLevel(),
            os: process.platform,
            model: raspberryModel || process.env.HOSTNAME || 'unknown',
            supportedTaskTypes: []
        }
    }

    private async checkForCamera(): Promise<boolean> {
        try {
            const fs = await import('fs')
            const cameraPaths = ['/dev/video0', '/dev/video1', '/opt/vc/bin/raspistill', '/usr/bin/libcamera-still']
            for (const camPath of cameraPaths) {
                if (fs.existsSync(camPath)) return true
            }
            return false
        } catch {
            return false
        }
    }

    private async checkForMicrophone(): Promise<boolean> {
        try {
            const fs = await import('fs')
            const micPaths = ['/dev/snd', '/proc/asound']
            for (const micPath of micPaths) {
                if (fs.existsSync(micPath)) return true
            }
            return false
        } catch {
            return false
        }
    }

    private async detectSensors(): Promise<string[]> {
        const sensors: string[] = []
        try {
            const fs = await import('fs')
            if (fs.existsSync('/sys/bus/i2c/devices')) sensors.push('i2c')
            if (fs.existsSync('/sys/class/iio')) sensors.push('iio')
        } catch {}
        return sensors
    }

    private estimateComputeClass(): 'low' | 'mid' | 'high' {
        const cpus = require('os').cpus?.() || []
        if (cpus.length >= 4) return 'high'
        if (cpus.length >= 2) return 'mid'
        return 'low'
    }

    private async getBatteryLevel(): Promise<number | undefined> {
        try {
            const fs = await import('fs')
            if (fs.existsSync('/sys/class/power_supply/BAT0/capacity')) {
                const val = parseInt(fs.readFileSync('/sys/class/power_supply/BAT0/capacity', 'utf8'))
                return isNaN(val) ? undefined : val / 100
            }
            return undefined
        } catch {
            return undefined
        }
    }

    private async getRaspberryPiModel(): Promise<string | undefined> {
        try {
            const fs = await import('fs')
            if (fs.existsSync('/proc/device-tree/model')) {
                const model = fs.readFileSync('/proc/device-tree/model', 'utf8').trim()
                return model.replace(/\0.*$/, '')
            }
            return undefined
        } catch {
            return undefined
        }
    }
}
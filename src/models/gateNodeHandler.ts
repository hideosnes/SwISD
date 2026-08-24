// src/models/GateNodeHandler.ts
import type { Libp2p } from 'libp2p'
import type { Stream, Connection } from '@libp2p/interface'
import { KokoroManager } from '../features/_O_textToSpeech.ts'
import { RoleAssignmentManager, NodeType } from '../protocols/discovery/roleAssignments.ts'
import fs from 'fs/promises'
import path from 'path'
import { PROTOCOLS } from '../protocols/protocols.ts'

interface TTSRequest {
    text: string
    settings?: { voice?: string; language?: string; speed?: number; pitch?: number }
    requestId: string
    sourcePeerId: string
    timestamp: number
}

interface TTSResponse {
    requestId: string
    status: 'success' | 'error'
    errorMessage?: string
    audioDurationMs?: number
    timestamp: number
}

export class GateNodeHandler {
    private node: Libp2p
    private kokoroManager: KokoroManager
    private roleManager: RoleAssignmentManager
    private nodeId: string
    private audioContext: AudioContext | null = null

    constructor(node: Libp2p, roleManager: RoleAssignmentManager) {
        this.node = node
        this.roleManager = roleManager
        this.nodeId = node.peerId.toString()
        this.kokoroManager = new KokoroManager(
            'onnx-community/Kokoro-82M-v1.1-zh-ONNX',
            './src/models/kokoroTTS'
        )
    }

    public async initialize(): Promise<boolean> {
        console.log('Initializing Gate Node TTS capabilities...')

        if (typeof AudioContext !== 'undefined') {
            this.audioContext = new AudioContext()
            console.log('Audio output initialized via Web Audio API')
        } else {
            console.log('Web Audio API unavailable. Using file-based fallback.')
        }

        const initialized = await this.kokoroManager.initialize()
        
        if (initialized) {
            console.log('Gate Node TTS capabilities ready')
            this.setupTTSRequestHandler()
            return true
        } else {
            console.error('Failed to initialize KokoroTS')
            return false
        }
    }

    public setParentAllowsDownload(allows: boolean): void {
        this.kokoroManager.setParentAllowsDownload(allows)
    }

    private setupTTSRequestHandler(): void {
        const TTS_PROTOCOL_ID = PROTOCOLS.ROLE_REQUEST

        this.node.handle([TTS_PROTOCOL_ID], async (stream: Stream, connection: Connection) => {
            const remotePeerId = connection.remotePeer.toString()
            console.log(`Received TTS request from worker: ${remotePeerId}`)

            for await (const data of stream) {
                try {
                    const messageData = new TextDecoder().decode(data.subarray())
                    const request: TTSRequest = JSON.parse(messageData)

                    if (request.sourcePeerId !== remotePeerId) {
                        console.warn(`Security warning: peer ID mismatch`)
                        continue
                    }

                    const response = await this.processTTSRequest(request)
                    stream.send(new TextEncoder().encode(JSON.stringify(response)))
                    console.log(`TTS request ${request.requestId} processed`)
                } catch (err: any) {
                    console.error('Error processing TTS request:', err)
                    const errorResponse: TTSResponse = {
                        requestId: 'unknown',
                        status: 'error',
                        errorMessage: err.message,
                        timestamp: Date.now()
                    }
                    stream.send(new TextEncoder().encode(JSON.stringify(errorResponse)))
                }
            }
        })
    }

    private async processTTSRequest(request: TTSRequest): Promise<TTSResponse> {
        try {
            console.log(`Processing TTS request [${request.requestId}]: "${request.text.substring(0, 60)}..."`)

            const startTime = Date.now()
            const result = await this.kokoroManager.generateSpeech(request.text, request.settings || {})
            const generationTime = Date.now() - startTime

            console.log(`Speech generated in ${generationTime}ms (${result.audio.length} samples)`)

            await this.outputAudioLocally(result.audio, result.sampling_rate, request.requestId)

            const sampleRate = result.sampling_rate ?? 24000
            return {
                requestId: request.requestId,
                status: 'success',
                audioDurationMs: Math.round((result.audio.length / sampleRate) * 1000),
                timestamp: Date.now()
            }
        } catch (error: any) {
            console.error('TTS processing failed:', error)
            return {
                requestId: request.requestId,
                status: 'error',
                errorMessage: error.message,
                timestamp: Date.now()
            }
        }
    }

    private async outputAudioLocally(audioData: Float32Array, sampleRate: number, requestId: string): Promise<void> {
        const normalized = this.normalizeAudio(audioData)

        if (this.audioContext) {
            await this.playViaWebAudio(normalized, sampleRate)
            return
        }

        const filename = `tts_${requestId}_${Date.now()}.wav`
        const wavPath = await this.saveAsWav(normalized, sampleRate, filename)
        console.log(`Audio saved: ${wavPath}`)
        await this.autoOpenFile(wavPath).catch(() => {})
    }

    private normalizeAudio(audioData: Float32Array): Float32Array {
        let max = 0
        for (let i = 0; i < audioData.length; i++) {
            const abs = Math.abs(audioData[i])
            if (abs > max) max = abs
        }
        if (max > 1.0) {
            const normalized = new Float32Array(audioData.length)
            for (let i = 0; i < audioData.length; i++) {
                normalized[i] = audioData[i] / max
            }
            return normalized
        }
        return audioData
    }

    private async playViaWebAudio(audioData: Float32Array, sampleRate: number): Promise<void> {
        if (!this.audioContext) return
        try {
            const audioBuffer = this.audioContext.createBuffer(1, audioData.length, sampleRate)
            audioBuffer.getChannelData(0).set(audioData)
            const source = this.audioContext.createBufferSource()
            source.buffer = audioBuffer
            source.connect(this.audioContext.destination)
            source.start(0)
            await new Promise<void>((resolve) => { source.onended = () => resolve() })
        } catch (err) {
            console.error('Web Audio playback failed:', err)
        }
    }

    private encodeWav(samples: Float32Array, sampleRate: number): Buffer {
        const bytesPerSample = 2
        const blockAlign = 1 * bytesPerSample
        const byteRate = sampleRate * blockAlign
        const dataSize = samples.length * bytesPerSample
        const fileSize = 44 + dataSize

        const buffer = new ArrayBuffer(44 + dataSize)
        const view = new DataView(buffer)

        this.writeString(view, 0, 'RIFF')
        view.setUint32(4, fileSize - 8, true)
        this.writeString(view, 8, 'WAVE')
        this.writeString(view, 12, 'fmt ')
        view.setUint32(16, 16, true)
        view.setUint16(20, 1, true)
        view.setUint16(22, 1, true)
        view.setUint32(24, sampleRate, true)
        view.setUint32(28, byteRate, true)
        view.setUint16(32, blockAlign, true)
        view.setUint16(34, 8 * bytesPerSample, true)
        this.writeString(view, 36, 'data')
        view.setUint32(40, dataSize, true)

        let offset = 44
        for (let i = 0; i < samples.length; i++, offset += 2) {
            const s = Math.max(-1, Math.min(1, samples[i]))
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
        }

        return Buffer.from(buffer)
    }

    private writeString(view: DataView, offset: number, str: string): void {
        for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i))
        }
    }

    private async saveAsWav(audioData: Float32Array, sampleRate: number, filename: string): Promise<string> {
        const wavBuffer = this.encodeWav(audioData, sampleRate)
        const outputDir = path.join(process.cwd(), 'audio_output')
        await fs.mkdir(outputDir, { recursive: true })
        const filePath = path.join(outputDir, filename)
        await fs.writeFile(filePath, wavBuffer)
        return filePath
    }

    private async autoOpenFile(filePath: string): Promise<void> {
        try {
            const open = (await import('open')).default
            await open(filePath)
        } catch {
            console.log(`🔊 Open manually: ${filePath}`)
        }
    }

    public async sendTTSRequestToGate(text: string, settings: TTSRequest['settings'] = {}): Promise<TTSResponse> {
        const gatePeerId = this.findGateNode()
        if (!gatePeerId) throw new Error('No gate node found')
        const request: TTSRequest = { 
            text, 
            settings, 
            requestId: this.generateRequestId(), 
            sourcePeerId: this.nodeId, 
            timestamp: Date.now() 
        }
        return this.sendRemoteTTSRequest(request, gatePeerId)
    }

    private findGateNode(): string | null {
        const peers = this.roleManager.getConnectedPeers()
        for (const [peerId, role] of peers.entries()) {
            if (role === NodeType.GATE) return peerId
        }
        return null
    }

    private async sendRemoteTTSRequest(request: TTSRequest, targetPeerId: string): Promise<TTSResponse> {
        try {
            const { peerIdFromString } = await import('@libp2p/peer-id')
            const targetPeer = peerIdFromString(targetPeerId)
            const connections = this.node.getConnections(targetPeer)
            if (connections.length === 0) throw new Error(`No connection to gate node: ${targetPeerId}`)
            const stream = await connections[0].newStream(PROTOCOLS.ROLE_REQUEST)
            stream.send(new TextEncoder().encode(JSON.stringify(request)))
            for await (const data of stream) {
                const response: TTSResponse = JSON.parse(new TextDecoder().decode(data.subarray()))
                await stream.close()
                return response
            }
            throw new Error('No response from gate node')
        } catch (error) {
            console.error('Failed to send TTS request:', error)
            throw error
        }
    }

    private generateRequestId(): string {
        return `tts_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
    }

    public getKokoroManager(): KokoroManager { return this.kokoroManager }
    public isReady(): boolean { return this.kokoroManager.isReady() }
}
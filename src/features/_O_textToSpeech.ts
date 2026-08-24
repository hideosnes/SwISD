// src/features/_O_textToSpeech.ts
import fs from 'fs/promises'
import path from 'path'
import { 
    pipeline,
    type TextToAudioPipeline,
    type TextToAudioOutput
} from '@huggingface/transformers'

interface KokoroSettings {
    voice?: string
    lang_code?: string
    speed?: number
}

interface TTSResult {
    audio: Float32Array
    sampling_rate: number
}

export class KokoroManager {
    private ttsPipeline: TextToAudioPipeline | null = null
    private readonly modelId: string
    private readonly localModelPath: string
    private isAvailable = false
    private parentAllowsDownload = true

    constructor(
        modelId = 'onnx-community/Kokoro-82M-v1.1-zh-ONNX', 
        localModelPath = './src/models/kokoroTTS'
    ) {
        this.modelId = modelId
        this.localModelPath = localModelPath
    }

    public setParentAllowsDownload(allows: boolean): void {
        this.parentAllowsDownload = allows
    }

    public async initialize(): Promise<boolean> {
        try {
            console.log(`Initializing TTS pipeline: ${this.modelId}`)

            const isLocal = await this.checkModelExistsLocally()
            
            if (!isLocal && !this.parentAllowsDownload) {
                console.warn('Model download blocked by parent control.')
                this.isAvailable = false
                return false
            }

            const modelSource = isLocal ? this.localModelPath : this.modelId

            this.ttsPipeline = await pipeline<'text-to-speech'>(
                'text-to-speech',
                modelSource,
                { progress_callback: (p) => p && console.log(`Loading: ${p.status}`) }
            )
            this.isAvailable = true
            console.log('TTS pipeline ready')
            return true
        } catch (err) {
            console.error('Initialization failed:', err instanceof Error ? err.message : err)
            this.isAvailable = false
            return false
        }
    }

    public isReady(): boolean {
        return this.isAvailable && this.ttsPipeline !== null
    }

    public async generateSpeech(text: string, settings: KokoroSettings = {}): Promise<TTSResult> {
        if (!this.isReady()) {
            throw new Error('TTS pipeline not initialized. Call initialize() first.')
        }

        try {
            const logPreview = text.length > 50 ? `${text.slice(0, 50)}…` : text
            console.log(`Processing: "${logPreview}"`)

            const result = await this.ttsPipeline!(text, settings) as TextToAudioOutput

            return {
                audio: result.audio,
                sampling_rate: result.sampling_rate ?? 24000
            }
        } catch (err) {
            console.error('Speech generation failed:', err instanceof Error ? err.message : err)
            throw err
        }
    }

    public async dispose(): Promise<void> {
        if (this.ttsPipeline) {
            await this.ttsPipeline.dispose()
            this.ttsPipeline = null
            this.isAvailable = false
            console.log('TTS pipeline disposed')
        }
    }

    private async checkModelExistsLocally(): Promise<boolean> {
        const critical = ['model.onnx', 'config.json']
        try {
            await Promise.all(
                critical.map(file => 
                    fs.access(path.join(this.localModelPath, file), fs.constants.R_OK)
                )
            )
            console.log(`Local model validated: ${this.localModelPath}`)
            return true
        } catch {
            console.log(`Local model incomplete or unreadable: ${this.localModelPath}`)
            return false
        }
    }

    public async getModelSizeMB(): Promise<number | null> {
        try {
            const res = await fetch(`https://huggingface.co/api/models/${this.modelId}`)
            if (!res.ok) return null

            const info = await res.json() as { siblings?: { rfilename: string; size: number }[] }
            const allowed = ['.onnx', '.onnx_data', '.ort', '.json', '.txt', '.yaml', '.bin']
            
            const total = (info.siblings || [])
                .filter(f => allowed.some(ext => f.rfilename.toLowerCase().endsWith(ext)))
                .reduce((sum, f) => sum + f.size, 0)

            return total > 0 ? total / (1024 * 1024) : null
        } catch {
            return null
        }
    }
}
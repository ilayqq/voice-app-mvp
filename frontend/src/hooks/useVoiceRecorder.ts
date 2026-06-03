import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import apiClient from '../services/api.ts'
import type { VoiceUploadResponse } from '../services/api.ts'
import { openProductCreateFromVoice } from '../utils/productCreate.ts'

export type PendingVoiceStock = {
    productId: number
    productName: string
    quantity: number
    type: 'incoming' | 'outgoing'
    sourceText?: string
}

function pickMimeType(): string {
    const candidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
    ]
    return candidates.find(type => MediaRecorder.isTypeSupported(type)) ?? ''
}

function filenameForMimeType(mimeType: string): string {
    if (mimeType.includes('webm')) return 'voice.webm'
    if (mimeType.includes('ogg')) return 'voice.ogg'
    if (mimeType.includes('mp4')) return 'voice.m4a'
    return 'voice.wav'
}

function isStockCommand(
    command: NonNullable<VoiceUploadResponse['command']>,
): command is NonNullable<VoiceUploadResponse['command']> & {
    product_id: number
    product_name: string
    quantity: number
    type: 'incoming' | 'outgoing'
} {
    return (
        !command.error
        && (command.type === 'incoming' || command.type === 'outgoing')
        && typeof command.product_id === 'number'
        && command.product_id > 0
        && typeof command.quantity === 'number'
        && command.quantity > 0
    )
}

function handleVoiceResult(
    result: VoiceUploadResponse,
    t: (key: string, opts?: Record<string, unknown>) => string,
    callbacks: {
        onNavigate?: (command: NonNullable<VoiceUploadResponse['command']>) => void
        onStockPending?: (pending: PendingVoiceStock) => void
    },
) {
    const command = result.command
    if (!command?.parsed) {
        if (result.text) {
            alert(t('voice.commandNotUnderstood', { text: result.text }))
        }
        return
    }

    if (command.type === 'navigate' && command.action === 'create_product') {
        callbacks.onNavigate?.(command)
        return
    }

    if (command.error === 'product_not_found') {
        alert(t('voice.productNotFound', { product: command.product_name ?? '' }))
        return
    }

    if (command.error) {
        alert(t('voice.commandError', { error: command.error }))
        return
    }

    if (isStockCommand(command)) {
        callbacks.onStockPending?.({
            productId: command.product_id,
            productName: command.product_name ?? '',
            quantity: command.quantity,
            type: command.type,
            sourceText: result.text,
        })
        return
    }
}

export function useVoiceRecorder() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const location = useLocation()
    const streamRef = useRef<MediaStream | null>(null)
    const recorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const mimeTypeRef = useRef('')
    const [recording, setRecording] = useState(false)
    const [loading, setLoading] = useState(false)
    const [pendingStock, setPendingStock] = useState<PendingVoiceStock | null>(null)
    const [confirming, setConfirming] = useState(false)

    const cleanupStream = useCallback(() => {
        streamRef.current?.getTracks().forEach(track => track.stop())
        streamRef.current = null
        recorderRef.current = null
    }, [])

    const cancelStockConfirm = useCallback(() => {
        if (confirming) return
        setPendingStock(null)
    }, [confirming])

    const confirmStock = useCallback(async (quantity: number) => {
        if (!pendingStock || confirming || quantity <= 0) return

        setConfirming(true)
        try {
            await apiClient.createStockMovement({
                product_id: pendingStock.productId,
                type: pendingStock.type,
                quantity,
                description: pendingStock.sourceText
                    ? `voice: ${pendingStock.sourceText}`
                    : 'voice',
            })

            setPendingStock(null)
        } catch (e) {
            alert(e instanceof Error ? e.message : t('voice.commandError', { error: '' }))
        } finally {
            setConfirming(false)
        }
    }, [confirming, pendingStock, t])

    const start = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            })
            streamRef.current = stream

            const mimeType = pickMimeType()
            if (!mimeType) {
                throw new Error('MediaRecorder not supported')
            }

            mimeTypeRef.current = mimeType
            const recorder = new MediaRecorder(stream, { mimeType })
            recorderRef.current = recorder
            chunksRef.current = []

            recorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    chunksRef.current.push(event.data)
                }
            }

            recorder.start(250)
            setRecording(true)
        } catch (e) {
            cleanupStream()
            console.error('Failed to start recording:', e)
            alert(t('voice.micError'))
        }
    }, [cleanupStream, t])

    const stop = useCallback(async () => {
        const recorder = recorderRef.current
        if (!recorder || recorder.state === 'inactive') {
            setRecording(false)
            return
        }

        setRecording(false)
        setLoading(true)

        try {
            await new Promise<void>((resolve, reject) => {
                recorder.onstop = () => resolve()
                recorder.onerror = () => reject(new Error('recording failed'))
                recorder.stop()
            })

            cleanupStream()

            const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current })
            chunksRef.current = []

            if (blob.size < 1000) {
                alert(t('voice.tooShort'))
                return
            }

            const result = await apiClient.uploadVoice(
                blob,
                filenameForMimeType(mimeTypeRef.current),
            )
            handleVoiceResult(result, t, {
                onNavigate: (command) => {
                    if (command.action === 'create_product') {
                        openProductCreateFromVoice(
                            navigate,
                            location.pathname,
                            command.product_name,
                        )
                    }
                },
                onStockPending: setPendingStock,
            })
        } catch (e) {
            console.error('Failed to stop recording:', e)
            const code = e instanceof Error ? e.message : ''
            if (code === 'insufficient_quota') {
                alert(t('voice.quotaError'))
            } else if (code === 'invalid_api_key' || code === 'api_key_not_set') {
                alert(t('voice.apiKeyError'))
            } else if (code === 'empty_transcription') {
                alert(t('voice.tooShort'))
            } else if (code.includes('whisper')) {
                alert(t('voice.whisperError'))
            } else {
                alert(e instanceof Error ? e.message : t('voice.uploadError'))
            }
        } finally {
            setLoading(false)
        }
    }, [cleanupStream, location.pathname, navigate, t])

    const toggle = useCallback(async () => {
        if (loading || confirming) return
        if (recording) {
            await stop()
        } else {
            await start()
        }
    }, [confirming, loading, recording, start, stop])

    return {
        recording,
        loading,
        toggle,
        pendingStock,
        confirming,
        confirmStock,
        cancelStockConfirm,
    }
}

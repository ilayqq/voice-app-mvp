import { useRef, useState } from "react";
import { createWavBlob } from "../services/wavEncoder.ts";
import apiClient from "../services/api.ts";

export default function VoiceRecorder() {
    const ctxRef = useRef<AudioContext | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const nodeRef = useRef<AudioWorkletNode | null>(null);
    const chunksRef = useRef<Float32Array[]>([]);
    const [rec, setRec] = useState(false);
    const [loading, setLoading] = useState(false);

    const start = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                } 
            });
            streamRef.current = stream;

            const ctx = new AudioContext();
            ctxRef.current = ctx;
            await ctx.resume();

            await ctx.audioWorklet.addModule("/recorder.worklet.js");

            const source = ctx.createMediaStreamSource(stream);
            const node = new AudioWorkletNode(ctx, "recorder-processor");
            nodeRef.current = node;

            node.port.onmessage = (e) => {
                chunksRef.current.push(new Float32Array(e.data));
            };

            source.connect(node);
            
            chunksRef.current = [];
            setRec(true);
        } catch (e) {
            console.error("Failed to start recording:", e);
            alert("Не удалось получить доступ к микрофону");
        }
    };

    const stop = async () => {
        setRec(false);
        setLoading(true);

        try {
            if (nodeRef.current) {
                nodeRef.current.disconnect();
                nodeRef.current = null;
            }

            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }

            const ctx = ctxRef.current;
            if (ctx) {
                const sampleRate = ctx.sampleRate;
                await ctx.close();
                ctxRef.current = null;

                if (chunksRef.current.length > 0) {
                    const wav = createWavBlob(chunksRef.current, sampleRate);
                    chunksRef.current = [];
                    await upload(wav);
                }
            }
        } catch (e) {
            console.error("Failed to stop recording:", e);
        } finally {
            setLoading(false);
        }
    };

    const upload = async (blob: Blob) => {
        try {
            const result = await apiClient.uploadVoice(blob);
            console.log("Upload success:", result);
            if (result.text) {
                alert(`Распознанный текст: ${result.text}`);
            }
        } catch (e) {
            console.error("Upload failed:", e);
            alert(e instanceof Error ? e.message : "Ошибка при отправке аудио на сервер");
        }
    };

    return (
        <button 
            onClick={rec ? stop : start} 
            disabled={loading}
            className={`voice-recorder-btn ${rec ? 'recording' : ''}`}
        >
            {loading ? "⌛..." : (rec ? "⏹ Stop" : "🎙 Record")}
        </button>
    );
}

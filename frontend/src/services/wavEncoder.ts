export function createWavBlob(
    chunks: Float32Array[],
    sampleRate: number
): Blob {
    const length = chunks.reduce((s, c) => s + c.length, 0);
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);

    write(view, 0, "RIFF");
    view.setUint32(4, 36 + length * 2, true);
    write(view, 8, "WAVE");
    write(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true); // Block align (channels * bytesPerSample / 8) -> 1 * 16 / 8 = 2
    view.setUint16(34, 16, true);
    write(view, 36, "data");
    view.setUint32(40, length * 2, true);

    let offset = 44;
    for (const chunk of chunks) {
        for (let i = 0; i < chunk.length; i++, offset += 2) {
            const s = Math.max(-1, Math.min(1, chunk[i]));
            // Применяем 0x7FFF для 16-битного знакового целого (диапазон -32768 до 32767)
            view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }
    }

    return new Blob([view], { type: "audio/wav" });
}

function write(view: DataView, offset: number, s: string) {
    for (let i = 0; i < s.length; i++) {
        view.setUint8(offset + i, s.charCodeAt(i));
    }
}

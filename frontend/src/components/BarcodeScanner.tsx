import { useEffect, useRef } from "react"
import { Html5Qrcode } from "html5-qrcode"

export default function BarcodeScanner({
                                           onScan,
                                           onClose,
                                       }: {
    onScan: (code: string) => void
    onClose: () => void
}) {
    const scannerRef = useRef<Html5Qrcode | null>(null)
    const isRunningRef = useRef(false)

    useEffect(() => {
        const scanner = new Html5Qrcode("reader")
        scannerRef.current = scanner

        const startScanner = async () => {
            try {
                await scanner.start(
                    { facingMode: "environment" },
                    { fps: 10, qrbox: { width: 250, height: 150 } },
                    (decodedText) => {
                        stopScanner()
                        onScan(decodedText)
                    },
                    (errorMessage) => {
                        // можно просто игнорировать
                        console.log("scan error", errorMessage)
                    }
                )
                isRunningRef.current = true
            } catch (err) {
                console.error("Scanner start failed:", err)
            }
        }

        const stopScanner = async () => {
            if (scannerRef.current && isRunningRef.current) {
                await scannerRef.current.stop()
                isRunningRef.current = false
            }
        }

        startScanner()

        return () => {
            stopScanner()
        }
    }, [])

    return (
        <div className="space-y-4">
            <div
                id="reader"
                className="w-full h-[450px] rounded-xl overflow-hidden"
            />
            <button
                onClick={onClose}
                className="rounded-md bg-red-500 px-4 py-2"
            >
                Закрыть
            </button>
        </div>
    )
}
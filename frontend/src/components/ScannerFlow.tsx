import { useState } from "react"
import { useTranslation } from "react-i18next"
import apiClient from "../services/api.ts"
import type { Product } from "../types/index.ts"
import BarcodeScanner from "./BarcodeScanner.tsx";

export default function ScannerFlow() {
    const { t } = useTranslation()
    const [scanning, setScanning] = useState(false)
    const [foundProduct, setFoundProduct] = useState<Product | null>(null)
    const [barcode, setBarcode] = useState("")
    const [qty, setQty] = useState(1)
    const [notFound, setNotFound] = useState(false)

    const handleScan = async (code: string) => {
        setBarcode(code)
        setScanning(false)

        try {
            const product = await apiClient.getProductByBarcode(code)

            if (product) {
                setFoundProduct(product)
                setNotFound(false)
            } else {
                setFoundProduct(null)
                setNotFound(true)
            }
        } catch (error) {
            console.error("Failed to fetch product by barcode:", error)
            setNotFound(true)
        }
    }

    const handleIncoming = async () => {
        if (!foundProduct) return

        await apiClient.createProduct({
            name: foundProduct.name,
            barcode: foundProduct.barcode,
        })

        alert(t('dashboard.productAdded'))
        reset()
    }

    const handleCreateProduct = async () => {
        if (!barcode) return

        const created = await apiClient.createProduct({
            name: t('dashboard.newProductDefaultName'),
            barcode: barcode,
        })

        setFoundProduct(created)
        setNotFound(false)
    }

    const reset = () => {
        setFoundProduct(null)
        setBarcode("")
        setQty(1)
        setNotFound(false)
    }

    return (
        <div className="space-y-6">

            <button
                onClick={() => setScanning(true)}
                className="rounded-md bg-indigo-500 px-6 py-3 font-semibold"
            >
                📷 {t('dashboard.scanProduct')}
            </button>

            {scanning && (
                <BarcodeScanner
                    onScan={handleScan}
                    onClose={() => setScanning(false)}
                />
            )}

            {foundProduct && (
                <div className="rounded-xl bg-white/10 p-6 ring-1 ring-white/20 space-y-4">
                    <h3 className="text-lg font-semibold">
                        {foundProduct.name}
                    </h3>
                    {barcode && (
                        <p className="text-gray-400">
                            {t('dashboard.scanned')}: {barcode}
                        </p>
                    )}
                    <p className="text-gray-300">
                        {t('dashboard.barcode')}: {foundProduct.barcode}
                    </p>

                    <input
                        type="number"
                        min={1}
                        value={qty}
                        onChange={(e) => setQty(Number(e.target.value))}
                        className="w-full rounded-md bg-white/10 px-4 py-2 ring-1 ring-white/20"
                        placeholder={t('dashboard.quantityPlaceholder')}
                    />

                    <button
                        onClick={handleIncoming}
                        className="rounded-md bg-green-500 px-4 py-2"
                    >
                        {t('dashboard.confirmIncoming')}
                    </button>
                </div>
            )}

            {notFound && (
                <div className="rounded-xl bg-red-500/10 p-6 ring-1 ring-red-500/30 space-y-4">
                    <p>{t('dashboard.productNotFound')}</p>

                    <button
                        className="rounded-md bg-indigo-500 px-4 py-2"
                        onClick={handleCreateProduct}
                    >
                        ➕ {t('dashboard.createNewProduct')}
                    </button>
                </div>
            )}
        </div>
    )
}
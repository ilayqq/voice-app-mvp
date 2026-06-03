import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader2, X } from 'lucide-react'
import type { PendingVoiceStock } from '../hooks/useVoiceRecorder.ts'

type Props = {
    pending: PendingVoiceStock
    confirming: boolean
    onConfirm: (quantity: number) => void
    onCancel: () => void
}

export default function VoiceStockConfirmModal({
    pending,
    confirming,
    onConfirm,
    onCancel,
}: Props) {
    const { t } = useTranslation()
    const [quantity, setQuantity] = useState(String(pending.quantity))

    const qty = parseInt(quantity, 10)
    const valid = Number.isFinite(qty) && qty > 0

    const title =
        pending.type === 'outgoing'
            ? t('voice.confirmOutgoingTitle')
            : t('voice.confirmIncomingTitle')

    return (
        <div
            className="fixed inset-0 z-40 flex items-end sm:items-center justify-center
                       bg-black/60 backdrop-blur-sm px-4 pb-4 sm:pb-0"
            onClick={(e) => e.target === e.currentTarget && !confirming && onCancel()}
        >
            <div
                role="dialog"
                aria-modal="true"
                className="w-full max-w-lg rounded-2xl bg-[#1a1a2e] ring-1 ring-white/15 text-white overflow-hidden"
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <h2 className="text-lg font-semibold">{title}</h2>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={confirming}
                        className="rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50"
                        aria-label={t('voice.cancel')}
                    >
                        <X size={18} aria-hidden />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">
                            {t('voice.confirmProductLabel')}
                        </label>
                        <p className="text-base font-medium">{pending.productName}</p>
                    </div>

                    <div>
                        <label htmlFor="voice-qty" className="block text-sm text-gray-400 mb-1">
                            {t('voice.confirmQuantityLabel')}
                        </label>
                        <input
                            id="voice-qty"
                            type="number"
                            min={1}
                            inputMode="numeric"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            disabled={confirming}
                            className="w-full rounded-xl bg-white/10 px-4 py-3 text-lg font-semibold
                                       ring-1 ring-white/15 focus:ring-indigo-400 outline-none
                                       disabled:opacity-60"
                        />
                    </div>
                </div>

                <div className="flex gap-3 px-6 py-4 border-t border-white/10">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={confirming}
                        className="flex-1 rounded-xl py-3 font-semibold bg-white/10 hover:bg-white/15
                                   transition-colors disabled:opacity-50"
                    >
                        {t('voice.cancel')}
                    </button>
                    <button
                        type="button"
                        onClick={() => valid && onConfirm(qty)}
                        disabled={confirming || !valid}
                        className="flex-1 rounded-xl py-3 font-semibold bg-indigo-500
                                   hover:bg-indigo-400 transition-colors disabled:opacity-50
                                   inline-flex items-center justify-center gap-2"
                    >
                        {confirming && <Loader2 size={18} className="animate-spin" aria-hidden />}
                        {t('voice.confirm')}
                    </button>
                </div>
            </div>
        </div>
    )
}

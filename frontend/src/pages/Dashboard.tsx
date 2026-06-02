import Layout from '../components/Layout.tsx'
import type { StockMovementResponse, AnalyticsSummary } from '../types/index.ts'
import { useTranslation } from 'react-i18next'
import { useCallback, useEffect, useState } from 'react'
import apiClient from '../services/api.ts'
import { motion, type Variants} from 'framer-motion'
import { formatMoney } from '../utils/format.ts'

const DASHBOARD_REFRESH_MS = 3000

export default function Dashboard() {
    const { t } = useTranslation()
    const [movements, setMovements] = useState<StockMovementResponse[]>([])
    const [summary, setSummary] = useState<AnalyticsSummary | null>(null)

    const refreshDashboard = useCallback(async () => {
        try {
            const [summaryData, movementsData] = await Promise.all([
                apiClient.getAnalyticsSummary(),
                apiClient.getStockMovements(),
            ])
            setSummary(summaryData)
            setMovements(movementsData)
        } catch {
            // keep last successful data on transient errors
        }
    }, [])

    useEffect(() => {
        void refreshDashboard()

        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                void refreshDashboard()
            }
        }, DASHBOARD_REFRESH_MS)

        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                void refreshDashboard()
            }
        }
        document.addEventListener('visibilitychange', onVisibilityChange)

        return () => {
            clearInterval(interval)
            document.removeEventListener('visibilitychange', onVisibilityChange)
        }
    }, [refreshDashboard])

    const [page, setPage] = useState(0)
    const perPage = 5

    const totalPages = Math.max(1, Math.ceil(movements.length / perPage))
    const pagedMovements = movements.slice(page * perPage, (page + 1) * perPage)

    return (
        <Layout title={t('dashboard.title')}>
            <div className="relative isolate px-6 pt-14 lg:px-8 text-white">

                <div
                    aria-hidden="true"
                    className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
                >
                    <div
                        style={{
                            clipPath:
                                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                        }}
                        className="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5
                       -translate-x-1/2 rotate-30 bg-linear-to-tr
                       from-[#ff80b5] to-[#9089fc] opacity-30
                       sm:left-[calc(50%-30rem)] sm:w-288.75"
                    />
                </div>

                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={pageVariants}
                    className="mx-auto max-w-6xl space-y-6"
                >

                    <motion.div
                        variants={staggerVariants}
                        className="grid grid-cols-2 gap-4 sm:grid-cols-4"
                    >
                        <StatCard
                            value={summary?.products_count ?? '—'}
                            label={t('dashboard.products')}
                        />
                        <StatCard
                            value={summary ? formatMoney(summary.turnover_today) : '—'}
                            label={t('dashboard.turnover')}
                            subtitle={summary ? t('dashboard.turnoverMonth', { amount: formatMoney(summary.turnover_month) }) : undefined}
                        />
                        <StatCard
                            value={summary?.low_stock_count ?? '—'}
                            label={t('dashboard.lowStock')}
                        />
                        <StatCard
                            value={summary?.operations_today ?? '—'}
                            label={t('dashboard.operationsToday')}
                        />
                    </motion.div>

                    <motion.div
                        variants={itemVariants}
                        className="rounded-xl bg-white/10 p-6 ring-1 ring-white/20 space-y-4"
                    >
                        <h2 className="text-lg font-semibold">
                            {t('dashboard.recentOperations')}
                        </h2>
                        {movements.length === 0 ? (
                            <p className="text-sm text-gray-400">{t('dashboard.noOperations')}</p>
                        ) : (
                            <>
                                <ul className="divide-y divide-white/10">
                                    {pagedMovements.map(m => (
                                        <li key={m.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium truncate">
                                                    {m.product_name || m.barcode}
                                                </p>
                                                <p className="text-gray-400 text-xs">
                                                    {new Date(m.created_at).toLocaleString()}
                                                    {m.description && ` — ${m.description}`}
                                                </p>
                                            </div>
                                            <div className="shrink-0 text-right space-y-1">
                                                <span
                                                    className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                                                        m.type === 'incoming'
                                                            ? 'bg-green-500/20 text-green-300'
                                                            : 'bg-red-500/20 text-red-300'
                                                    }`}
                                                >
                                                    {m.type === 'incoming'
                                                        ? `+${m.quantity} ${t('dashboard.incomingLabel')}`
                                                        : `-${m.quantity} ${t('dashboard.outgoingLabel')}`}
                                                </span>
                                                {(m.amount ?? 0) > 0 && (
                                                    <p className="text-xs text-gray-300 font-mono">
                                                        {formatMoney(m.amount!)}
                                                    </p>
                                                )}
                                            </div>
                                        </li>
                                    ))}
                                </ul>

                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between pt-2">
                                        <button
                                            onClick={() => setPage(p => Math.max(0, p - 1))}
                                            disabled={page === 0}
                                            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium
                                            hover:bg-white/15 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            ← {t('dashboard.prev')}
                                        </button>
                                        <span className="text-sm text-gray-400">
                                            {page + 1} / {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                            disabled={page >= totalPages - 1}
                                            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium
                                            hover:bg-white/15 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                        >
                                            {t('dashboard.next')} →
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </motion.div>

                    {summary && (
                        <motion.div
                            variants={itemVariants}
                            className="rounded-xl bg-white/10 p-6 ring-1 ring-white/20"
                        >
                            <h2 className="text-lg font-semibold mb-4">{t('dashboard.turnoverDetails')}</h2>
                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <TurnoverRow
                                    label={t('dashboard.outgoingToday')}
                                    value={formatMoney(summary.outgoing_today)}
                                    variant="outgoing"
                                />
                                <TurnoverRow
                                    label={t('dashboard.incomingToday')}
                                    value={formatMoney(summary.incoming_today)}
                                    variant="incoming"
                                />
                                <TurnoverRow
                                    label={t('dashboard.outgoingTotal')}
                                    value={formatMoney(summary.outgoing_value)}
                                    variant="outgoing"
                                />
                                <TurnoverRow
                                    label={t('dashboard.incomingTotal')}
                                    value={formatMoney(summary.incoming_value)}
                                    variant="incoming"
                                />
                            </div>
                            <p className="mt-4 text-xs text-gray-400">
                                {t('dashboard.inventoryValue')}: {formatMoney(summary.inventory_value)}
                            </p>
                        </motion.div>
                    )}
                </motion.div>

                <div
                    aria-hidden="true"
                    className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
                >
                    <div
                        style={{
                            clipPath:
                                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                        }}
                        className="relative left-[calc(50%+3rem)] aspect-1155/678 w-144.5
                       -translate-x-1/2 bg-linear-to-tr
                       from-[#ff80b5] to-[#9089fc] opacity-30
                       sm:left-[calc(50%+36rem)] sm:w-288.75"
                    />
                </div>
            </div>
        </Layout>
    )
}

const pageVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.12 },
    },
}

const staggerVariants: Variants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.1 } },
}

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: 'easeOut' },
    },
}

function StatCard({
    value,
    label,
    subtitle,
}: {
    value: React.ReactNode
    label: string
    subtitle?: string
}) {
    return (
        <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.03 }}
            className="rounded-xl bg-white/10 p-5 ring-1 ring-white/20"
        >
            <div className="text-2xl font-semibold">{value}</div>
            <div className="text-sm text-gray-300">{label}</div>
            {subtitle && <div className="text-xs text-gray-500 mt-1">{subtitle}</div>}
        </motion.div>
    )
}

function TurnoverRow({
    label,
    value,
    variant,
}: {
    label: string
    value: string
    variant: 'incoming' | 'outgoing'
}) {
    const colors =
        variant === 'incoming'
            ? 'bg-green-500/10 ring-green-500/30 text-green-200'
            : 'bg-red-500/10 ring-red-500/30 text-red-200'

    return (
        <div className={`rounded-xl p-4 ring-1 ${colors}`}>
            <div className="text-xs opacity-80 mb-1">{label}</div>
            <div className="text-xl font-semibold">{value}</div>
        </div>
    )
}

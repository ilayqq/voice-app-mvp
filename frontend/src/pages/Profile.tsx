import { useRef, useState } from 'react'
import Layout from '../components/Layout.tsx'
import { useAuth } from '../context/AuthContext.tsx'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher.tsx'
import { motion, AnimatePresence, type Variants } from 'framer-motion'

/* ─────────────────────────────────────────────
   EDIT MODAL
───────────────────────────────────────────── */
type EditSection = 'info' | 'password'

function EditModal({
                       section,
                       onClose,
                   }: {
    section: EditSection
    onClose: () => void
}) {
    const { user, updateUser } = useAuth()
    const fileRef = useRef<HTMLInputElement>(null)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)

    const [name, setName] = useState(user?.full_name ?? '')
    const [phone, setPhone] = useState(user?.phone_number ?? '')
    const [avatarPreview, setAvatarPreview] = useState<string | null>(user?.avatar ?? null)

    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const handleAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setAvatarPreview(URL.createObjectURL(file))
        // TODO: загрузить на сервер когда бэк будет готов
    }

    const handleSaveInfo = async () => {
        setError(null)
        setSaving(true)
        try {
            await updateUser({
                full_name: name || undefined,
                phone_number: phone || undefined,
            })
            setSuccess(true)
            setTimeout(onClose, 800)
        } catch (e: any) {
            setError(e.message ?? 'Ошибка сохранения')
        } finally {
            setSaving(false)
        }
    }

    const handleSavePassword = async () => {
        setError(null)
        if (newPassword.length < 6) {
            setError('Минимум 6 символов')
            return
        }
        if (newPassword !== confirmPassword) {
            setError('Пароли не совпадают')
            return
        }
        setSaving(true)
        try {
            // TODO: подключить эндпоинт смены пароля когда появится
            await new Promise(r => setTimeout(r, 600))
            setSuccess(true)
            setTimeout(onClose, 800)
        } catch (e: any) {
            setError(e.message ?? 'Ошибка сохранения')
        } finally {
            setSaving(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
                       bg-black/60 backdrop-blur-sm px-4 pb-4 sm:pb-0"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 60 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="w-full max-w-lg rounded-2xl bg-[#1a1a2e] ring-1 ring-white/15 text-white overflow-hidden"
            >
                {/* HEADER */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                    <h2 className="text-lg font-semibold">
                        {section === 'info' ? '✏️ Редактировать профиль' : '🔒 Сменить пароль'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="rounded-lg p-1.5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* BODY */}
                <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
                    {section === 'info' ? (
                        <>
                            {/* AVATAR */}
                            <div className="flex flex-col items-center gap-2">
                                <div
                                    onClick={() => fileRef.current?.click()}
                                    className="relative w-20 h-20 rounded-full overflow-hidden cursor-pointer
                                               bg-indigo-500/20 ring-2 ring-indigo-400/40 flex items-center justify-center"
                                >
                                    {avatarPreview ? (
                                        <>
                                            <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100
                                                            transition-opacity flex items-center justify-center text-xs">
                                                Изменить
                                            </div>
                                        </>
                                    ) : (
                                        <span className="text-2xl font-bold">
                                            {user?.full_name?.[0]?.toUpperCase() || user?.phone_number?.[0] || 'U'}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => fileRef.current?.click()}
                                    className="text-xs text-indigo-300 hover:text-indigo-200 transition-colors"
                                >
                                    📷 Загрузить фото (скоро)
                                </button>
                                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
                            </div>

                            <Field label="Имя" value={name} onChange={setName} placeholder="Введите имя" />
                            <Field label="Телефон" value={phone} onChange={setPhone} placeholder="+7..." mono />
                        </>
                    ) : (
                        <>
                            <Field
                                label="Новый пароль"
                                value={newPassword}
                                onChange={setNewPassword}
                                type="password"
                                placeholder="Минимум 6 символов"
                            />
                            <Field
                                label="Подтвердите пароль"
                                value={confirmPassword}
                                onChange={setConfirmPassword}
                                type="password"
                                placeholder="Повторите пароль"
                            />
                        </>
                    )}

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="rounded-lg bg-rose-500/20 ring-1 ring-rose-500/40 px-4 py-2.5 text-sm text-rose-300"
                            >
                                {error}
                            </motion.div>
                        )}
                        {success && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-lg bg-emerald-500/20 ring-1 ring-emerald-500/40 px-4 py-2.5 text-sm text-emerald-300"
                            >
                                ✓ Сохранено
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* FOOTER */}
                <div className="flex gap-3 px-6 py-4 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-xl py-3 font-semibold bg-white/10 hover:bg-white/15 transition-colors"
                    >
                        Отмена
                    </button>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={section === 'info' ? handleSaveInfo : handleSavePassword}
                        disabled={saving || success}
                        className="flex-1 rounded-xl py-3 font-semibold bg-indigo-500
                                   hover:bg-indigo-400 transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Сохранение...' : success ? '✓ Готово' : 'Сохранить'}
                    </motion.button>
                </div>
            </motion.div>
        </motion.div>
    )
}

/* ─────────────────────────────────────────────
   PROFILE PAGE
───────────────────────────────────────────── */
export default function Profile() {
    const { user, logout } = useAuth()
    const { t } = useTranslation()
    const [editSection, setEditSection] = useState<EditSection | null>(null)

    const handleLogout = () => {
        if (confirm('Вы уверены, что хотите выйти?')) {
            logout()
        }
    }

    const initials =
        user?.full_name?.[0]?.toUpperCase() ||
        user?.phone_number?.[0]?.toUpperCase() ||
        'U'

    return (
        <Layout title={t('profile.title')} showBack>
            <div className="relative isolate px-6 pt-10 lg:px-8 text-white">

                {/* TOP GRADIENT BLUR */}
                <div aria-hidden="true" className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
                    <div
                        style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}
                        className="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-288.75"
                    />
                </div>

                <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={pageVariants}
                    className="mx-auto max-w-xl space-y-5"
                >
                    {/* AVATAR + NAME */}
                    <motion.div variants={itemVariants} className="flex flex-col items-center gap-3 pt-4">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="relative flex h-20 w-20 items-center justify-center rounded-full
                                       bg-indigo-500/20 ring-2 ring-indigo-400/40 text-3xl font-bold overflow-hidden"
                        >
                            {user?.avatar ? (
                                <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                            ) : initials}
                        </motion.div>
                        <div className="text-center">
                            <div className="text-xl font-bold">{user?.full_name || '—'}</div>
                            <div className="text-sm text-gray-400">{user?.phone_number}</div>
                        </div>
                    </motion.div>

                    {/* SETTINGS CARD */}
                    <motion.div variants={itemVariants} className="rounded-xl bg-white/10 ring-1 ring-white/20 overflow-hidden">
                        <div className="px-6 py-3 border-b border-white/10">
                            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Настройки профиля</h2>
                        </div>
                        <div className="divide-y divide-white/10">
                            <SettingsRow
                                icon="👤"
                                label="Имя и телефон"
                                value={user?.full_name || user?.phone_number || '—'}
                                onClick={() => setEditSection('info')}
                            />
                            <SettingsRow
                                icon="🔒"
                                label="Пароль"
                                value="Изменить пароль"
                                onClick={() => setEditSection('password')}
                            />
                            <SettingsRow
                                icon="📷"
                                label="Аватарка"
                                value="Скоро будет доступно"
                                disabled
                            />
                        </div>
                    </motion.div>

                    {/* LANGUAGE */}
                    <motion.div variants={itemVariants} className="rounded-xl bg-white/10 p-5 ring-1 ring-white/20 space-y-3">
                        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Язык интерфейса</h2>
                        <LanguageSwitcher />
                    </motion.div>

                    {/* LOGOUT */}
                    <motion.div variants={itemVariants} className="pb-10">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={handleLogout}
                            className="w-full rounded-xl bg-rose-500/80 py-3.5 font-semibold hover:bg-rose-500 transition-colors"
                        >
                            Выйти
                        </motion.button>
                    </motion.div>
                </motion.div>

                {/* BOTTOM GRADIENT BLUR */}
                <div aria-hidden="true" className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
                    <div
                        style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}
                        className="relative left-[calc(50%+3rem)] aspect-1155/678 w-144.5 -translate-x-1/2 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-288.75"
                    />
                </div>
            </div>

            <AnimatePresence>
                {editSection && (
                    <EditModal
                        section={editSection}
                        onClose={() => setEditSection(null)}
                    />
                )}
            </AnimatePresence>
        </Layout>
    )
}

/* ---------- animations ---------- */

const pageVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}
const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

/* ---------- UI helpers ---------- */

function SettingsRow({
                         icon, label, value, onClick, disabled,
                     }: {
    icon: string
    label: string
    value: string
    onClick?: () => void
    disabled?: boolean
}) {
    return (
        <motion.button
            whileHover={!disabled ? { backgroundColor: 'rgba(255,255,255,0.05)' } : undefined}
            onClick={onClick}
            disabled={disabled}
            className="w-full flex items-center gap-4 px-6 py-4 text-left transition-colors disabled:opacity-40"
        >
            <span className="text-xl w-7 text-center">{icon}</span>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium">{label}</div>
                <div className="text-xs text-gray-400 truncate mt-0.5">{value}</div>
            </div>
            {!disabled && <span className="text-gray-500 text-lg leading-none">›</span>}
        </motion.button>
    )
}

function Field({
                   label, value, onChange, placeholder, mono, type = 'text',
               }: {
    label: string
    value: string
    onChange: (v: string) => void
    placeholder?: string
    mono?: boolean
    type?: string
}) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs text-gray-400 uppercase tracking-wide">{label}</label>
            <input
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className={`w-full rounded-xl bg-white/5 ring-1 ring-white/15 px-4 py-3 text-sm text-white
                            placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60
                            transition-all ${mono ? 'font-mono text-indigo-300' : ''}`}
            />
        </div>
    )
}
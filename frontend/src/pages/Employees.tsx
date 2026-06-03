import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { apiClient, type AddEmployeeRequest, type CompanyEmployee } from '../services/api'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

const ROLES: AddEmployeeRequest['role'][] = ['manager', 'employee']

export default function Employees() {
  const { t } = useTranslation()
  const { isOwner } = useAuth()
  const [employees, setEmployees] = useState<CompanyEmployee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<AddEmployeeRequest>({
    phone_number: '',
    role: 'employee',
  })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const list = await apiClient.getEmployees()
      setEmployees(list)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('employees.loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOwner) {
      load()
    }
  }, [isOwner])

  if (!isOwner) {
    return <Navigate to="/profile" replace />
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await apiClient.addEmployee(form)
      setForm({ phone_number: '', role: 'employee' })
      setShowForm(false)
      await load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('employees.addError'))
    } finally {
      setSaving(false)
    }
  }

  const handleRoleChange = async (memberId: number, role: string) => {
    try {
      await apiClient.updateEmployeeRole(memberId, role)
      await load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('employees.updateError'))
    }
  }

  const handleRemove = async (member: CompanyEmployee) => {
    if (member.role === 'owner') return
    if (!confirm(t('employees.removeConfirm', { name: member.full_name || member.phone_number }))) return
    try {
      await apiClient.removeEmployee(member.id)
      await load()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('employees.removeError'))
    }
  }

  const roleLabel = (role: string) => {
    if (role === 'owner') return t('employees.roleOwner')
    if (role === 'manager') return t('employees.roleManager')
    return t('employees.roleEmployee')
  }

  return (
    <Layout title={t('employees.title')} showBack>
      <div className="relative isolate px-6 pt-8 lg:px-8 text-white">
        <div className="mx-auto max-w-xl space-y-4">
          <p className="text-sm text-gray-400">{t('employees.subtitle')}</p>

          {error && (
            <div className="rounded-lg bg-rose-500/20 ring-1 ring-rose-500/40 px-4 py-2 text-sm text-rose-300">
              {error}
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowForm(!showForm)}
            className="w-full rounded-xl bg-indigo-500 py-3 font-semibold hover:bg-indigo-400 transition-colors"
          >
            {showForm ? t('employees.cancelAdd') : t('employees.addButton')}
          </motion.button>

          {showForm && (
            <form onSubmit={handleAdd} className="rounded-xl bg-white/10 ring-1 ring-white/20 p-5 space-y-3">
              <p className="text-sm text-gray-400">{t('employees.phoneHint')}</p>
              <input
                type="tel"
                required
                placeholder={t('login.phone_placeholder') + ' *'}
                value={form.phone_number}
                onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))}
                className="w-full rounded-xl bg-white/5 ring-1 ring-white/15 px-4 py-3 text-sm"
              />
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value as AddEmployeeRequest['role'] }))}
                className="w-full rounded-xl bg-white/5 ring-1 ring-white/15 px-4 py-3 text-sm"
              >
                {ROLES.map(r => (
                  <option key={r} value={r} className="bg-slate-900">
                    {roleLabel(r)}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl bg-emerald-600 py-3 font-semibold disabled:opacity-50"
              >
                {saving ? t('employees.saving') : t('employees.save')}
              </button>
            </form>
          )}

          {loading ? (
            <p className="text-center text-gray-400 py-8">{t('employees.loading')}</p>
          ) : (
            <div className="rounded-xl bg-white/10 ring-1 ring-white/20 divide-y divide-white/10 overflow-hidden">
              {employees.length === 0 ? (
                <p className="p-6 text-center text-gray-400">{t('employees.empty')}</p>
              ) : (
                employees.map(emp => (
                  <div key={emp.id} className="px-5 py-4 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="font-medium">{emp.full_name || '—'}</div>
                        <div className="text-sm text-gray-400">{emp.phone_number}</div>
                      </div>
                      {emp.role !== 'owner' && (
                        <button
                          type="button"
                          onClick={() => handleRemove(emp)}
                          className="text-xs text-rose-400 hover:text-rose-300"
                        >
                          {t('employees.remove')}
                        </button>
                      )}
                    </div>
                    {emp.role === 'owner' ? (
                      <span className="inline-block text-xs px-2 py-1 rounded bg-amber-500/20 text-amber-200">
                        {roleLabel(emp.role)}
                      </span>
                    ) : (
                      <select
                        value={emp.role}
                        onChange={e => handleRoleChange(emp.id, e.target.value)}
                        className="text-sm rounded-lg bg-white/5 ring-1 ring-white/15 px-3 py-1.5"
                      >
                        {ROLES.map(r => (
                          <option key={r} value={r} className="bg-slate-900">
                            {roleLabel(r)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

import { useState, useEffect } from 'react'
import { adminApi } from '@services/api/admin'
import { Users, Trash2, Mail, Search, Download } from 'lucide-react'
import { useConfirm } from '@shared/components/ConfirmDialog'
import toast from 'react-hot-toast'

export default function AbonnesList() {
  const confirm = useConfirm()
  const [abonnes, setAbonnes] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => { loadAbonnes() }, [])

  const loadAbonnes = async () => {
    try {
      const res = await adminApi.getAbonnes()
      setAbonnes(res.data.data || [])
    } catch (error) { console.error('Erreur:', error) }
    finally { setLoading(false) }
  }

  const handleDelete = async (id) => {
    if (!await confirm({ title: 'Supprimer cet abonné ?', message: 'Cette action est irréversible.', confirmLabel: 'Supprimer' })) return
    try {
      await adminApi.deleteAbonne(id)
      loadAbonnes()
    } catch (error) { toast.error('Une erreur est survenue.') }
  }

  const handleExport = () => {
    const csv = abonnes.map(a => `${a.nom || ''},${a.email},${a.statut},${a.created_at}`).join('\n')
    const blob = new Blob([`Nom,Email,Statut,Date\\n${csv}`], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'abonnes-newsletter.csv'
    a.click()
  }

  const filteredAbonnes = abonnes.filter(a =>
    (a.nom?.toLowerCase() || '').includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="text-center py-10">Chargement...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-sept-accent">Diffusion & Audience</span>
          <h1 className="text-2xl font-serif font-bold text-sept-blue-strong uppercase tracking-wide flex items-center gap-2">
            <Users className="w-6 h-6 text-sept-accent" />
            Abonnés Newsletter
          </h1>
        </div>
        <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exporter CSV
        </button>
      </div>

      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-none shadow-sm border border-gray-200">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder="Rechercher par nom ou email..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10" />
        </div>
      </div>

      <div className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs uppercase font-bold tracking-wider text-gray-600">Nom</th>
              <th className="px-4 py-3 text-left text-xs uppercase font-bold tracking-wider text-gray-600">Email</th>
              <th className="px-4 py-3 text-left text-xs uppercase font-bold tracking-wider text-gray-600">Statut</th>
              <th className="px-4 py-3 text-left text-xs uppercase font-bold tracking-wider text-gray-600">Date d'inscription</th>
              <th className="px-4 py-3 text-right text-xs uppercase font-bold tracking-wider text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredAbonnes.map((abonne) => (
              <tr key={abonne.id} className="hover:bg-gray-50 transition">
                <td className="px-4 py-3 text-sm font-bold text-sept-blue-strong">{abonne.nom || '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1 font-mono text-xs">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    {abonne.email}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider border ${abonne.statut === 'actif' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {abonne.statut}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500 font-mono">{new Date(abonne.created_at).toLocaleDateString('fr-FR')}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(abonne.id)} className="p-1.5 text-red-600 hover:bg-red-600 hover:text-white border border-gray-200 rounded-none transition" title="Supprimer">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredAbonnes.length === 0 && <div className="text-center py-8 text-gray-400">Aucun abonné trouvé</div>}
      </div>
    </div>
  )
}

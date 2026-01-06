'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Plus, Users, Edit2, Trash2, Save, Phone } from 'lucide-react'
import { Modal } from '@/components/Modal'

interface Porter {
    id: string
    name: string
    phone: string
    status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE'
    createdAt: string
}

const MOCK_PORTERS: Porter[] = [
    { id: 'p1', name: 'Carlos Lopez', phone: '0922-111-2222', status: 'ACTIVE', createdAt: '2024-01-15' },
    { id: 'p2', name: 'Ana Mendez', phone: '0923-222-3333', status: 'ACTIVE', createdAt: '2024-02-20' },
    { id: 'p3', name: 'Luis Torres', phone: '0924-333-4444', status: 'ACTIVE', createdAt: '2024-03-10' },
    { id: 'p4', name: 'Rosa Fernandez', phone: '0925-444-5555', status: 'ON_LEAVE', createdAt: '2024-04-05' },
]

export default function PortersPage() {
    const [porters, setPorters] = useState<Porter[]>(MOCK_PORTERS)
    const [showModal, setShowModal] = useState(false)
    const [editingPorter, setEditingPorter] = useState<Porter | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
    const [formData, setFormData] = useState({ name: '', phone: '', status: 'ACTIVE' as Porter['status'] })

    const openCreateModal = () => {
        setEditingPorter(null)
        setFormData({ name: '', phone: '', status: 'ACTIVE' })
        setShowModal(true)
    }

    const openEditModal = (porter: Porter) => {
        setEditingPorter(porter)
        setFormData({ name: porter.name, phone: porter.phone, status: porter.status })
        setShowModal(true)
    }

    const handleSave = () => {
        if (editingPorter) {
            setPorters(porters.map(p => p.id === editingPorter.id ? { ...p, ...formData } : p))
        } else {
            setPorters([...porters, { id: `p${Date.now()}`, ...formData, createdAt: new Date().toISOString().split('T')[0] }])
        }
        setShowModal(false)
    }

    const handleDelete = (id: string) => {
        setPorters(porters.filter(p => p.id !== id))
        setShowDeleteConfirm(null)
    }

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = { ACTIVE: 'bg-green-100 text-green-700', ON_LEAVE: 'bg-yellow-100 text-yellow-700', INACTIVE: 'bg-gray-100 text-gray-700' }
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>{status.replace('_', ' ')}</span>
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <Link href="/admin" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"><ArrowLeft className="h-4 w-4" /> Back to Admin</Link>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg"><Users className="h-6 w-6 text-purple-600" /></div>
                        <div><h1 className="text-2xl font-bold text-gray-900">Porters</h1><p className="text-gray-500">Manage porter records</p></div>
                    </div>
                </div>
                <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"><Plus className="h-4 w-4" /> Add Porter</button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead><tr className="border-b border-gray-100 bg-gray-50">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                        {porters.map((porter) => (
                            <tr key={porter.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{porter.name}</td>
                                <td className="px-6 py-4 text-gray-600 flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400" />{porter.phone}</td>
                                <td className="px-6 py-4">{getStatusBadge(porter.status)}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => openEditModal(porter)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="h-4 w-4" /></button>
                                    <button onClick={() => setShowDeleteConfirm(porter.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg ml-1"><Trash2 className="h-4 w-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingPorter ? 'Edit Porter' : 'Add New Porter'}>
                <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="e.g. Carlos Lopez" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label><input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="e.g. 0922-111-2222" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as Porter['status'] })} className="w-full px-3 py-2 border border-gray-200 rounded-lg"><option value="ACTIVE">Active</option><option value="ON_LEAVE">On Leave</option><option value="INACTIVE">Inactive</option></select></div>
                    <div className="flex gap-3 pt-4">
                        <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                        <button onClick={handleSave} disabled={!formData.name} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"><Save className="h-4 w-4" /> {editingPorter ? 'Save' : 'Create'}</button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)} title="Delete Porter" size="sm">
                <div className="space-y-4">
                    <p className="text-gray-600">Are you sure you want to delete this porter?</p>
                    <div className="flex gap-3">
                        <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                        <button onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

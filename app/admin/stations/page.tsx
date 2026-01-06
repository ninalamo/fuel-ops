'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Plus, MapPin, Edit2, Trash2, Save, Building2 } from 'lucide-react'
import { Modal } from '@/components/Modal'

interface Station {
    id: string
    name: string
    customer: string
    address: string
    city: string
    status: 'ACTIVE' | 'INACTIVE'
}

const MOCK_STATIONS: Station[] = [
    { id: 's1', name: 'Shell EDSA', customer: 'Shell Philippines', address: '123 EDSA Avenue', city: 'Quezon City', status: 'ACTIVE' },
    { id: 's2', name: 'Shell Ortigas', customer: 'Shell Philippines', address: '456 Ortigas Ave', city: 'Pasig', status: 'ACTIVE' },
    { id: 's3', name: 'Petron Makati', customer: 'Petron Corporation', address: '789 Ayala Ave', city: 'Makati', status: 'ACTIVE' },
    { id: 's4', name: 'Petron BGC', customer: 'Petron Corporation', address: '321 Bonifacio High St', city: 'Taguig', status: 'ACTIVE' },
    { id: 's5', name: 'Caltex BGC', customer: 'Caltex Philippines', address: '555 Market Drive', city: 'Taguig', status: 'ACTIVE' },
    { id: 's6', name: 'Phoenix Alabang', customer: 'Phoenix Petroleum', address: '999 Alabang-Zapote Rd', city: 'Muntinlupa', status: 'ACTIVE' },
    { id: 's7', name: 'Shell Commonwealth', customer: 'Shell Philippines', address: '888 Commonwealth Ave', city: 'Quezon City', status: 'INACTIVE' },
]

const CUSTOMERS = ['Shell Philippines', 'Petron Corporation', 'Caltex Philippines', 'Phoenix Petroleum', 'Seaoil Philippines']

export default function StationsPage() {
    const [stations, setStations] = useState<Station[]>(MOCK_STATIONS)
    const [showModal, setShowModal] = useState(false)
    const [editingStation, setEditingStation] = useState<Station | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
    const [formData, setFormData] = useState({ name: '', customer: '', address: '', city: '', status: 'ACTIVE' as Station['status'] })

    const openCreateModal = () => {
        setEditingStation(null)
        setFormData({ name: '', customer: '', address: '', city: '', status: 'ACTIVE' })
        setShowModal(true)
    }

    const openEditModal = (station: Station) => {
        setEditingStation(station)
        setFormData({ name: station.name, customer: station.customer, address: station.address, city: station.city, status: station.status })
        setShowModal(true)
    }

    const handleSave = () => {
        if (editingStation) {
            setStations(stations.map(s => s.id === editingStation.id ? { ...s, ...formData } : s))
        } else {
            setStations([...stations, { id: `s${Date.now()}`, ...formData }])
        }
        setShowModal(false)
    }

    const handleDelete = (id: string) => {
        setStations(stations.filter(s => s.id !== id))
        setShowDeleteConfirm(null)
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <Link href="/admin" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"><ArrowLeft className="h-4 w-4" /> Back to Admin</Link>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg"><MapPin className="h-6 w-6 text-red-600" /></div>
                        <div><h1 className="text-2xl font-bold text-gray-900">Stations</h1><p className="text-gray-500">Manage delivery stations/sites</p></div>
                    </div>
                </div>
                <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"><Plus className="h-4 w-4" /> Add Station</button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead><tr className="border-b border-gray-100 bg-gray-50">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Station</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Address</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">City</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                    </tr></thead>
                    <tbody className="divide-y divide-gray-50">
                        {stations.map((station) => (
                            <tr key={station.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2"><MapPin className="h-4 w-4 text-red-500" />{station.name}</td>
                                <td className="px-6 py-4 text-gray-600 flex items-center gap-2"><Building2 className="h-4 w-4 text-gray-400" />{station.customer}</td>
                                <td className="px-6 py-4 text-gray-600">{station.address}</td>
                                <td className="px-6 py-4 text-gray-600">{station.city}</td>
                                <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${station.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{station.status}</span></td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => openEditModal(station)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="h-4 w-4" /></button>
                                    <button onClick={() => setShowDeleteConfirm(station.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg ml-1"><Trash2 className="h-4 w-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingStation ? 'Edit Station' : 'Add New Station'} size="lg">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Station Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Customer</label><select value={formData.customer} onChange={(e) => setFormData({ ...formData, customer: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg"><option value="">Select customer...</option>{CUSTOMERS.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Address</label><input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">City</label><input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" /></div>
                        <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as Station['status'] })} className="w-full px-3 py-2 border border-gray-200 rounded-lg"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></div>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                        <button onClick={handleSave} disabled={!formData.name || !formData.customer} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"><Save className="h-4 w-4" /> {editingStation ? 'Save' : 'Create'}</button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)} title="Delete Station" size="sm">
                <div className="space-y-4">
                    <p className="text-gray-600">Are you sure you want to delete this station?</p>
                    <div className="flex gap-3">
                        <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                        <button onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

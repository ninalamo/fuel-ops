'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Plus, Fuel, Edit2, Trash2, Save } from 'lucide-react'
import { Modal } from '@/components/Modal'

interface FuelType {
    id: string
    code: string
    name: string
    color: string
    status: 'ACTIVE' | 'INACTIVE'
}

const MOCK_FUEL_TYPES: FuelType[] = [
    { id: 'f1', code: 'DIESEL', name: 'Diesel', color: '#3b82f6', status: 'ACTIVE' },
    { id: 'f2', code: 'UNL91', name: 'Unleaded 91', color: '#22c55e', status: 'ACTIVE' },
    { id: 'f3', code: 'UNL95', name: 'Unleaded 95', color: '#eab308', status: 'ACTIVE' },
    { id: 'f4', code: 'PREMIUM', name: 'Premium', color: '#a855f7', status: 'ACTIVE' },
]

export default function FuelTypesPage() {
    const [fuelTypes, setFuelTypes] = useState<FuelType[]>(MOCK_FUEL_TYPES)
    const [showModal, setShowModal] = useState(false)
    const [editingFuelType, setEditingFuelType] = useState<FuelType | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
    const [formData, setFormData] = useState({ code: '', name: '', color: '#3b82f6', status: 'ACTIVE' as FuelType['status'] })

    const openCreateModal = () => {
        setEditingFuelType(null)
        setFormData({ code: '', name: '', color: '#3b82f6', status: 'ACTIVE' })
        setShowModal(true)
    }

    const openEditModal = (fuelType: FuelType) => {
        setEditingFuelType(fuelType)
        setFormData({ code: fuelType.code, name: fuelType.name, color: fuelType.color, status: fuelType.status })
        setShowModal(true)
    }

    const handleSave = () => {
        if (editingFuelType) {
            setFuelTypes(fuelTypes.map(f => f.id === editingFuelType.id ? { ...f, ...formData } : f))
        } else {
            setFuelTypes([...fuelTypes, { id: `f${Date.now()}`, ...formData }])
        }
        setShowModal(false)
    }

    const handleDelete = (id: string) => {
        setFuelTypes(fuelTypes.filter(f => f.id !== id))
        setShowDeleteConfirm(null)
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <Link href="/admin" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"><ArrowLeft className="h-4 w-4" /> Back to Admin</Link>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-100 rounded-lg"><Fuel className="h-6 w-6 text-cyan-600" /></div>
                        <div><h1 className="text-2xl font-bold text-gray-900">Fuel Types</h1><p className="text-gray-500">Manage fuel product types</p></div>
                    </div>
                </div>
                <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700"><Plus className="h-4 w-4" /> Add Fuel Type</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {fuelTypes.map((fuelType) => (
                    <div key={fuelType.id} className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${fuelType.color}20` }}>
                                <Fuel className="h-6 w-6" style={{ color: fuelType.color }} />
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${fuelType.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{fuelType.status}</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{fuelType.name}</h3>
                        <p className="text-sm text-gray-500 mb-4">Code: {fuelType.code}</p>
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full border-2 border-gray-200" style={{ backgroundColor: fuelType.color }} />
                            <span className="text-xs text-gray-400">{fuelType.color}</span>
                        </div>
                        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                            <button onClick={() => openEditModal(fuelType)} className="flex-1 px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-center gap-1"><Edit2 className="h-3 w-3" /> Edit</button>
                            <button onClick={() => setShowDeleteConfirm(fuelType.id)} className="flex-1 px-3 py-1.5 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center gap-1"><Trash2 className="h-3 w-3" /> Delete</button>
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingFuelType ? 'Edit Fuel Type' : 'Add New Fuel Type'}>
                <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Code</label><input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="e.g. DIESEL" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="e.g. Diesel" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                        <div className="flex items-center gap-3">
                            <input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="w-12 h-10 border border-gray-200 rounded cursor-pointer" />
                            <input type="text" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="flex-1 px-3 py-2 border border-gray-200 rounded-lg" />
                        </div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Status</label><select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as FuelType['status'] })} className="w-full px-3 py-2 border border-gray-200 rounded-lg"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></div>
                    <div className="flex gap-3 pt-4">
                        <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                        <button onClick={handleSave} disabled={!formData.code || !formData.name} className="flex-1 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 flex items-center justify-center gap-2"><Save className="h-4 w-4" /> {editingFuelType ? 'Save' : 'Create'}</button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)} title="Delete Fuel Type" size="sm">
                <div className="space-y-4">
                    <p className="text-gray-600">Are you sure you want to delete this fuel type?</p>
                    <div className="flex gap-3">
                        <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                        <button onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

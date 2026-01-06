'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
    ArrowLeft,
    Plus,
    Truck,
    Edit2,
    Trash2,
    X,
    Save,
    Fuel
} from 'lucide-react'
import { Modal } from '@/components/Modal'

interface Compartment {
    id: string
    name: string
    maxVolume: number
    product: string
}

interface Tanker {
    id: string
    plateNumber: string
    capacity: number
    status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE'
    compartments: Compartment[]
    createdAt: string
}

// Mock data
const MOCK_TANKERS: Tanker[] = [
    {
        id: 'tanker-1',
        plateNumber: 'ABC-1234',
        capacity: 30000,
        status: 'ACTIVE',
        compartments: [
            { id: 'c1', name: 'C1', maxVolume: 7500, product: 'DIESEL' },
            { id: 'c2', name: 'C2', maxVolume: 7500, product: 'DIESEL' },
            { id: 'c3', name: 'C3', maxVolume: 7500, product: 'UNLEADED' },
            { id: 'c4', name: 'C4', maxVolume: 7500, product: 'UNLEADED' },
        ],
        createdAt: '2024-01-15',
    },
    {
        id: 'tanker-2',
        plateNumber: 'XYZ-5678',
        capacity: 25000,
        status: 'ACTIVE',
        compartments: [
            { id: 'c1', name: 'C1', maxVolume: 8500, product: 'DIESEL' },
            { id: 'c2', name: 'C2', maxVolume: 8500, product: 'DIESEL' },
            { id: 'c3', name: 'C3', maxVolume: 8000, product: 'UNLEADED' },
        ],
        createdAt: '2024-02-20',
    },
    {
        id: 'tanker-3',
        plateNumber: 'DEF-9012',
        capacity: 20000,
        status: 'MAINTENANCE',
        compartments: [
            { id: 'c1', name: 'C1', maxVolume: 10000, product: 'DIESEL' },
            { id: 'c2', name: 'C2', maxVolume: 10000, product: 'DIESEL' },
        ],
        createdAt: '2024-03-10',
    },
    {
        id: 'tanker-4',
        plateNumber: 'GHI-3456',
        capacity: 35000,
        status: 'ACTIVE',
        compartments: [
            { id: 'c1', name: 'C1', maxVolume: 7000, product: 'DIESEL' },
            { id: 'c2', name: 'C2', maxVolume: 7000, product: 'DIESEL' },
            { id: 'c3', name: 'C3', maxVolume: 7000, product: 'UNLEADED' },
            { id: 'c4', name: 'C4', maxVolume: 7000, product: 'UNLEADED' },
            { id: 'c5', name: 'C5', maxVolume: 7000, product: 'PREMIUM' },
        ],
        createdAt: '2024-04-05',
    },
]

const FUEL_TYPES = ['DIESEL', 'UNLEADED', 'UNLEADED 91', 'UNLEADED 95', 'PREMIUM']

export default function TankersPage() {
    const [tankers, setTankers] = useState<Tanker[]>(MOCK_TANKERS)
    const [showModal, setShowModal] = useState(false)
    const [editingTanker, setEditingTanker] = useState<Tanker | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        plateNumber: '',
        status: 'ACTIVE' as 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE',
        compartments: [] as Compartment[],
    })

    const openCreateModal = () => {
        setEditingTanker(null)
        setFormData({
            plateNumber: '',
            status: 'ACTIVE',
            compartments: [{ id: 'new-1', name: 'C1', maxVolume: 7500, product: 'DIESEL' }],
        })
        setShowModal(true)
    }

    const openEditModal = (tanker: Tanker) => {
        setEditingTanker(tanker)
        setFormData({
            plateNumber: tanker.plateNumber,
            status: tanker.status,
            compartments: [...tanker.compartments],
        })
        setShowModal(true)
    }

    const addCompartment = () => {
        const newNum = formData.compartments.length + 1
        setFormData({
            ...formData,
            compartments: [
                ...formData.compartments,
                { id: `new-${Date.now()}`, name: `C${newNum}`, maxVolume: 7500, product: 'DIESEL' },
            ],
        })
    }

    const removeCompartment = (id: string) => {
        setFormData({
            ...formData,
            compartments: formData.compartments.filter(c => c.id !== id),
        })
    }

    const updateCompartment = (id: string, field: keyof Compartment, value: string | number) => {
        setFormData({
            ...formData,
            compartments: formData.compartments.map(c =>
                c.id === id ? { ...c, [field]: value } : c
            ),
        })
    }

    const calculateTotalCapacity = () => {
        return formData.compartments.reduce((sum, c) => sum + c.maxVolume, 0)
    }

    const handleSave = () => {
        if (editingTanker) {
            // Update existing
            setTankers(tankers.map(t =>
                t.id === editingTanker.id
                    ? { ...t, ...formData, capacity: calculateTotalCapacity() }
                    : t
            ))
        } else {
            // Create new
            const newTanker: Tanker = {
                id: `tanker-${Date.now()}`,
                plateNumber: formData.plateNumber,
                capacity: calculateTotalCapacity(),
                status: formData.status,
                compartments: formData.compartments,
                createdAt: new Date().toISOString().split('T')[0],
            }
            setTankers([...tankers, newTanker])
        }
        setShowModal(false)
    }

    const handleDelete = (id: string) => {
        setTankers(tankers.filter(t => t.id !== id))
        setShowDeleteConfirm(null)
    }

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            ACTIVE: 'bg-green-100 text-green-700',
            MAINTENANCE: 'bg-yellow-100 text-yellow-700',
            INACTIVE: 'bg-gray-100 text-gray-700',
        }
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
                {status}
            </span>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <Link
                        href="/admin"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Admin
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Truck className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Tankers</h1>
                            <p className="text-gray-500">Manage fleet tankers and their compartments</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                    <Plus className="h-4 w-4" />
                    Add Tanker
                </button>
            </div>

            {/* Tankers Table */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Plate Number</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Capacity</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Compartments</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {tankers.map((tanker) => (
                            <tr key={tanker.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-50 rounded-lg">
                                            <Truck className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <span className="font-semibold text-gray-900">{tanker.plateNumber}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-gray-600">
                                    {tanker.capacity.toLocaleString()} L
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {tanker.compartments.map(c => (
                                            <span
                                                key={c.id}
                                                className={`text-xs px-2 py-0.5 rounded ${c.product === 'DIESEL' ? 'bg-blue-50 text-blue-700' :
                                                        c.product === 'PREMIUM' ? 'bg-purple-50 text-purple-700' :
                                                            'bg-green-50 text-green-700'
                                                    }`}
                                            >
                                                {c.name}: {c.maxVolume.toLocaleString()}L
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    {getStatusBadge(tanker.status)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => openEditModal(tanker)}
                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setShowDeleteConfirm(tanker.id)}
                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create/Edit Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingTanker ? 'Edit Tanker' : 'Add New Tanker'}
                size="lg"
            >
                <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Plate Number</label>
                            <input
                                type="text"
                                value={formData.plateNumber}
                                onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                                placeholder="e.g. ABC-1234"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg"
                            >
                                <option value="ACTIVE">Active</option>
                                <option value="MAINTENANCE">Maintenance</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>
                        </div>
                    </div>

                    {/* Compartments */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="block text-sm font-medium text-gray-900">
                                Compartments ({formData.compartments.length})
                            </label>
                            <button
                                onClick={addCompartment}
                                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                            >
                                <Plus className="h-4 w-4" />
                                Add Compartment
                            </button>
                        </div>
                        <div className="space-y-3">
                            {formData.compartments.map((comp, idx) => (
                                <div key={comp.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-16">
                                        <input
                                            type="text"
                                            value={comp.name}
                                            onChange={(e) => updateCompartment(comp.id, 'name', e.target.value)}
                                            className="w-full px-2 py-1.5 border border-gray-200 rounded text-center font-medium"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="number"
                                            value={comp.maxVolume}
                                            onChange={(e) => updateCompartment(comp.id, 'maxVolume', parseInt(e.target.value) || 0)}
                                            className="w-full px-3 py-1.5 border border-gray-200 rounded"
                                            placeholder="Max Volume (L)"
                                        />
                                    </div>
                                    <div className="w-40">
                                        <select
                                            value={comp.product}
                                            onChange={(e) => updateCompartment(comp.id, 'product', e.target.value)}
                                            className="w-full px-2 py-1.5 border border-gray-200 rounded"
                                        >
                                            {FUEL_TYPES.map(ft => (
                                                <option key={ft} value={ft}>{ft}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {formData.compartments.length > 1 && (
                                        <button
                                            onClick={() => removeCompartment(comp.id)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg flex justify-between items-center">
                            <span className="text-sm font-medium text-blue-900">Total Capacity</span>
                            <span className="text-lg font-bold text-blue-600">{calculateTotalCapacity().toLocaleString()} L</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                        <button
                            onClick={() => setShowModal(false)}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!formData.plateNumber || formData.compartments.length === 0}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            {editingTanker ? 'Save Changes' : 'Create Tanker'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation */}
            <Modal
                isOpen={!!showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(null)}
                title="Delete Tanker"
                size="sm"
            >
                <div className="space-y-4">
                    <p className="text-gray-600">
                        Are you sure you want to delete this tanker? This action cannot be undone.
                    </p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowDeleteConfirm(null)}
                            className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
    ArrowLeft,
    Plus,
    Users,
    Edit2,
    Trash2,
    Save,
    Phone,
    FileText
} from 'lucide-react'
import { Modal } from '@/components/Modal'

interface Driver {
    id: string
    name: string
    licenseNumber: string
    phone: string
    status: 'ACTIVE' | 'ON_LEAVE' | 'INACTIVE'
    createdAt: string
}

const MOCK_DRIVERS: Driver[] = [
    { id: 'd1', name: 'Juan Cruz', licenseNumber: 'N01-23-456789', phone: '0917-123-4567', status: 'ACTIVE', createdAt: '2024-01-15' },
    { id: 'd2', name: 'Pedro Santos', licenseNumber: 'N02-34-567890', phone: '0918-234-5678', status: 'ACTIVE', createdAt: '2024-02-20' },
    { id: 'd3', name: 'Maria Garcia', licenseNumber: 'N03-45-678901', phone: '0919-345-6789', status: 'ACTIVE', createdAt: '2024-03-10' },
    { id: 'd4', name: 'Jose Reyes', licenseNumber: 'N04-56-789012', phone: '0920-456-7890', status: 'ON_LEAVE', createdAt: '2024-04-05' },
    { id: 'd5', name: 'Miguel Torres', licenseNumber: 'N05-67-890123', phone: '0921-567-8901', status: 'ACTIVE', createdAt: '2024-05-12' },
]

export default function DriversPage() {
    const [drivers, setDrivers] = useState<Driver[]>(MOCK_DRIVERS)
    const [showModal, setShowModal] = useState(false)
    const [editingDriver, setEditingDriver] = useState<Driver | null>(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
    const [formData, setFormData] = useState({ name: '', licenseNumber: '', phone: '', status: 'ACTIVE' as Driver['status'] })

    const openCreateModal = () => {
        setEditingDriver(null)
        setFormData({ name: '', licenseNumber: '', phone: '', status: 'ACTIVE' })
        setShowModal(true)
    }

    const openEditModal = (driver: Driver) => {
        setEditingDriver(driver)
        setFormData({ name: driver.name, licenseNumber: driver.licenseNumber, phone: driver.phone, status: driver.status })
        setShowModal(true)
    }

    const handleSave = () => {
        if (editingDriver) {
            setDrivers(drivers.map(d => d.id === editingDriver.id ? { ...d, ...formData } : d))
        } else {
            setDrivers([...drivers, { id: `d${Date.now()}`, ...formData, createdAt: new Date().toISOString().split('T')[0] }])
        }
        setShowModal(false)
    }

    const handleDelete = (id: string) => {
        setDrivers(drivers.filter(d => d.id !== id))
        setShowDeleteConfirm(null)
    }

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            ACTIVE: 'bg-green-100 text-green-700',
            ON_LEAVE: 'bg-yellow-100 text-yellow-700',
            INACTIVE: 'bg-gray-100 text-gray-700',
        }
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>{status.replace('_', ' ')}</span>
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <Link href="/admin" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-2">
                        <ArrowLeft className="h-4 w-4" /> Back to Admin
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg"><Users className="h-6 w-6 text-green-600" /></div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Drivers</h1>
                            <p className="text-gray-500">Manage driver records</p>
                        </div>
                    </div>
                </div>
                <button onClick={openCreateModal} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                    <Plus className="h-4 w-4" /> Add Driver
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50">
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">License Number</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Phone</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {drivers.map((driver) => (
                            <tr key={driver.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 font-medium text-gray-900">{driver.name}</td>
                                <td className="px-6 py-4 text-gray-600 flex items-center gap-2"><FileText className="h-4 w-4 text-gray-400" />{driver.licenseNumber}</td>
                                <td className="px-6 py-4 text-gray-600 flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400" />{driver.phone}</td>
                                <td className="px-6 py-4">{getStatusBadge(driver.status)}</td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => openEditModal(driver)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 className="h-4 w-4" /></button>
                                    <button onClick={() => setShowDeleteConfirm(driver.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg ml-1"><Trash2 className="h-4 w-4" /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingDriver ? 'Edit Driver' : 'Add New Driver'}>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="e.g. Juan Cruz" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                        <input type="text" value={formData.licenseNumber} onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="e.g. N01-23-456789" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg" placeholder="e.g. 0917-123-4567" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as Driver['status'] })} className="w-full px-3 py-2 border border-gray-200 rounded-lg">
                            <option value="ACTIVE">Active</option>
                            <option value="ON_LEAVE">On Leave</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </div>
                    <div className="flex gap-3 pt-4">
                        <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                        <button onClick={handleSave} disabled={!formData.name} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                            <Save className="h-4 w-4" /> {editingDriver ? 'Save Changes' : 'Create Driver'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={!!showDeleteConfirm} onClose={() => setShowDeleteConfirm(null)} title="Delete Driver" size="sm">
                <div className="space-y-4">
                    <p className="text-gray-600">Are you sure you want to delete this driver?</p>
                    <div className="flex gap-3">
                        <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">Cancel</button>
                        <button onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
                    </div>
                </div>
            </Modal>
        </div>
    )
}

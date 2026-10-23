'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import DashboardLayout from '@/components/layouts/dashboard/DashboardLayout';
import { isSuperAdmin } from '@/lib/permissions';

interface User {
    id: string;
    name: string | null;
    email: string;
    role: string;
    createdAt: string;
}

export default function AdminUsersPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [selectedRole, setSelectedRole] = useState<string>('BASE_USER');
    const [updating, setUpdating] = useState(false);

    const canEditRoles = isSuperAdmin(session?.user?.role);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            if (Array.isArray(data)) {
                setUsers(data);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status === 'authenticated') {
            const isAdmin = session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'ADMINISTRATOR';
            if (!isAdmin) {
                router.push('/dashboard');
                return;
            }
            fetchUsers();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, status, router]);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const openRoleModal = (user: User) => {
        setEditingUser(user);
        setSelectedRole(user.role);
        setShowRoleModal(true);
    };

    const handleUpdateRole = async () => {
        if (!editingUser) return;

        setUpdating(true);

        try {
            const res = await fetch(`/api/admin/users/${editingUser.id}/role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: selectedRole }),
            });

            if (res.ok) {
                toast.success('User role updated successfully');
                setShowRoleModal(false);
                fetchUsers();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Failed to update role');
            }
        } catch (_error) {
            toast.error('Failed to update role');
        } finally {
            setUpdating(false);
        }
    };

    if (status === 'loading' || loading) {
        return (
            <DashboardLayout title="Users" description="Manage user accounts">
                <div className="flex items-center justify-center py-24">
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout title="User Management" description="Manage user accounts and permissions">
            {!canEditRoles && (
                <div className="mb-5 p-3 border border-white/[0.08] rounded-lg text-sm text-[#a8a29e] bg-white/[0.02]">
                    You are viewing in read-only mode. Only Super Admins can edit user roles.
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
                {[
                    { label: 'Total Users', value: users.length },
                    {
                        label: 'Administrators',
                        value: users.filter((u) => u.role === 'ADMINISTRATOR' || u.role === 'SUPER_ADMIN').length,
                    },
                    { label: 'Regular Users', value: users.filter((u) => u.role === 'BASE_USER').length },
                ].map((s) => (
                    <div
                        key={s.label}
                        className="min-w-0 glass-card p-3 sm:p-5"
                    >
                        <p className="truncate text-xs text-zinc-400 mb-1">{s.label}</p>
                        <p className="text-xl sm:text-2xl font-semibold tabular-nums text-white">{s.value}</p>
                    </div>
                ))}
            </div>

            {/* User list */}
            <div className="glass-card overflow-hidden">
                {users.length === 0 ? (
                    <div className="p-12 text-center">
                        <p className="text-[#78716c] text-sm">No users found</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile cards */}
                        <div className="divide-y divide-white/[0.04] md:hidden">
                            {users.map((user) => (
                                <div key={user.id} className="p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-white truncate">
                                                {user.name || 'N/A'}
                                            </p>
                                            <p className="text-xs text-[#78716c] mt-1 truncate">{user.email}</p>
                                        </div>
                                        <span
                                            className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${user.role === 'SUPER_ADMIN' ? 'bg-white/[0.08] text-white' : user.role === 'ADMINISTRATOR' ? 'bg-white/[0.05] text-[#a8a29e]' : 'bg-white/[0.02] text-[#78716c]'}`}
                                        >
                                            {user.role.replace('_', ' ')}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-[#57534e]">{formatDate(user.createdAt)}</span>
                                        </div>
                                        {canEditRoles && (
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openRoleModal(user)}
                                                    disabled={user.email === session?.user?.email}
                                                    className="px-3 py-1.5 text-xs border border-white/[0.15] text-white rounded-lg hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                >
                                                    Role
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop table */}
                        <table className="w-full hidden md:table">
                            <thead>
                                <tr className="border-b border-white/[0.06]">
                                    <th className="text-left px-4 py-3 text-xs font-medium text-[#78716c]">Name</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-[#78716c]">Email</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-[#78716c]">Role</th>
                                    <th className="text-left px-4 py-3 text-xs font-medium text-[#78716c]">Joined</th>
                                    {canEditRoles && (
                                        <th className="text-left px-4 py-3 text-xs font-medium text-[#78716c]">
                                            Actions
                                        </th>
                                    )}
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user, i) => (
                                    <tr
                                        key={user.id}
                                        className={`${i !== users.length - 1 ? 'border-b border-white/[0.04]' : ''} hover:bg-white/[0.02] transition-colors`}
                                    >
                                        <td className="px-4 py-3">
                                            <p className="text-sm text-white">{user.name || 'N/A'}</p>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[#a8a29e]">{user.email}</td>
                                        <td className="px-4 py-3">
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded-full w-fit ${user.role === 'SUPER_ADMIN' ? 'bg-white/[0.08] text-white' : user.role === 'ADMINISTRATOR' ? 'bg-white/[0.05] text-[#a8a29e]' : 'bg-white/[0.02] text-[#78716c]'}`}
                                            >
                                                {user.role.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[#78716c]">
                                            {formatDate(user.createdAt)}
                                        </td>
                                        {canEditRoles && (
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openRoleModal(user)}
                                                        disabled={user.email === session?.user?.email}
                                                        className="px-3 py-1 text-xs border border-white/[0.15] text-white rounded-lg hover:bg-white/[0.06] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                                        title={
                                                            user.email === session?.user?.email
                                                                ? 'Cannot edit your own role'
                                                                : 'Edit role'
                                                        }
                                                    >
                                                        Role
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}
            </div>

            {/* Role Edit Modal */}
            {showRoleModal && editingUser && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                    onClick={() => setShowRoleModal(false)}
                >
                    <div
                        className="w-full max-w-md glass-card overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                            <h3 className="text-sm font-medium text-white">Edit User Role</h3>
                            <button
                                type="button"
                                onClick={() => setShowRoleModal(false)}
                                className="text-[#78716c] hover:text-white text-sm transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <p className="text-xs text-[#78716c] mb-1">User</p>
                                <p className="text-sm text-white">{editingUser.name || editingUser.email}</p>
                            </div>
                            <div>
                                <label className="block text-xs text-[#78716c] mb-1.5">New Role</label>
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="w-full bg-[#0f0c0b]/80 border border-white/[0.1] text-white [&>option]:bg-[#1c1917] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-orange-500/60 focus:ring-2 focus:ring-orange-500/20"
                                >
                                    <option value="BASE_USER">Base User</option>
                                    <option value="ADMINISTRATOR">Administrator</option>
                                    <option value="SUPER_ADMIN">Super Admin</option>
                                </select>
                            </div>
                            <div className="p-3 border border-white/[0.06] rounded-lg">
                                <p className="text-xs text-[#78716c]">
                                    {selectedRole === 'BASE_USER' && 'Basic user access only'}
                                    {selectedRole === 'ADMINISTRATOR' && 'Can manage content, reviews, and emails'}
                                    {selectedRole === 'SUPER_ADMIN' &&
                                        'Full system access including user role management'}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowRoleModal(false)}
                                    className="flex-1 py-2 text-sm border border-white/[0.15] text-white rounded-lg hover:bg-white/[0.06] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleUpdateRole}
                                    disabled={updating || selectedRole === editingUser.role}
                                    className="flex-1 py-2 text-sm bg-[#F97316] text-[#140b05] font-semibold rounded-lg hover:bg-[#EA580C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {updating ? 'Updating…' : 'Update Role'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}

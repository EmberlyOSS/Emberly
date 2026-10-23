'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface Profile {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
    role: string;
}

const ROLE_LABELS: Record<string, string> = {
    SUPER_ADMIN: 'Super Admin',
    ADMINISTRATOR: 'Administrator',
    BASE_USER: 'Member',
};

export default function DashboardAccountPage() {
    const { update: updateSession } = useSession();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileMessage, setProfileMessage] = useState<string | null>(null);
    const [profileError, setProfileError] = useState<string | null>(null);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
    const [passwordError, setPasswordError] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/auth/profile')
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
                if (data) {
                    setProfile(data);
                    setName(data.name ?? '');
                    setEmail(data.email ?? '');
                }
            })
            .finally(() => setLoading(false));
    }, []);

    async function handleProfileSubmit(e: React.FormEvent) {
        e.preventDefault();
        setProfileSaving(true);
        setProfileError(null);
        setProfileMessage(null);
        try {
            const res = await fetch('/api/auth/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, image: profile?.image }),
            });
            const data = await res.json();
            if (res.ok) {
                setProfile(data);
                setProfileMessage('Profile updated.');
                await updateSession();
            } else {
                setProfileError(data.error ?? 'Something went wrong.');
            }
        } catch {
            setProfileError('Network error. Please try again.');
        } finally {
            setProfileSaving(false);
        }
    }

    async function handlePasswordSubmit(e: React.FormEvent) {
        e.preventDefault();
        setPasswordSaving(true);
        setPasswordError(null);
        setPasswordMessage(null);
        try {
            const res = await fetch('/api/auth/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                setPasswordMessage('Password updated.');
                setCurrentPassword('');
                setNewPassword('');
            } else {
                setPasswordError(data.error ?? 'Something went wrong.');
            }
        } catch {
            setPasswordError('Network error. Please try again.');
        } finally {
            setPasswordSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border-2 border-white/[0.1] border-t-white animate-spin" />
                <p className="text-sm text-[#78716c]">Loading your account...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Profile */}
            <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-sm font-medium text-white">Profile</h2>
                    {profile && (
                        <span className="text-xs px-2 py-1 rounded-md border border-white/[0.08] text-[#a8a29e]">
                            {ROLE_LABELS[profile.role] ?? profile.role}
                        </span>
                    )}
                </div>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-xs font-medium text-white mb-1.5">Name</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-[#57534e] focus:outline-none focus:border-white/20 transition-colors"
                        />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-xs font-medium text-white mb-1.5">Email</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-[#57534e] focus:outline-none focus:border-white/20 transition-colors"
                        />
                    </div>
                    {profileMessage && <p className="text-xs text-emerald-400">{profileMessage}</p>}
                    {profileError && <p className="text-xs text-red-400">{profileError}</p>}
                    <button
                        type="submit"
                        disabled={profileSaving}
                        className="bg-white/[0.08] border border-white/[0.08] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/[0.12] transition-colors disabled:opacity-50"
                    >
                        {profileSaving ? 'Saving...' : 'Save changes'}
                    </button>
                </form>
            </div>

            {/* Password */}
            <div className="glass-card p-6">
                <h2 className="text-sm font-medium text-white mb-5">Change password</h2>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="currentPassword" className="block text-xs font-medium text-white mb-1.5">Current password</label>
                        <input
                            id="currentPassword"
                            type="password"
                            required
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-[#57534e] focus:outline-none focus:border-white/20 transition-colors"
                        />
                    </div>
                    <div>
                        <label htmlFor="newPassword" className="block text-xs font-medium text-white mb-1.5">New password</label>
                        <input
                            id="newPassword"
                            type="password"
                            required
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-[#57534e] focus:outline-none focus:border-white/20 transition-colors"
                        />
                        <p className="text-[10px] text-[#57534e] mt-1.5">
                            At least 8 characters, with uppercase, lowercase, a number, and a special character.
                        </p>
                    </div>
                    {passwordMessage && <p className="text-xs text-emerald-400">{passwordMessage}</p>}
                    {passwordError && <p className="text-xs text-red-400">{passwordError}</p>}
                    <button
                        type="submit"
                        disabled={passwordSaving}
                        className="bg-white/[0.08] border border-white/[0.08] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/[0.12] transition-colors disabled:opacity-50"
                    >
                        {passwordSaving ? 'Updating...' : 'Update password'}
                    </button>
                </form>
            </div>
        </div>
    );
}

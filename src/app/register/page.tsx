'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { UserCreationRequest, UserCreationResponse } from '@/types/auth';

export default function Register() {
    const router = useRouter();
    const [formData, setFormData] = useState<UserCreationRequest>({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        userType: 'USER',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post<UserCreationResponse>('/identity/api/v1/users/registration', formData);
            router.push('/auth?message=Đăng ký thành công! Vui lòng đăng nhập.');
        } catch (err) {
            setError('Đăng ký thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
                <h2 className="text-2xl font-bold text-center">Đăng ký tài khoản</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            type="text"
                            placeholder="Họ"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <input
                            type="text"
                            placeholder="Tên"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <input
                            type="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <input
                            type="password"
                            placeholder="Mật khẩu"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>

                    <div>
                        <select
                            value={formData.userType}
                            onChange={(e) => setFormData({ ...formData, userType: e.target.value as 'USER' | 'LANDLORD' })}
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
                        >
                            <option value="USER">Người dùng</option>
                            <option value="LANDLORD">Chủ nhà</option>
                        </select>
                    </div>

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                        {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                    </button>
                </form>

                <p className="text-center text-sm">
                    Đã có tài khoản? <Link href="/auth" className="text-blue-500 hover:underline">Đăng nhập</Link>
                </p>
            </div>
        </div>
    );
}
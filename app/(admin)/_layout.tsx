import AdminShell from '@/components/admin/AdminSell';
import { Slot } from 'expo-router';

export default function AdminLayout() {
    return (
        <AdminShell>
            <Slot />
        </AdminShell>
    );
}

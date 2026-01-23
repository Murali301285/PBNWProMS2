import DashboardLayout from '@/components/DashboardLayout';
import SessionManager from '@/components/SessionManager';
import { authenticateUser } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Layout({ children }) {
    // Strict Session Check
    const user = await authenticateUser();

    if (!user) {
        redirect('/');
    }

    return (
        <>
            <SessionManager />
            <DashboardLayout user={user}>{children}</DashboardLayout>
        </>
    );
}

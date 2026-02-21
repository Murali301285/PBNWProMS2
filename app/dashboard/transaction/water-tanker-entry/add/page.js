
import WaterTankerForm from '@/components/WaterTankerForm';

export const dynamic = 'force-dynamic';

import { GET } from '@/app/api/transaction/water-tanker-entry/helpers/route';

async function getHelpers() {
    try {
        // Call the API handler directly instead of using fetch() during server component render
        const res = await GET();

        if (!res.ok) {
            console.error("Failed to fetch helpers internally");
            return {};
        }

        return await res.json();
    } catch (e) {
        console.error("Helper fetch failed:", e);
        return {};
    }
}

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

async function getUsersRole() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (token) {
        try {
            const decoded = jwt.decode(token);
            return decoded?.role || 'User';
        } catch (e) {
            return 'User';
        }
    }
    return 'User';
}

export default async function AddWaterTankerEntry() {
    const helpers = await getHelpers();
    const role = await getUsersRole();

    return (
        <WaterTankerForm initialHelpers={helpers} userRole={role} />
    );
}

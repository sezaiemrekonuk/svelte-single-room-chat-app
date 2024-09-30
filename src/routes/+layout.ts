import type { LayoutLoad } from './$types';

export const ssr = false;

export const load = (async () => {
    return {
        auth: await import('../firebase/auth'),
        firestore: await import('../firebase/firestore'),
    };
}) satisfies LayoutLoad;
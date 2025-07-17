import { atom, useAtom } from 'jotai';

export type User = {
    id: string;
    name: string;
    email: string;
    bio?: string;
    avatar?: string;
    phoneNumber?: string;
    address?: string;
    isVerified: boolean;
    role: any;
}

const userAtom = atom<User | null>(null);
const userLoadedAtom = atom(false);

export const useUser = () => useAtom(userAtom);
export const useUserLoaded = () => useAtom(userLoadedAtom);
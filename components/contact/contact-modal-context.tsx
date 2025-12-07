//components/contact/contact-modal-context.tsx
"use client";

import {
    createContext,
    useCallback,
    useContext,
    useState,
    type ReactNode,
} from "react";

type ContactModalContextValue = {
    isOpen: boolean;
    open: () => void;
    close: () => void;
};

const ContactModalContext = createContext<ContactModalContextValue | null>(
    null
);

export function ContactModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const open = useCallback(() => setIsOpen(true), []);
    const close = useCallback(() => setIsOpen(false), []);

    return (
        <ContactModalContext.Provider value={{ isOpen, open, close }}>
            {children}
        </ContactModalContext.Provider>
    );
}

export function useContactModal() {
    const ctx = useContext(ContactModalContext);
    if (!ctx) {
        throw new Error("useContactModal must be used within ContactModalProvider");
    }
    return ctx;
}

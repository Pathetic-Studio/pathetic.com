// components/contact/contact-modal-context.tsx
"use client";

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    useEffect,
    type ReactNode,
} from "react";

type ModalType = "contact" | "newsletter" | null;

interface ModalContextValue {
    activeModal: ModalType;
    openContact: () => void;
    closeContact: () => void;
    openNewsletter: () => void;
    closeNewsletter: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

interface ProviderProps {
    children: ReactNode;
}

export function ContactModalProvider({ children }: ProviderProps) {
    const [activeModal, setActiveModal] = useState<ModalType>(null);

    const openContact = useCallback(() => setActiveModal("contact"), []);
    const closeContact = useCallback(() => {
        setActiveModal((current) => (current === "contact" ? null : current));
    }, []);

    const openNewsletter = useCallback(() => setActiveModal("newsletter"), []);
    const closeNewsletter = useCallback(() => {
        setActiveModal((current) => (current === "newsletter" ? null : current));
    }, []);

    // ---- DEBUG: expose hooks + state on window (dev only) ----
    useEffect(() => {
        if (process.env.NODE_ENV === "production") return;

        (window as any).__modal = {
            get active() {
                return activeModal;
            },
            openContact,
            closeContact,
            openNewsletter,
            closeNewsletter,
            closeAll: () => setActiveModal(null),
        };

        // Helpful trace
        // eslint-disable-next-line no-console
        console.log("[modal] activeModal =", activeModal);

        return () => {
            if ((window as any).__modal) delete (window as any).__modal;
        };
    }, [activeModal, openContact, closeContact, openNewsletter, closeNewsletter]);
    // ---------------------------------------------------------

    const value = useMemo(
        () => ({
            activeModal,
            openContact,
            closeContact,
            openNewsletter,
            closeNewsletter,
        }),
        [activeModal, openContact, closeContact, openNewsletter, closeNewsletter],
    );

    return <ModalContext.Provider value={value}>{children}</ModalContext.Provider>;
}

export function useContactModal() {
    const ctx = useContext(ModalContext);
    if (!ctx) {
        throw new Error("useContactModal must be used within ContactModalProvider");
    }
    const { activeModal, openContact, closeContact } = ctx;
    return {
        isOpen: activeModal === "contact",
        open: openContact,
        close: closeContact,
    };
}

export function useNewsletterModal() {
    const ctx = useContext(ModalContext);
    if (!ctx) {
        throw new Error("useNewsletterModal must be used within ContactModalProvider");
    }
    const { activeModal, openNewsletter, closeNewsletter } = ctx;
    return {
        isOpen: activeModal === "newsletter",
        open: openNewsletter,
        close: closeNewsletter,
    };
}

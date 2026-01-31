'use client';
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import "../styles/components/modal2.css";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, children }: ModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        console.log("Modal: Component mounted on client.");
        return () => setMounted(false);
    }, []);

    console.log(`Modal: Render called. Mounted: ${mounted}, IsOpen: ${isOpen}`);

    if (!mounted || !isOpen) return null;

    return createPortal(
        <div className="modal-overlay">
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content-wrapper">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
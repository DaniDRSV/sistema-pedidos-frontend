import { useState } from 'react';

/**
 * Muestra una miniatura de la imagen.
 * - Si el valor es una URL válida (http/https), intenta cargar la imagen.
 * - Si es un nombre de archivo local, muestra un placeholder con icono.
 * - Si está vacío, muestra un guion.
 */
export default function ImageThumbnail({ src, alt = 'Imagen' }) {
    const [hasError, setHasError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    if (!src) {
        return <span className="text-xs text-slate-600">—</span>;
    }

    const isUrl = /^https?:\/\//i.test(src);

    // Si es un nombre de archivo local (no URL), mostramos un placeholder con icono
    if (!isUrl) {
        return (
            <div
                className="flex h-12 w-12 items-center justify-center rounded-lg border border-slate-700 bg-slate-950"
                title={src}
            >
                <svg className="h-5 w-5 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <path d="m21 15-5-5L5 21" />
                </svg>
            </div>
        );
    }

    // Si es una URL pero falla al cargar, mostramos un placeholder
    if (hasError) {
        return (
            <div
                className="flex h-12 w-12 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5"
                title={`No se pudo cargar: ${src}`}
            >
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                </svg>
            </div>
        );
    }

    return (
        <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
            {isLoading && (
                <div className="absolute inset-0 animate-pulse bg-slate-800" />
            )}
            <img
                src={src}
                alt={alt}
                onError={() => setHasError(true)}
                onLoad={() => setIsLoading(false)}
                className="h-full w-full object-cover"
            />
        </div>
    );
}
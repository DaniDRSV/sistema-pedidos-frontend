import { useState } from 'react';

/**
 * Genera un nombre de archivo único basado en la fecha/hora actual.
 * Ejemplo: "20260923_143022_iphone15.jpg"
 */
const generateFileName = (originalName) => {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const timestamp =
        `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_` +
        `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;

    const lastDot = originalName.lastIndexOf('.');
    const baseName = lastDot !== -1 ? originalName.substring(0, lastDot) : originalName;
    const extension = lastDot !== -1 ? originalName.substring(lastDot).toLowerCase() : '';

    // Limpiamos el nombre base: minúsculas, sin espacios ni caracteres raros
    const cleanBase = baseName
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9-_]/g, '');

    return `${timestamp}_${cleanBase}${extension}`;
};

export default function ImageInput({ value, onChange, name = 'imageUrl' }) {
    const [mode, setMode] = useState('url'); // 'url' o 'file'

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Solo aceptamos imágenes
        if (!file.type.startsWith('image/')) {
            alert('Por favor selecciona un archivo de imagen válido.');
            return;
        }

        const newName = generateFileName(file.name);

        // Simulamos el evento para reutilizar el handleChange del padre
        onChange({ target: { name, value: newName } });
    };

    const handleUrlChange = (e) => {
        onChange({ target: { name, value: e.target.value } });
    };

    return (
        <div className="rounded-xl border border-slate-700 bg-slate-950 p-3">
            {/* Selector de modo */}
            <div className="mb-3 inline-flex rounded-lg border border-slate-700 bg-slate-900 p-1">
                <button
                    type="button"
                    onClick={() => setMode('url')}
                    className={`rounded-md px-3 py-1 text-xs font-bold transition ${mode === 'url'
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                >
                    URL
                </button>
                <button
                    type="button"
                    onClick={() => setMode('file')}
                    className={`rounded-md px-3 py-1 text-xs font-bold transition ${mode === 'file'
                            ? 'bg-emerald-600 text-white'
                            : 'text-slate-400 hover:text-white'
                        }`}
                >
                    Archivo
                </button>
            </div>

            {/* Input según el modo */}
            {mode === 'url' ? (
                <input
                    type="text"
                    name={name}
                    value={value}
                    onChange={handleUrlChange}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
                />
            ) : (
                <div className="space-y-2">
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full cursor-pointer rounded-lg border border-dashed border-slate-600 bg-slate-900 px-3 py-2 text-xs text-slate-400 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:bg-emerald-500"
                    />
                    {value && (
                        <p className="rounded-md bg-slate-900 px-3 py-2 text-xs text-emerald-400">
                            <span className="font-bold text-slate-400">Nombre generado: </span>
                            {value}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
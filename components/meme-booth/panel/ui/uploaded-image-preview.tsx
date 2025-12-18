"use client";

import { useEffect, useState } from "react";

export default function UploadedImagePreview({ blob }: { blob: Blob }) {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        const objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
        return () => URL.revokeObjectURL(objectUrl);
    }, [blob]);

    if (!url) return <div className="aspect-[3/4] w-full max-h-[480px] bg-gray-100" />;

    return (
        <img
            src={url}
            alt="Uploaded fit"
            className="w-full max-h-[480px] object-contain"
        />
    );
}

'use client';

import { useState, useEffect } from 'react';
import MemeBoothShell from "@/components/meme-booth/meme-booth-shell";
import TitleText from "@/components/ui/title-text";
import BoothProviders from "@/components/meme-booth/booth-providers";
import CreditBalance from "@/components/meme-booth/credits/credit-balance";

export default function PasswordProtectedBoothContent({ 
    page, 
    showNewsletterModalOnView 
}: { 
    page: any; 
    showNewsletterModalOnView: boolean;
}) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check if user already entered password
        const auth = localStorage.getItem('booth_auth');
        if (auth === 'true') {
            setIsAuthenticated(true);
        }
        setIsLoading(false);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // ⬇️ CHANGE THIS PASSWORD TO WHATEVER YOU WANT ⬇️
        const correctPassword = 'pathetic2025';
        
        if (password === correctPassword) {
            localStorage.setItem('booth_auth', 'true');
            setIsAuthenticated(true);
            setError('');
        } else {
            setError('Incorrect password');
            setPassword('');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <p className="text-black">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="max-w-md w-full mx-auto p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-black mb-2">MEME BOOTH</h1>
                        <p className="text-gray-600">Enter password to access</p>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full px-4 py-3 border-2 border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                                autoFocus
                            />
                            {error && (
                                <p className="mt-2 text-red-600 text-sm">{error}</p>
                            )}
                        </div>
                        
                        <button
                            type="submit"
                            className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
                        >
                            Enter
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // Show the actual booth after authentication
    return (
        <BoothProviders>
            <main className="relative mx-auto max-w-4xl py-32 px-4">
                {/* Credit balance display - top right of booth */}
                <div className="absolute right-4 top-4 z-50">
                    <CreditBalance />
                </div>

                <header className="mb-8 text-center">
                    {page?.title && (
                        <TitleText
                            as="h1"
                            variant="stretched"
                            size="lg"
                            align="center"
                            maxChars={32}
                            animation="typeOn"
                            animationSpeed={1.2}
                        >
                            {page.title}
                        </TitleText>
                    )}

                    {page?.subtitle && (
                        <p className="mt-1 text-2xl text-muted-foreground">
                            {page.subtitle}
                        </p>
                    )}
                </header>

                {/* Client-only, dynamic, no SSR */}
                <MemeBoothShell showNewsletterModalOnView={showNewsletterModalOnView} />
            </main>
        </BoothProviders>
    );
}

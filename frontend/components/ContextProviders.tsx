"use client";
import React from 'react';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';
import CartDrawer from './CartDrawer';

export default function ContextProviders({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <CartProvider>
                {children}
                <CartDrawer />
            </CartProvider>
        </AuthProvider>
    );
}

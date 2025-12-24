"use client"
import { useEffect, useRef, useState, ReactNode } from 'react'

interface AnimateOnScrollProps {
    children: ReactNode
    className?: string
    delay?: number
    duration?: number
    animation?: 'fade-up' | 'fade-in' | 'slide-left' | 'slide-right' | 'zoom-in'
}

export default function AnimateOnScroll({
    children,
    className = '',
    delay = 0,
    duration = 600,
    animation = 'fade-up'
}: AnimateOnScrollProps) {
    const ref = useRef<HTMLDivElement>(null)
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                    observer.unobserve(entry.target)
                }
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        )

        if (ref.current) {
            observer.observe(ref.current)
        }

        return () => observer.disconnect()
    }, [])

    const animations = {
        'fade-up': {
            initial: 'opacity-0 translate-y-8',
            visible: 'opacity-100 translate-y-0'
        },
        'fade-in': {
            initial: 'opacity-0',
            visible: 'opacity-100'
        },
        'slide-left': {
            initial: 'opacity-0 -translate-x-8',
            visible: 'opacity-100 translate-x-0'
        },
        'slide-right': {
            initial: 'opacity-0 translate-x-8',
            visible: 'opacity-100 translate-x-0'
        },
        'zoom-in': {
            initial: 'opacity-0 scale-95',
            visible: 'opacity-100 scale-100'
        }
    }

    const animStyle = animations[animation]

    return (
        <div
            ref={ref}
            className={`transition-all ease-out ${isVisible ? animStyle.visible : animStyle.initial} ${className}`}
            style={{
                transitionDuration: `${duration}ms`,
                transitionDelay: `${delay}ms`
            }}
        >
            {children}
        </div>
    )
}

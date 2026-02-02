"use client"
import { useEffect } from 'react'

export default function DevDomInstrumentation() {
    useEffect(() => {
        if (process.env.NODE_ENV !== 'development') return

        const origRemoveChild = Node.prototype.removeChild
        const origAppendChild = Node.prototype.appendChild

        Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
            try {
                return origRemoveChild.call(this, child) as T
            } catch (err) {
                try {
                    // Log useful debugging info before rethrowing
                    // eslint-disable-next-line no-console
                    console.error('DEV: removeChild failed', { parent: this, child, error: err })
                    // eslint-disable-next-line no-console
                    console.trace('DEV: removeChild stack')
                } catch (e) {
                    /* ignore */
                }
                throw err
            }
        }

        Node.prototype.appendChild = function <T extends Node>(this: Node, child: T): T {
            try {
                return origAppendChild.call(this, child) as T
            } catch (err) {
                try {
                    // eslint-disable-next-line no-console
                    console.error('DEV: appendChild failed', { parent: this, child, error: err })
                    // eslint-disable-next-line no-console
                    console.trace('DEV: appendChild stack')
                } catch (e) {
                    /* ignore */
                }
                throw err
            }
        }

        return () => {
            Node.prototype.removeChild = origRemoveChild
            Node.prototype.appendChild = origAppendChild
        }
    }, [])

    return null
}

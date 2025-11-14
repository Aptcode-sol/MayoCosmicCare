import Image from 'next/image'

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans">
      <main className="w-full max-w-3xl p-8">
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">MLM App</h1>
          <nav className="space-x-4">
            <a href="/register" className="text-sm font-medium text-blue-600">Register</a>
            <a href="/login" className="text-sm font-medium text-blue-600">Login</a>
          </nav>
        </header>

        <section className="rounded-lg bg-white p-8 shadow">
          <div className="flex items-center gap-6">
            <Image src="/next.svg" alt="logo" width={64} height={24} />
            <div>
              <h2 className="text-2xl font-semibold">Welcome to the MLM App</h2>
              <p className="mt-2 text-sm text-zinc-600">Get started by registering an account or logging in.</p>
            </div>
          </div>

          <div className="mt-6 flex gap-4">
            <a className="px-4 py-2 rounded bg-blue-600 text-white" href="/register">Register</a>
            <a className="px-4 py-2 rounded border" href="/login">Login</a>
          </div>
        </section>
      </main>
    </div>
  )
}

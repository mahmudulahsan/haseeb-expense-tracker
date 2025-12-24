export default function Home() {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
            <h1 className="text-4xl font-bold">Welcome to Haseeb</h1>
            <p className="mt-4 text-xl text-gray-600">Your production-ready expense tracker.</p>
            <div className="mt-8">
                <a
                    href="/dashboard"
                    className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 transition"
                >
                    Get Started
                </a>
            </div>
        </main>
    );
}

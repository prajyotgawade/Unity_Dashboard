import { login } from './actions'

export default async function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const { error } = await searchParams;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-brand-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 border border-brand-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-brand-900 tracking-tight">Unity Enterprises</h1>
          <p className="text-brand-500 mt-2">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm text-center">
            {error}
          </div>
        )}

        <form className="space-y-6" action={login}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-brand-700">
              Email address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none block w-full px-3 py-2 border border-brand-200 rounded-md shadow-sm placeholder-brand-300 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm text-foreground bg-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-brand-700">
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none block w-full px-3 py-2 border border-brand-200 rounded-md shadow-sm placeholder-brand-300 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm text-foreground bg-white"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors"
            >
              Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

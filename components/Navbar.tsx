'use client'

import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

export default function Navbar() {
  const { data: session } = useSession()

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center text-xl font-bold text-blue-600">
              🏀 The Spreadsheet
            </Link>
            <div className="ml-10 flex items-center space-x-4">
              <Link
                href="/"
                className="text-black hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Offerings
              </Link>
              {session && (
                <Link
                  href="/dashboard"
                  className="text-black hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {session ? (
              <div className="flex items-center space-x-4">
                <span className="text-black">
                  Welcome, {session.user?.name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link
                  href="/login"
                  className="text-black hover:text-blue-600 px-4 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}


import { Metadata } from 'next'
import { LoginForm } from '@/components/login-form'
import { LoginIllustration } from '@/components/login-illustration'

export const metadata: Metadata = {
  title: 'Login - Ugbekun',
  description: 'Sign in to your Ugbekun school management account',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <LoginIllustration />
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}

import { Metadata } from 'next'
import { SignupForm } from '@/components/signup-form'
import { LoginIllustration } from '@/components/login-illustration'

export const metadata: Metadata = {
  title: 'Sign Up - Ugbekun',
  description: 'Create a new Ugbekun school management account',
}

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <LoginIllustration />
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">
          <SignupForm />
        </div>
      </div>
    </div>
  )
}

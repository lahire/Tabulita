'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signUp } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Validation
    if (username.length < 3 || username.length > 30) {
      setError('Username must be between 3 and 30 characters');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await signUp(email, password, username);
      // Redirect to login or dashboard after successful signup
      router.push('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Tabulita</h1>
          <p className="text-foreground/60">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500">
              {error}
            </div>
          )}

          <Input
            id="username"
            type="text"
            label="Username"
            placeholder="your_username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={3}
            maxLength={30}
            autoComplete="username"
          />

          <Input
            id="email"
            type="email"
            label="Email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />

          <Input
            id="password"
            type="password"
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />

          <Input
            id="confirm-password"
            type="password"
            label="Confirm Password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />

          <Button type="submit" className="w-full" isLoading={loading}>
            Sign Up
          </Button>
        </form>

        <div className="mt-6 text-center space-y-4">
          <p className="text-sm text-foreground/60">
            Already have an account?{' '}
            <Link href="/login" className="text-foreground hover:underline font-medium">
              Sign in
            </Link>
          </p>

          <Link href="/" className="text-sm text-foreground/60 hover:underline block">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

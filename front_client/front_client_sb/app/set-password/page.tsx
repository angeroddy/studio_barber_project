'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import Logo2 from '@/public/logoApp.png';
import { completeClientInvitation, saveToken, saveUser } from '@/lib/api/auth';

export default function SetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = (searchParams.get('token') || '').trim();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError('Lien invalide: token manquant.');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caracteres.');
      return;
    }

    try {
      setIsLoading(true);
      const result = await completeClientInvitation(token, password);
      saveToken(result.data.token);
      saveUser(result.data.user);
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1000);
    } catch (err: any) {
      setError(err?.message || 'Erreur lors de la creation du mot de passe.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10 bg-white relative">
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `url('/Vector (1).png')`,
            backgroundRepeat: 'repeat',
            backgroundSize: 'auto'
          }}
        />

        <div className="flex justify-center gap-2 md:justify-start relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="text-white flex size-12 items-center justify-center">
              <Image src={Logo2} width={500} height={500} alt="Studio Barber Logo" />
            </div>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center relative z-10">
          <div className="w-full max-w-md">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Definir mon mot de passe</h1>
            <p className="text-gray-600 mb-6">
              Choisissez un mot de passe pour finaliser l'activation de votre compte.
            </p>

            {error && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {success ? (
              <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                Mot de passe defini avec succes. Redirection...
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Mot de passe</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm"
                    placeholder="Minimum 8 caracteres"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">Confirmer le mot de passe</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-11 w-full rounded-lg border border-gray-300 px-4 text-sm"
                    placeholder="Confirmer le mot de passe"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full rounded-lg bg-[#EB549E] py-3 text-sm font-medium text-white hover:bg-[#D33982] disabled:opacity-50"
                >
                  {isLoading ? 'Validation...' : 'Creer mon mot de passe'}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="text-center text-sm text-gray-600 font-archivo relative z-10">
          <p>&copy; 2024 Studio Barber. Tous droits reserves.</p>
        </div>
      </div>

      <div className="relative hidden lg:flex bg-[#DE2788] justify-center items-center">
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url('/Vector (1).png')`,
            backgroundRepeat: 'repeat',
            backgroundSize: 'auto'
          }}
        />
        <div className="relative z-10 flex justify-center items-center flex-col leading-none">
          <p className="font-archivo font-[1000] text-white m-0 text-[220px] leading-40 text-start tracking-[-20]">
            STUDIO <br /> <span className="font-archivo font-black text-white m-0 text-[220px] tracking-[-20]">BARBER</span>
          </p>
        </div>
      </div>
    </div>
  );
}

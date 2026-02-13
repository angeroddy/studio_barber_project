'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getClientBookings, cancelClientBooking } from '@/lib/api/clientBooking';
import { getProfile, isAuthenticated, removeToken } from '@/lib/api/auth';
import { ApiError } from '@/lib/api/config';
import Link from 'next/link';
import Logo2 from '@/public/logoApp.png';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface Booking {
  id: string;
  salonId: string;
  serviceId?: string;
  staffId?: string;
  startTime: string;
  status: string;
  notes?: string;
  duration: number;
  price: number;
  isMultiService?: boolean;
  salon?: {
    name: string;
    address: string;
  };
  service?: {
    name: string;
    duration: number;
    price: number;
  };
  staff?: {
    firstName: string;
    lastName: string;
  };
  bookingServices?: Array<{
    id: string;
    duration: number;
    price: number;
    order: number;
    service: {
      id: string;
      name: string;
      duration: number;
      price: number;
      category: string;
    };
    staff: {
      id: string;
      firstName: string;
      lastName: string;
    };
  }>;
}

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  useEffect(() => {
    // Vérifier l'authentification
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // Charger les données
    loadDashboardData();
  }, [router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger le profil utilisateur
      const token = localStorage.getItem('authToken');
      if (token) {
        const profileData = await getProfile(token);
        setUser(profileData.data);
      }

      // Charger les réservations
      const bookingsData = await getClientBookings();

      // Filtrer les réservations actives (non annulées)
      const activeBookings = bookingsData.data.filter((booking: Booking) => {
        const normalizedStatus = booking.status.toUpperCase();
        return normalizedStatus !== 'CANCELED' && normalizedStatus !== 'CANCELLED';
      });

      // Trier par date (les plus récentes en premier)
      activeBookings.sort((a: Booking, b: Booking) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );

      setBookings(activeBookings);
    } catch (err) {
      console.error('Erreur chargement dashboard:', err);
      if (err instanceof ApiError && err.status === 401) {
        // Token invalide ou expiré
        handleLogout();
      } else {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement des données');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      return;
    }

    try {
      setCancelingId(bookingId);
      await cancelClientBooking(bookingId);

      // Recharger les réservations
      await loadDashboardData();

      alert('Réservation annulée avec succès');
    } catch (err) {
      console.error('Erreur annulation:', err);
      alert(err instanceof Error ? err.message : 'Erreur lors de l\'annulation');
    } finally {
      setCancelingId(null);
    }
  };

  const handleLogout = () => {
    removeToken();
    router.push('/');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    const colors: Record<string, { bg: string; text: string }> = {
      confirmed: { bg: 'bg-green-100', text: 'text-green-800' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
      canceled: { bg: 'bg-red-100', text: 'text-red-800' }, // Support pour "canceled" (US spelling)
    };
    return colors[statusLower] || { bg: 'bg-gray-100', text: 'text-gray-800' };
  };

  const getStatusLabel = (status: string) => {
    const statusLower = status.toLowerCase();
    const labels: Record<string, string> = {
      confirmed: 'Confirmée',
      pending: 'En attente',
      completed: 'Terminée',
      cancelled: 'Annulée',
      canceled: 'Annulée', // Support pour "canceled" (US spelling)
    };
    return labels[statusLower] || status;
  };

  // Séparer les rendez-vous futurs et passés
  const now = new Date();
  const upcomingBookings = bookings.filter(
    (booking) => new Date(booking.startTime) >= now
  );
  const pastBookings = bookings.filter(
    (booking) => new Date(booking.startTime) < now
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DE2788] mx-auto"></div>
          <p className="mt-4 text-gray-600 font-archivo">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="text-white flex size-12 items-center justify-center">
                <Image
                  src={Logo2}
                  width={48}
                  height={48}
                  alt="Studio Barber"
                />
              </div>
            </Link>

            <div className="flex items-center gap-4">
              {user && (
                <span className="text-sm font-archivo text-gray-700">
                  Bonjour, <span className="font-semibold">{user.firstName}</span>
                </span>
              )}
              <Button
                onClick={handleLogout}
                variant="outline"
                className="font-archivo"
              >
                Se déconnecter
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 font-archivo">
            Mes réservations
          </h1>
          <p className="mt-2 text-gray-600 font-archivo">
            Gérez vos rendez-vous et réservations
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-archivo">
            {error}
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 font-archivo">
                Aucune réservation
              </h3>
              <p className="mt-2 text-gray-600 font-archivo">
                Vous n&apos;avez aucune réservation en cours.
              </p>
              <Link href="/">
                <Button className="mt-6 bg-[#DE2788] hover:bg-[#c01f73] font-archivo">
                  Prendre rendez-vous
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Rendez-vous à venir */}
            {upcomingBookings.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 font-archivo">
                    Rendez-vous à venir
                  </h2>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#DE2788] text-white font-archivo">
                    {upcomingBookings.length}
                  </span>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingBookings.map((booking) => {
                    const statusColor = getStatusColor(booking.status);
                    return (
                      <div
                        key={booking.id}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div className="p-6">
                          {/* Salon Name */}
                          <h3 className="text-lg font-semibold text-gray-900 font-archivo mb-2">
                            {booking.salon?.name || 'Studio Barber'}
                          </h3>

                          {/* Service(s) */}
                          <div className="mb-4">
                            <p className="text-sm text-gray-600 font-archivo">
                              {booking.isMultiService ? 'Services' : 'Service'}
                            </p>
                            {booking.isMultiService && booking.bookingServices ? (
                              <div className="space-y-1">
                                {booking.bookingServices.map((bs, index) => (
                                  <p key={bs.id} className="text-sm font-medium text-gray-900 font-archivo">
                                    {index + 1}. {bs.service.name} ({bs.duration} min)
                                  </p>
                                ))}
                              </div>
                            ) : (
                              <p className="text-base font-medium text-gray-900 font-archivo">
                                {booking.service?.name || 'Service'}
                              </p>
                            )}
                          </div>

                          {/* Date & Time */}
                          <div className="mb-4 space-y-2">
                            <div className="flex items-center gap-2 text-gray-700">
                              <svg
                                className="h-5 w-5 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              <span className="text-sm font-archivo">
                                {formatDate(booking.startTime)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                              <svg
                                className="h-5 w-5 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="text-sm font-archivo">
                                {formatTime(booking.startTime)}
                                {booking.duration && (
                                  <span className="text-gray-500">
                                    {' '}
                                    ({booking.duration} min)
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Staff */}
                          {booking.isMultiService && booking.bookingServices ? (
                            <div className="mb-4">
                              <p className="text-sm text-gray-600 font-archivo">Professionnels</p>
                              <div className="space-y-1">
                                {booking.bookingServices.map((bs, index) => (
                                  <p key={bs.id} className="text-sm font-medium text-gray-900 font-archivo">
                                    {index + 1}. {bs.staff.firstName} {bs.staff.lastName}
                                  </p>
                                ))}
                              </div>
                            </div>
                          ) : booking.staff ? (
                            <div className="mb-4">
                              <p className="text-sm text-gray-600 font-archivo">Professionnel</p>
                              <p className="text-base font-medium text-gray-900 font-archivo">
                                {booking.staff.firstName} {booking.staff.lastName}
                              </p>
                            </div>
                          ) : null}

                          {/* Price */}
                          {booking.price && (
                            <div className="mb-4">
                              <p className="text-sm text-gray-600 font-archivo">Prix</p>
                              <p className="text-lg font-bold text-[#DE2788] font-archivo">
                                {formatPrice(booking.price)}
                              </p>
                            </div>
                          )}

                          {/* Status Badge */}
                          <div className="mb-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-archivo ${statusColor.bg} ${statusColor.text}`}
                            >
                              {getStatusLabel(booking.status)}
                            </span>
                          </div>

                          {/* Cancel Button */}
                          <Button
                            onClick={() => handleCancelBooking(booking.id)}
                            disabled={cancelingId === booking.id}
                            variant="outline"
                            className="w-full border-red-300 text-red-600 hover:bg-red-50 font-archivo"
                          >
                            {cancelingId === booking.id ? (
                              <>
                                <span className="animate-spin mr-2">⏳</span>
                                Annulation...
                              </>
                            ) : (
                              'Annuler la réservation'
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Rendez-vous passés */}
            {pastBookings.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-2xl font-bold text-gray-900 font-archivo">
                    Rendez-vous passés
                  </h2>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-500 text-white font-archivo">
                    {pastBookings.length}
                  </span>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {pastBookings.map((booking) => {
                    const statusColor = getStatusColor(booking.status);
                    return (
                      <div
                        key={booking.id}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden opacity-75 hover:opacity-100 transition-opacity"
                      >
                        <div className="p-6">
                          {/* Salon Name */}
                          <h3 className="text-lg font-semibold text-gray-900 font-archivo mb-2">
                            {booking.salon?.name || 'Studio Barber'}
                          </h3>

                          {/* Service(s) */}
                          <div className="mb-4">
                            <p className="text-sm text-gray-600 font-archivo">
                              {booking.isMultiService ? 'Services' : 'Service'}
                            </p>
                            {booking.isMultiService && booking.bookingServices ? (
                              <div className="space-y-1">
                                {booking.bookingServices.map((bs, index) => (
                                  <p key={bs.id} className="text-sm font-medium text-gray-900 font-archivo">
                                    {index + 1}. {bs.service.name} ({bs.duration} min)
                                  </p>
                                ))}
                              </div>
                            ) : (
                              <p className="text-base font-medium text-gray-900 font-archivo">
                                {booking.service?.name || 'Service'}
                              </p>
                            )}
                          </div>

                          {/* Date & Time */}
                          <div className="mb-4 space-y-2">
                            <div className="flex items-center gap-2 text-gray-700">
                              <svg
                                className="h-5 w-5 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                />
                              </svg>
                              <span className="text-sm font-archivo">
                                {formatDate(booking.startTime)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                              <svg
                                className="h-5 w-5 text-gray-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              <span className="text-sm font-archivo">
                                {formatTime(booking.startTime)}
                                {booking.duration && (
                                  <span className="text-gray-500">
                                    {' '}
                                    ({booking.duration} min)
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Staff */}
                          {booking.isMultiService && booking.bookingServices ? (
                            <div className="mb-4">
                              <p className="text-sm text-gray-600 font-archivo">Professionnels</p>
                              <div className="space-y-1">
                                {booking.bookingServices.map((bs, index) => (
                                  <p key={bs.id} className="text-sm font-medium text-gray-900 font-archivo">
                                    {index + 1}. {bs.staff.firstName} {bs.staff.lastName}
                                  </p>
                                ))}
                              </div>
                            </div>
                          ) : booking.staff ? (
                            <div className="mb-4">
                              <p className="text-sm text-gray-600 font-archivo">Professionnel</p>
                              <p className="text-base font-medium text-gray-900 font-archivo">
                                {booking.staff.firstName} {booking.staff.lastName}
                              </p>
                            </div>
                          ) : null}

                          {/* Price */}
                          {booking.price && (
                            <div className="mb-4">
                              <p className="text-sm text-gray-600 font-archivo">Prix</p>
                              <p className="text-lg font-bold text-[#DE2788] font-archivo">
                                {formatPrice(booking.price)}
                              </p>
                            </div>
                          )}

                          {/* Status Badge */}
                          <div className="mb-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-archivo ${statusColor.bg} ${statusColor.text}`}
                            >
                              {getStatusLabel(booking.status)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-600 font-archivo">
            &copy; 2024 Studio Barber. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}

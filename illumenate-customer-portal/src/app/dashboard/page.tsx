'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCustomerProjects, CustomerProject } from '@/lib/customer';
import { getLoggedUser, logout } from '@/lib/auth';

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<CustomerProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Check authentication
        const loggedUser = await getLoggedUser();
        if (!loggedUser) {
          router.push('/login');
          return;
        }
        setUser(loggedUser);

        // Fetch projects
        const customerProjects = await getCustomerProjects();
        setProjects(customerProjects);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load dashboard data'
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch {
      setError('Failed to logout');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-lg text-zinc-600 dark:text-zinc-400">
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Customer Portal
          </h1>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {user}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="rounded-md bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <h2 className="mb-6 text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Your Projects
        </h2>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-red-700 dark:bg-red-900/30 dark:text-red-400">
            {error}
          </div>
        )}

        {projects.length === 0 ? (
          <div className="rounded-lg border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-zinc-600 dark:text-zinc-400">
              No projects found.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link
                key={project.name}
                href={`/dashboard/projects/${project.name}`}
                className="block rounded-lg border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
              >
                <h3 className="mb-2 font-semibold text-zinc-900 dark:text-zinc-50">
                  {project.project_name}
                </h3>
                {project.project_code && (
                  <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-500">
                    Code: {project.project_code}
                  </p>
                )}
                {project.status && (
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                      project.status === 'Open'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : project.status === 'Completed'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    {project.status}
                  </span>
                )}
                {typeof project.percent_complete === 'number' && (
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-zinc-500">
                      <span>Progress</span>
                      <span>{project.percent_complete}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${project.percent_complete}%` }}
                      />
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

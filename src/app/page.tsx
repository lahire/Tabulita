import Link from 'next/link';

export default function Home() {
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-8 row-start-2 items-center text-center">
        <h1 className="text-5xl font-bold">Tabulita</h1>
        <p className="text-xl text-foreground/80">
          Track wishlists and character progress<br />
          for Path of Exile private leagues
        </p>

        <div className="flex gap-4 items-center flex-col sm:flex-row mt-4">
          <Link
            href="/signup"
            className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-6"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-solid border-foreground/20 transition-colors flex items-center justify-center hover:bg-foreground/10 text-sm sm:text-base h-10 sm:h-12 px-6"
          >
            Sign In
          </Link>
        </div>

        <div className="mt-8 space-y-4 max-w-2xl">
          <div className="p-6 rounded-lg border border-foreground/20 text-left">
            <h3 className="font-semibold mb-2">Item Wishlist</h3>
            <p className="text-sm text-foreground/60">
              Track unique items and rares with specific affixes. Get notified when your friends find what you need.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-foreground/20 text-left">
            <h3 className="font-semibold mb-2">League Management</h3>
            <p className="text-sm text-foreground/60">
              Create private leagues, invite friends, and track everyone's progress and character levels.
            </p>
          </div>
          <div className="p-6 rounded-lg border border-foreground/20 text-left">
            <h3 className="font-semibold mb-2">Discord Integration</h3>
            <p className="text-sm text-foreground/60">
              Automatic notifications to your Discord server when items are found or delivered.
            </p>
          </div>
        </div>
      </main>
      <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
        <p className="text-sm text-foreground/60">Built for Path of Exile private leagues</p>
      </footer>
    </div>
  );
}

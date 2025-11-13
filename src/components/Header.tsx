export function Header() {
  return (
    <header className="bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Strudel Sample Explorer</h1>
            <p className="text-purple-100 mt-1">
              Discover and explore Strudel sound samples from GitHub
            </p>
          </div>
          <div className="text-right text-sm text-purple-100">
            <div>Search • Load • Play</div>
            <div className="text-xs mt-1">Powered by GitHub API</div>
          </div>
        </div>
      </div>
    </header>
  );
}
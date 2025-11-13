import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { useSoundStore } from '../store/soundStore';
import { downloadExport, importFromFile } from '../utils/export-import';
import { useToast } from '../hooks/useToast';

export function ExportImport() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [pendingImport, setPendingImport] = useState<{ file: File; count: number } | null>(null);
  const savedRepositories = useSoundStore((state) => state.savedRepositories);
  const importRepositories = useSoundStore((state) => state.importRepositories);
  const importBlocklist = useSoundStore((state) => state.importBlocklist);
  const importCustomUrls = useSoundStore((state) => state.importCustomUrls);
  const getBlockedRepos = useSoundStore((state) => state.getBlockedRepos);
  const getCustomUrls = useSoundStore((state) => state.getCustomUrls);
  const clearPreviews = useSoundStore((state) => state.clearPreviews);
  const previewRepositories = useSoundStore((state) => state.previewRepositories);
  const toast = useToast();

  const handleExport = () => {
    if (savedRepositories.length === 0) {
      toast.info('No saved repositories to export. Star some repositories first!');
      return;
    }
    
    const blocklist = getBlockedRepos();
    const customUrls = getCustomUrls();
    downloadExport(savedRepositories, blocklist, customUrls);
    
    let successMessage = `Exported ${savedRepositories.length} saved repositories`;
    if (blocklist.length > 0) {
      successMessage += `, ${blocklist.length} blocked repositories`;
    }
    if (customUrls.length > 0) {
      successMessage += `, ${customUrls.length} custom URLs`;
    }
    toast.success(successMessage + '!');
  };

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await importFromFile(file);
      setPendingImport({ file, count: data.repositories.length });
    } catch (error) {
      toast.error(`Failed to import: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const confirmImport = async () => {
    if (!pendingImport) return;

    try {
      const data = await importFromFile(pendingImport.file);
      importRepositories(data.repositories);
      
      // Import blocklist if present
      if (data.blocklist && data.blocklist.length > 0) {
        importBlocklist(data.blocklist);
      }
      
      // Import custom URLs if present
      if (data.customUrls && data.customUrls.length > 0) {
        importCustomUrls(data.customUrls);
      }
      
      let successMessage = `Successfully imported ${data.repositories.length} repositories`;
      if (data.blocklist && data.blocklist.length > 0) {
        successMessage += `, ${data.blocklist.length} blocked repositories`;
      }
      if (data.customUrls && data.customUrls.length > 0) {
        successMessage += `, ${data.customUrls.length} custom URLs`;
      }
      toast.success(successMessage + '!');
      setPendingImport(null);
    } catch (error) {
      toast.error(`Failed to import: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setPendingImport(null);
    }
  };

  const handleClearPreviews = () => {
    if (previewRepositories.length === 0) return;
    clearPreviews();
    toast.info('All preview sounds cleared');
    setShowClearConfirm(false);
  };

  const savedCount = savedRepositories.length;
  
  return (
    <>
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          disabled={savedCount === 0}
          className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          title="Export saved repositories"
        >
          📥 Export Saved ({savedCount})
        </button>
            
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          title="Import previously exported saved repositories"
        >
          📤 Import
        </button>
        
        {previewRepositories.length > 0 && !showClearConfirm && (
          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            title="Clear all preview sounds"
          >
            🗑️ Clear Previews
          </button>
        )}
        
        {showClearConfirm && (
          <>
            <button
              onClick={handleClearPreviews}
              className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
            >
              ✓ Confirm Clear
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-3 py-1.5 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400 transition-colors"
            >
              ✗ Cancel
            </button>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
      </div>

      {pendingImport && (
        <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-900 mb-2">
            Import {pendingImport.count} repositories? This will replace your current saved sounds.
          </p>
          <div className="flex gap-2">
            <button
              onClick={confirmImport}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              ✓ Import
            </button>
            <button
              onClick={() => setPendingImport(null)}
              className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
            >
              ✗ Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
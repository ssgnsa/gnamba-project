import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import { FileBrowserService } from '@/lib/filebrowser';

export default function Documents() {
  const { user, loading: authLoading } = useAuth();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setFiles([]);
      return;
    }

    const fetchFiles = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await FileBrowserService.getFiles("/");
        setFiles(data);
      } catch (err) {
        console.error('Error fetching files:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setFiles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [user]);

  if (authLoading) {
    return <div>Loading authentication...</div>;
  }

  if (!user) {
    return <div>Please log in to access the documents.</div>;
  }

  if (loading) {
    return <div>Loading documents...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h1>Documents</h1>
      {files.length === 0 ? (
        <p>No documents found.</p>
      ) : (
        <ul>
          {files.map((file) => (
            <li key={file.path}>
              {file.name} ({file.size} bytes) - {file.modified}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

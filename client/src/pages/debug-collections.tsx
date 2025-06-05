import { useQuery } from "@tanstack/react-query";

interface CollectionWithCount {
  id: number;
  name: string;
  icon: string;
  color: string;
  noteCount: number;
  openTodoCount: number;
}

export default function DebugCollections() {
  const { data: collections, isLoading, error } = useQuery<CollectionWithCount[]>({
    queryKey: ["/api/collections"],
    staleTime: 0,
    gcTime: 0,
  });

  if (isLoading) return <div>Loading collections...</div>;
  if (error) return <div>Error: {String(error)}</div>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Debug Collections</h1>
      <p className="mb-4">Total collections: {collections?.length || 0}</p>
      
      <div className="space-y-2">
        {collections?.map((collection) => (
          <div key={collection.id} className="p-3 border rounded">
            <div className="font-semibold">{collection.name} (ID: {collection.id})</div>
            <div className="text-sm text-gray-600">
              Icon: {collection.icon} | Color: {collection.color} | Notes: {collection.noteCount}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Movies & TV Collection</h2>
        {collections?.find(c => c.name === "Movies & TV") ? (
          <div className="p-3 bg-green-100 border border-green-300 rounded">
            ✓ Movies & TV collection found! ID: {collections.find(c => c.name === "Movies & TV")?.id}
          </div>
        ) : (
          <div className="p-3 bg-red-100 border border-red-300 rounded">
            ✗ Movies & TV collection not found in frontend data
          </div>
        )}
      </div>
    </div>
  );
}
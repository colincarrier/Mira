#!/bin/bash
set -e
perl -pi -e 's/refetchInterval:\s*2000/refetchInterval: false/' client/src/components/activity-feed.tsx
# defensive purge on mount
perl -0777 -pi -e 's@(useQuery\([^)]*\);)@\1\n\n  // purge possibly-corrupted cache\n  useEffect(() => {\n    queryClient.invalidateQueries({ queryKey: queryKeys.notes.detail(id) });\n  }, [id]);@s' client/src/pages/note-detail.tsx

import { getClassGroups } from "@/server/actions/classes";
import { GradebookContainer } from "@/components/gradebook/gradebook-container";

export default async function GradebookPage() {
  // Fetch classes once on the server
  const classes = await getClassGroups();

  // The client container handles URL parsing (via useSearchParams), caching, 
  // and ensuring GradebookGrid gets a unique key to prevent stale state.
  return <GradebookContainer classes={classes} />;
}

import { getClassGroups } from "@/server/actions/classes";
import { getGradebookData } from "@/server/actions/gradebook";
import { GradebookContainer } from "@/components/gradebook/gradebook-container";

export default async function GradebookPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Fetch classes once on the server
  const classes = await getClassGroups();
  const params = await searchParams;

  const classIdParam = params.class as string | undefined;
  const activeClass = classIdParam 
    ? classes.find((c) => c.id === classIdParam) || classes[0]
    : classes[0];

  let initialData = null;
  if (activeClass) {
    initialData = await getGradebookData(activeClass.id);
  }

  // The client container handles URL parsing (via useSearchParams), caching, 
  // and ensuring GradebookGrid gets a unique key to prevent stale state.
  return <GradebookContainer classes={classes} initialData={initialData} />;
}

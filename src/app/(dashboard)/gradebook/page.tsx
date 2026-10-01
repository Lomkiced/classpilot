import { getClassGroups } from "@/server/actions/classes";
import { getGradebookData } from "@/server/actions/gradebook";
import { GradebookContainer } from "@/components/gradebook/gradebook-container";

export default async function GradebookPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams;
  const classIdParam = params.class as string | undefined;

  let classes: any[] = [];
  let initialData = null;

  if (classIdParam) {
    const [fetchedClasses, fetchedData] = await Promise.all([
      getClassGroups(),
      getGradebookData(classIdParam).catch(() => null),
    ]);
    classes = fetchedClasses;
    initialData = fetchedData;
  } else {
    classes = await getClassGroups();
    if (classes.length > 0) {
      initialData = await getGradebookData(classes[0].id).catch(() => null);
    }
  }

  // The client container handles URL parsing (via useSearchParams), caching, 
  // and ensuring GradebookGrid gets a unique key to prevent stale state.
  return <GradebookContainer classes={classes} initialData={initialData} />;
}

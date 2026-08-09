import Link from "next/link";
import { redirect } from "next/navigation";
import { getClassGroups, getStudentsForClass } from "@/server/actions/classes";
import { RosterTable } from "@/components/classes/roster-table";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ClassesPage({ searchParams }: PageProps) {
  const classes = await getClassGroups();
  const awaitedSearchParams = await searchParams;

  // No classes state (before running seed script)
  if (classes.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 shadow-sm ring-1 ring-gray-950/5 text-center">
        <h2 className="text-xl font-bold text-gray-900">No classes found</h2>
        <p className="mt-2 text-sm text-gray-500">Run the database seed script to populate your classes.</p>
      </div>
    );
  }

  // Determine active class from URL search param `?class=<id>`
  // Default to the first class if none provided
  const activeClassParam = awaitedSearchParams.class as string;
  const activeClass = classes.find((c) => c.id === activeClassParam) || classes[0];

  // If a class is found but URL param is missing, we could redirect, but 
  // rendering it directly is faster and we can let the UI dictate the active state
  
  // Fetch students for the active class
  const students = await getStudentsForClass(activeClass.id);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header & Tabs */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Classes & Roster</h1>
          <p className="text-sm text-gray-500">Manage your students across different class groups.</p>
        </div>

        {/* Class Selector Tabs (Pills) */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-4">
          {classes.map((cls) => {
            const isActive = cls.id === activeClass.id;
            return (
              <Link
                key={cls.id}
                href={`/classes?class=${cls.id}`}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-gray-900 text-white shadow-sm"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                {cls.name}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Roster Area */}
      <div>
        <RosterTable classGroupId={activeClass.id} students={students} />
      </div>

    </div>
  );
}

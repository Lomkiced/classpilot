"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ClassSelectorProps {
  classes: { id: string; name: string }[];
  activeClassId: string;
}

export function ClassSelector({ classes, activeClassId }: ClassSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSelect = (classId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("class", classId);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Select value={activeClassId} onValueChange={handleSelect}>
      <SelectTrigger className="w-[200px] focus:ring-pink-500">
        <span className="flex-1 text-left truncate">
          {classes.find((c) => c.id === activeClassId)?.name || "Select class"}
        </span>
      </SelectTrigger>
      <SelectContent>
        {classes.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

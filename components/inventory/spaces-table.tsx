"use client";

import { MapPin, Pencil, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { SpaceDialog } from "./space-dialog";
import {
  SPACE_KIND_LABEL,
  SPACE_KIND_TONE,
  type SpaceRow,
} from "./inventory-types";

function cap(n: number | null): string {
  return n ? n.toLocaleString("en-IN") : "—";
}

export function SpacesTable({
  spaces,
  liveDb,
}: {
  spaces: SpaceRow[];
  liveDb: boolean;
}) {
  return (
    <Card className="border-border/70 gap-0 overflow-hidden py-0">
      <CardHeader className="flex flex-col gap-3 border-b py-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base">
          Spaces
          <span className="ml-2 text-sm font-normal text-muted-foreground tabular-nums">
            {spaces.length}
          </span>
        </CardTitle>
        <SpaceDialog liveDb={liveDb} />
      </CardHeader>

      <CardContent className="p-0">
        {spaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <MapPin className="size-6" />
            </span>
            <div>
              <p className="font-medium">No spaces yet</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Add your first lawn or hall to start quoting.
              </p>
            </div>
            <SpaceDialog liveDb={liveDb} />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Space</TableHead>
                <TableHead>Kind</TableHead>
                <TableHead className="text-right">Seated</TableHead>
                <TableHead className="text-right">Floating</TableHead>
                <TableHead className="w-10 pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {spaces.map((space) => {
                const tone =
                  SPACE_KIND_TONE[space.kind] ?? SPACE_KIND_TONE.lawn;
                return (
                  <TableRow key={space.id}>
                    <TableCell className="pl-4">
                      <div className="font-medium">{space.name}</div>
                      {space.notes && (
                        <div className="line-clamp-1 text-xs text-muted-foreground">
                          {space.notes}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium",
                          tone.badge,
                        )}
                      >
                        <span
                          className={cn("size-1.5 rounded-full", tone.dot)}
                        />
                        {SPACE_KIND_LABEL[space.kind] ?? space.kind}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      <span className="inline-flex items-center justify-end gap-1.5">
                        <Users className="size-3.5 text-muted-foreground" />
                        {cap(space.seatedCapacity)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {cap(space.floatingCapacity)}
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <SpaceDialog
                        space={space}
                        liveDb={liveDb}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground"
                            aria-label={`Edit ${space.name}`}
                          >
                            <Pencil className="size-4" />
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

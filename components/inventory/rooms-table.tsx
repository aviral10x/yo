"use client";

import { BedDouble, Moon, Pencil } from "lucide-react";

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
import { formatINR } from "@/lib/format";
import { RoomDialog } from "./room-dialog";
import { type RoomRow } from "./inventory-types";

export function RoomsTable({
  rooms,
  liveDb,
}: {
  rooms: RoomRow[];
  liveDb: boolean;
}) {
  const totalRooms = rooms.reduce((sum, r) => sum + (r.count || 0), 0);

  return (
    <Card className="border-border/70 gap-0 overflow-hidden py-0">
      <CardHeader className="flex flex-col gap-3 border-b py-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base">
          Room blocks
          <span className="ml-2 text-sm font-normal text-muted-foreground tabular-nums">
            {totalRooms} room{totalRooms === 1 ? "" : "s"}
          </span>
        </CardTitle>
        <RoomDialog liveDb={liveDb} />
      </CardHeader>

      <CardContent className="p-0">
        {rooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <BedDouble className="size-6" />
            </span>
            <div>
              <p className="font-medium">No room blocks yet</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Add on-site stay to quote accommodation with the venue.
              </p>
            </div>
            <RoomDialog liveDb={liveDb} />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-4">Block</TableHead>
                <TableHead className="text-right">Rooms</TableHead>
                <TableHead className="text-right">Nightly tariff</TableHead>
                <TableHead className="w-10 pr-4" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => (
                <TableRow key={room.id}>
                  <TableCell className="pl-4 font-medium">
                    <span className="inline-flex items-center gap-2">
                      <BedDouble className="size-4 text-muted-foreground" />
                      {room.name}
                    </span>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {room.count ? room.count.toLocaleString("en-IN") : "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    <span className="inline-flex items-center justify-end gap-1.5">
                      <Moon className="size-3.5 text-muted-foreground" />
                      {room.tariff ? formatINR(room.tariff) : "—"}
                    </span>
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    <RoomDialog
                      room={room}
                      liveDb={liveDb}
                      trigger={
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground"
                          aria-label={`Edit ${room.name}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

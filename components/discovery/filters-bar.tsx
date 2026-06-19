"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FilterOption = { value: string; label: string };

const ANY = "any";

const CAPACITY_OPTIONS: FilterOption[] = [
  { value: "200", label: "200+ guests" },
  { value: "400", label: "400+ guests" },
  { value: "600", label: "600+ guests" },
  { value: "800", label: "800+ guests" },
  { value: "1000", label: "1,000+ guests" },
];

const BUDGET_OPTIONS: FilterOption[] = [
  { value: "1000000", label: "Under ₹10L" },
  { value: "2000000", label: "Under ₹20L" },
  { value: "3000000", label: "Under ₹30L" },
  { value: "5000000", label: "Under ₹50L" },
];

export function FiltersBar({
  cities,
  types,
  selected,
}: {
  cities: FilterOption[];
  types: FilterOption[];
  selected: {
    city: string;
    type: string;
    capacity: string;
    budget: string;
  };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!value || value === ANY) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      const query = params.toString();
      router.push(query ? `/venues?${query}` : "/venues", { scroll: false });
    },
    [router, searchParams],
  );

  const hasFilters =
    Boolean(selected.city) ||
    Boolean(selected.type) ||
    Boolean(selected.capacity) ||
    Boolean(selected.budget);

  return (
    <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium">
          <SlidersHorizontal className="size-4 text-primary" />
          Filter venues
        </p>
        {hasFilters ? (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-muted-foreground"
            onClick={() => router.push("/venues", { scroll: false })}
          >
            <X className="size-3.5" /> Clear all
          </Button>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FilterSelect
          label="City"
          placeholder="Any city"
          value={selected.city}
          options={cities}
          onChange={(v) => update("city", v)}
        />
        <FilterSelect
          label="Venue type"
          placeholder="Any type"
          value={selected.type}
          options={types}
          onChange={(v) => update("type", v)}
        />
        <FilterSelect
          label="Guest capacity"
          placeholder="Any capacity"
          value={selected.capacity}
          options={CAPACITY_OPTIONS}
          onChange={(v) => update("capacity", v)}
        />
        <FilterSelect
          label="Budget"
          placeholder="Any budget"
          value={selected.budget}
          options={BUDGET_OPTIONS}
          onChange={(v) => update("budget", v)}
        />
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  placeholder,
  value,
  options,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <Select value={value || ANY} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>{placeholder}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

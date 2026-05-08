import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

function escapeCsvField(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (
    str.includes(";") ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r")
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsv(data: unknown[], columns: string[]): string {
  const header = columns.join(";");
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = (row as Record<string, unknown>)[col];
        return escapeCsvField(value);
      })
      .join(";"),
  );
  return [header, ...rows].join("\n");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { table, filters, columns } = body as {
      table: string;
      filters?: Record<string, unknown>;
      columns?: string[];
    };

    if (!table || typeof table !== "string") {
      return NextResponse.json(
        {
          error:
            "Le paramètre 'table' est requis et doit être une chaîne de caractères.",
        },
        { status: 400 },
      );
    }

    const supabase = createServerSupabase();

    let query = supabase.from(table).select("*");

    if (filters && typeof filters === "object") {
      for (const [key, value] of Object.entries(filters)) {
        if (value === null || value === undefined) continue;
        if (Array.isArray(value)) {
          query = query.in(key, value);
        } else if (typeof value === "object") {
          const filterObj = value as Record<string, unknown>;
          if ("gte" in filterObj)
            query = query.gte(key, filterObj.gte as string);
          if ("lte" in filterObj)
            query = query.lte(key, filterObj.lte as string);
          if ("gt" in filterObj) query = query.gt(key, filterObj.gt as string);
          if ("lt" in filterObj) query = query.lt(key, filterObj.lt as string);
          if ("eq" in filterObj) query = query.eq(key, filterObj.eq as string);
          if ("neq" in filterObj)
            query = query.neq(key, filterObj.neq as string);
          if ("like" in filterObj)
            query = query.like(key, filterObj.like as string);
          if ("ilike" in filterObj)
            query = query.ilike(key, filterObj.ilike as string);
        } else {
          query = query.eq(key, value);
        }
      }
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: `Erreur Supabase: ${error.message}`, code: error.code },
        { status: 500 },
      );
    }

    if (!data || data.length === 0) {
      const emptyCsv = columns ? columns.join(";") : "";
      return new Response(emptyCsv, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="${table}_export.csv"`,
        },
      });
    }

    const resolvedColumns =
      columns && columns.length > 0
        ? columns
        : Object.keys(data[0] as Record<string, unknown>);

    const csv = toCsv(data, resolvedColumns);

    const filename = `${table}_export_${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Export-Rows": String(data.length),
        "X-Export-Table": table,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erreur inconnue lors de l'export";
    return NextResponse.json(
      { error: `Erreur lors de l'export: ${message}` },
      { status: 500 },
    );
  }
}

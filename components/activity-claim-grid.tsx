import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  Grid3X3,
  Scale,
  Users,
} from "lucide-react";

import type {
  ActivityGridClaim,
  ActivityGridContributor,
} from "@/lib/activity-grid";

/**
 * Props for the activity claim grid visualization.
 * Pass already-resolved claim models from `getActivityGridClaims`.
 */
export interface ActivityClaimGridProps {
  claims: ActivityGridClaim[];
}

interface ContributorTreemapTile {
  contributor: ActivityGridContributor;
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

const TILE_COLORS = [
  "#1f4d3a",
  "#9a4f1f",
  "#384b8f",
  "#8a6d16",
  "#6b3a6d",
  "#255e6a",
] as const;

function formatDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatDateRange(claim: ActivityGridClaim): string {
  const start = formatDate(claim.startDate);
  const end = formatDate(claim.endDate);

  if (start && end) return `${start} → ${end}`;
  if (start) return `Since ${start}`;
  if (claim.createdAt) return `Created ${formatDate(claim.createdAt)}`;
  return "No timeframe";
}

function cardSpan(index: number, claim: ActivityGridClaim): string {
  if (index === 0 && claim.contributors.length >= 3) return "lg:col-span-2";
  if (claim.contributors.length >= 6) return "lg:col-span-2";
  return "";
}

function splitForBalancedArea(contributors: ActivityGridContributor[]): number {
  const total = contributors.reduce(
    (sum, contributor) => sum + contributor.weight,
    0,
  );
  const target = total / 2;
  let running = 0;
  let split = 1;

  for (let index = 0; index < contributors.length - 1; index += 1) {
    const next = running + contributors[index].weight;
    if (index > 0 && Math.abs(target - running) <= Math.abs(target - next)) {
      break;
    }
    running = next;
    split = index + 1;
  }

  return Math.max(1, Math.min(split, contributors.length - 1));
}

function buildTreemapTiles(
  contributors: ActivityGridContributor[],
  x: number,
  y: number,
  width: number,
  height: number,
  startIndex: number,
): ContributorTreemapTile[] {
  if (contributors.length === 0) return [];
  if (contributors.length === 1) {
    return [
      {
        contributor: contributors[0],
        index: startIndex,
        x,
        y,
        width,
        height,
      },
    ];
  }

  const split = splitForBalancedArea(contributors);
  const left = contributors.slice(0, split);
  const right = contributors.slice(split);
  const leftWeight = left.reduce(
    (sum, contributor) => sum + contributor.weight,
    0,
  );
  const totalWeight =
    leftWeight +
    right.reduce((sum, contributor) => sum + contributor.weight, 0);
  const ratio = totalWeight > 0 ? leftWeight / totalWeight : 0.5;

  if (width >= height) {
    const leftWidth = width * ratio;
    return [
      ...buildTreemapTiles(left, x, y, leftWidth, height, startIndex),
      ...buildTreemapTiles(
        right,
        x + leftWidth,
        y,
        width - leftWidth,
        height,
        startIndex + left.length,
      ),
    ];
  }

  const topHeight = height * ratio;
  return [
    ...buildTreemapTiles(left, x, y, width, topHeight, startIndex),
    ...buildTreemapTiles(
      right,
      x,
      y + topHeight,
      width,
      height - topHeight,
      startIndex + left.length,
    ),
  ];
}

function createTreemapTiles(
  contributors: ActivityGridContributor[],
): ContributorTreemapTile[] {
  return buildTreemapTiles(contributors, 0, 0, 100, 100, 0);
}

function isCompactTile(tile: ContributorTreemapTile): boolean {
  return tile.width < 20 || tile.height < 22 || tile.contributor.percentage < 7;
}

function ContributorTile({ tile }: { tile: ContributorTreemapTile }) {
  const { contributor, index } = tile;
  const color = TILE_COLORS[index % TILE_COLORS.length];
  const compact = isCompactTile(tile);

  return (
    <div
      className="group/tile absolute isolate overflow-hidden rounded-[1.35rem] border border-white/55 bg-stone-50 shadow-[0_14px_34px_rgba(31,30,25,0.12)] transition duration-300 hover:z-20 hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(31,30,25,0.18)]"
      style={{
        left: `${tile.x}%`,
        top: `${tile.y}%`,
        width: `${tile.width}%`,
        height: `${tile.height}%`,
        padding: compact ? "0.65rem" : "1rem",
        background: `linear-gradient(145deg, ${color}20, #fffaf0 55%, ${color}14)`,
      }}
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: color }}
      />
      <div className="absolute -top-10 -right-10 size-32 rounded-full bg-white/45 blur-2xl" />

      {compact ? (
        <div className="relative flex h-full flex-col justify-between gap-2">
          <p className="font-[family-name:var(--font-syne)] text-sm font-black text-stone-950">
            {contributor.percentage.toFixed(1)}%
          </p>
          <div>
            <h3 className="line-clamp-2 font-[family-name:var(--font-syne)] text-sm leading-none font-bold tracking-tight text-stone-950">
              {contributor.displayName}
            </h3>
            <p className="mt-1 font-[family-name:var(--font-outfit)] text-[10px] font-semibold tracking-[0.14em] text-stone-500 uppercase">
              {contributor.weightLabel} units
            </p>
          </div>
        </div>
      ) : (
        <div className="relative flex h-full flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="relative aspect-square w-[clamp(2.75rem,28%,4rem)] overflow-hidden rounded-full border-[3px] border-white bg-white shadow-lg ring-1 ring-black/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={contributor.imageUrl}
                alt={`${contributor.displayName} contribution image`}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition duration-500 group-hover/tile:scale-110"
              />
            </div>
            <div className="rounded-full border border-black/10 bg-white/75 px-3 py-1 text-right shadow-sm backdrop-blur">
              <p className="font-[family-name:var(--font-syne)] text-sm font-bold text-stone-950">
                {contributor.percentage.toFixed(1)}%
              </p>
              <p className="font-[family-name:var(--font-outfit)] text-[10px] font-semibold tracking-[0.2em] text-stone-500 uppercase">
                weight
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="font-[family-name:var(--font-syne)] text-xl leading-none font-bold tracking-tight text-stone-950">
                {contributor.displayName}
              </h3>
              <p className="mt-1 line-clamp-1 font-[family-name:var(--font-outfit)] text-xs text-stone-600">
                {contributor.identity}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-3 py-1 font-[family-name:var(--font-outfit)] text-xs font-semibold text-white shadow-sm"
                style={{ backgroundColor: color }}
              >
                {contributor.weightLabel} units
              </span>
              {contributor.role ? (
                <span className="line-clamp-1 rounded-full border border-stone-950/10 bg-white/70 px-3 py-1 font-[family-name:var(--font-outfit)] text-xs text-stone-700">
                  {contributor.role}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ClaimCard({
  claim,
  index,
}: {
  claim: ActivityGridClaim;
  index: number;
}) {
  const formattedCreated = formatDate(claim.createdAt);
  const treemapTiles = createTreemapTiles(claim.contributors);

  return (
    <article
      className={`group/card overflow-hidden rounded-[2rem] border border-stone-950/10 bg-[#f8f3e7]/90 p-3 shadow-[0_28px_90px_rgba(49,43,31,0.14)] backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-stone-950/20 ${cardSpan(
        index,
        claim,
      )}`}
    >
      <div className="grid gap-4 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="relative min-h-[360px] overflow-hidden rounded-[1.55rem] bg-stone-950 text-white">
          {claim.imageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={claim.imageUrl}
                alt={`${claim.title} cover`}
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover opacity-80 transition duration-700 group-hover/card:scale-105"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(12,13,10,0.1),rgba(12,13,10,0.82))]" />
            </>
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(217,249,157,0.42),transparent_28%),radial-gradient(circle_at_86%_18%,rgba(251,191,36,0.35),transparent_26%),linear-gradient(145deg,#16231c,#3e3622_55%,#151716)]" />
          )}

          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.12)_0_1px,transparent_1px_24px)] opacity-45" />
          <div className="relative flex h-full min-h-[360px] flex-col justify-between p-6">
            <div className="flex items-center justify-between gap-3">
              <div className="rounded-full border border-white/25 bg-white/15 px-3 py-1 font-[family-name:var(--font-outfit)] text-xs font-semibold tracking-[0.18em] uppercase backdrop-blur">
                Activity claim
              </div>
              <Link
                href={`/hypercerts/${encodeURIComponent(claim.uri)}`}
                className="flex size-10 items-center justify-center rounded-full border border-white/30 bg-white/15 backdrop-blur transition hover:bg-white hover:text-stone-950"
                aria-label={`Open ${claim.title}`}
              >
                <ArrowUpRight className="size-4" />
              </Link>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <p className="font-[family-name:var(--font-outfit)] text-xs font-semibold tracking-[0.22em] text-lime-100 uppercase">
                  {formattedCreated || "Undated"}
                </p>
                <h2 className="font-[family-name:var(--font-syne)] text-3xl leading-[0.95] font-black tracking-tight md:text-4xl">
                  {claim.title}
                </h2>
                <p className="line-clamp-3 max-w-xl font-[family-name:var(--font-outfit)] text-sm leading-6 text-stone-100/85">
                  {claim.shortDescription}
                </p>
              </div>

              <dl className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
                  <dt className="flex items-center gap-1.5 font-[family-name:var(--font-outfit)] text-[10px] font-semibold tracking-[0.18em] text-white/65 uppercase">
                    <Users className="size-3" /> Contributors
                  </dt>
                  <dd className="font-[family-name:var(--font-syne)] text-2xl font-bold">
                    {claim.contributors.length}
                  </dd>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
                  <dt className="flex items-center gap-1.5 font-[family-name:var(--font-outfit)] text-[10px] font-semibold tracking-[0.18em] text-white/65 uppercase">
                    <Scale className="size-3" /> Total weight
                  </dt>
                  <dd className="font-[family-name:var(--font-syne)] text-2xl font-bold">
                    {claim.totalWeight.toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div className="flex min-h-[520px] flex-col gap-4 rounded-[1.55rem] bg-[#fffaf0] p-4 ring-1 ring-stone-950/5 md:min-h-[460px]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-950/10 pb-3">
            <div>
              <p className="font-[family-name:var(--font-outfit)] text-xs font-semibold tracking-[0.22em] text-stone-500 uppercase">
                Weighted contribution map
              </p>
              <p className="mt-1 flex items-center gap-2 font-[family-name:var(--font-outfit)] text-sm text-stone-700">
                <CalendarDays className="size-4" />
                {formatDateRange(claim)}
              </p>
            </div>
            {claim.workScope.length > 0 ? (
              <div className="flex max-w-md flex-wrap justify-end gap-1.5">
                {claim.workScope.slice(0, 4).map((scope) => (
                  <span
                    key={scope}
                    className="rounded-full border border-stone-950/10 bg-stone-100 px-2.5 py-1 font-[family-name:var(--font-outfit)] text-xs text-stone-700"
                  >
                    {scope}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {treemapTiles.length > 0 ? (
            <div className="relative flex-1 overflow-hidden rounded-[1.35rem] bg-stone-950/5">
              {treemapTiles.map((tile) => (
                <ContributorTile key={tile.contributor.id} tile={tile} />
              ))}
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-[1.35rem] border border-dashed border-stone-950/20 bg-stone-100/70 p-10 text-center">
              <div className="space-y-3">
                <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-stone-950 text-white">
                  <Grid3X3 className="size-6" />
                </div>
                <p className="font-[family-name:var(--font-syne)] text-lg font-bold text-stone-950">
                  No contributor weights yet
                </p>
                <p className="max-w-sm font-[family-name:var(--font-outfit)] text-sm text-stone-600">
                  Add contributors with contributionWeight values and this panel
                  becomes a Hyperboards-style weighted image grid.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * Render activity claims as a polished weighted image grid inspired by Hyperboards.
 * Contributor tile areas are computed from contribution weights on the server.
 */
export function ActivityClaimGrid({ claims }: ActivityClaimGridProps) {
  if (claims.length === 0) {
    return (
      <div className="rounded-[2rem] border border-stone-950/10 bg-[#f8f3e7]/85 p-12 text-center shadow-[0_28px_90px_rgba(49,43,31,0.12)] backdrop-blur-xl">
        <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-stone-950 text-white">
          <Grid3X3 className="size-7" />
        </div>
        <h2 className="font-[family-name:var(--font-syne)] text-2xl font-black tracking-tight text-stone-950">
          No activity claims yet
        </h2>
        <p className="mx-auto mt-2 max-w-md font-[family-name:var(--font-outfit)] text-sm leading-6 text-stone-600">
          Create an activity claim with weighted contributors, then return here
          to see it rendered as a contribution image grid.
        </p>
      </div>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-7 lg:grid-cols-2">
      {claims.map((claim, index) => (
        <ClaimCard key={claim.uri} claim={claim} index={index} />
      ))}
    </section>
  );
}

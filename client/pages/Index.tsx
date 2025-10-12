import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/layout/Header";
import { useI18n } from "@/i18n";
import { AppShell } from "@/components/layout/AppSidebar";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import {
  useKpis,
  useStatusPie,
  useZonePie,
  useRegionLitersTotal,
} from "@/hooks/useDashboard";
import { useState } from "react";

const STATUS_COLORS = [
  "#f43f5e",
  "#fb923c",
  "#22c55e",
  "#06b6d4",
  "#a3a3a3",
  "#8b5cf6",
];
const ZONE_COLORS = [
  "#8b5cf6",
  "#06b6d4",
  "#f59e0b",
  "#22c55e",
  "#ef4444",
  "#0ea5e9",
];

export default function Index() {
  const { t } = useI18n();
  const { data: kpis } = useKpis();
  const { data: statusData } = useStatusPie();
  const { data: zoneData } = useZonePie();
  const { data: regionLiters } = useRegionLitersTotal();

  const cards = [
    {
      key: "totalLitersToday",
      value: `${(kpis?.litersToday ?? 0).toFixed(2)} liters`,
      color: "#E60000",
    },
    {
      key: "totalLiters30",
      value: `${(kpis?.liters30d ?? 0).toFixed(2)} liters`,
      color: "#0C2340",
    },
    {
      key: "activeMissions",
      value: String(kpis?.activeMissions ?? 0),
      color: "#5B6770",
    },
  ];

  return (
    <AppShell>
      <Header />
      <div className="px-4 pb-10 pt-4">
        <div className="mb-4 text-sm text-muted-foreground">
          {t("dashboard")}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((m) => (
            <Card key={m.key} className="overflow-hidden rounded-2xl shadow-sm">
              <div
                className="h-2 w-full"
                style={{ backgroundColor: m.color }}
              />
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm/6 text-[#6B7280] font-medium">
                    {t(m.key as any)}
                  </div>
                  <div className="text-2xl font-bold text-[#1F2937]">
                    {m.value}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <div className="mb-3 text-base font-semibold text-[#1F2937]">
                Mission Status Distribution
              </div>
              <ChartContainer config={{}} className="aspect-[4/3]">
                <PieChart>
                  <Pie
                    data={(statusData ?? []).map((d) => {
                      const name = String(d.name || "").toLowerCase();
                      let color = "#5B6770";
                      if (/(pending|creation)/.test(name)) color = "#E60000";
                      else if (/(in[_\-\s]?progress|reported)/.test(name))
                        color = "#FACC15";
                      else if (/approved/.test(name)) color = "#16A34A";
                      else if (/(rejected|canceled|cancelled)/.test(name))
                        color = "#5B6770";
                      return { ...d, color };
                    })}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {(statusData ?? []).map((d, i) => {
                      const name = String(d.name || "").toLowerCase();
                      let color = "#5B6770";
                      if (/(pending|creation)/.test(name)) color = "#E60000";
                      else if (/(in[_\-\s]?progress|reported)/.test(name))
                        color = "#FACC15";
                      else if (/approved/.test(name)) color = "#16A34A";
                      else if (/(rejected|canceled|cancelled)/.test(name))
                        color = "#5B6770";
                      return <Cell key={`s-${i}`} fill={color} />;
                    })}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="mb-3 text-base font-semibold text-[#1F2937]">
                Missions by Region
              </div>
              <ChartContainer config={{}} className="aspect-[4/3]">
                <PieChart>
                  <Pie
                    data={(zoneData ?? []).map((d, i) => ({
                      ...d,
                      color: ZONE_COLORS[i % ZONE_COLORS.length],
                    }))}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {(zoneData ?? []).map((_, i) => (
                      <Cell
                        key={`z-${i}`}
                        fill={ZONE_COLORS[i % ZONE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card className="overflow-hidden rounded-2xl shadow-sm">
            <div
              className="h-2 w-full"
              style={{ backgroundColor: "#0C2340" }}
            />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm/6 text-[#6B7280] font-medium">
                  Total added liters in Central
                </div>
                <div className="text-2xl font-bold text-[#1F2937]">
                  {Number(regionLiters?.central ?? 0).toFixed(2)} liters
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="overflow-hidden rounded-2xl shadow-sm">
            <div
              className="h-2 w-full"
              style={{ backgroundColor: "#06b6d4" }}
            />
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm/6 text-[#6B7280] font-medium">
                  Total added liters in East
                </div>
                <div className="text-2xl font-bold text-[#1F2937]">
                  {Number(regionLiters?.east ?? 0).toFixed(2)} liters
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DonutChart } from "@/components/charts/donut-chart";
import { HorizontalBarChart } from "@/components/charts/bar-chart";

type OverviewData = {
  categoryData: { name: string; value: number; color: string }[];
  supplierData: { name: string; value: number }[];
  urgencyData: { name: string; value: number; color: string }[];
  deliveryData: { name: string; value: number }[];
};

export default function AnalyticsPage() {
  const [data, setData] = useState<OverviewData | null>(null);

  useEffect(() => {
    fetch("/api/analytics/overview")
      .then((r) => r.json())
      .then(setData);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-orange-600">Analytics</p>
        <h1 className="font-display text-2xl font-semibold text-navy-800 sm:text-3xl">Ordering Trends</h1>
        <p className="mt-1 text-sm text-grey-500">Spend and volume by category, supplier, urgency and delivery method.</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Spend by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? <DonutChart data={data.categoryData} height={280} /> : <div className="skeleton h-64 rounded-xl" />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Spend by Supplier</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <HorizontalBarChart data={data.supplierData} height={280} color="#142244" />
            ) : (
              <div className="skeleton h-64 rounded-xl" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Orders by Urgency</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? <DonutChart data={data.urgencyData} height={260} /> : <div className="skeleton h-64 rounded-xl" />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Orders by Delivery Method</CardTitle>
          </CardHeader>
          <CardContent>
            {data ? (
              <HorizontalBarChart data={data.deliveryData} height={260} color="#ff6b00" />
            ) : (
              <div className="skeleton h-64 rounded-xl" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

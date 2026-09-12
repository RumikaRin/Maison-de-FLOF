"use client";

import { formatPrice } from "@/lib/utils";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

export function AdminRevenueChart({
  language,
  dailyLabels,
  dailyRevenue,
}: {
  language: "vi" | "en";
  dailyLabels: string[];
  dailyRevenue: number[];
}) {
  return (
    <Line
      data={{
        labels: dailyLabels,
        datasets: [
          {
            label: language === "vi" ? "Doanh thu (VND)" : "Revenue (VND)",
            data: dailyRevenue,
            fill: true,
            backgroundColor: "rgba(0, 123, 138, 0.12)",
            borderColor: "rgba(0, 123, 138, 1)",
            borderWidth: 2.5,
            tension: 0.4,
            pointBackgroundColor: "#ffffff",
            pointBorderColor: "rgba(0, 123, 138, 1)",
            pointBorderWidth: 2,
            pointRadius: 3.5,
            pointHoverRadius: 6,
            pointHoverBackgroundColor: "rgba(0, 123, 138, 1)",
            pointHoverBorderColor: "#ffffff",
            pointHoverBorderWidth: 2,
          },
        ],
      }}
      options={{
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: language === "vi" ? "Doanh thu 30 ngày" : "30-day revenue trend",
            color: "#6B5F52",
            font: { family: "sans-serif", size: 11, weight: "normal" },
            padding: { bottom: 15 },
          },
          tooltip: {
            backgroundColor: "#2F2822",
            titleColor: "#FAF9F6",
            bodyColor: "#FAF9F6",
            padding: 10,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: (context) => ` ${formatPrice(context.parsed.y)}`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: "#F3EFE8" },
            ticks: {
              color: "#6B5F52",
              callback: (value) => `${(Number(value) / 1000000).toFixed(1)}M`,
            },
          },
          x: {
            grid: { display: false },
            ticks: { color: "#6B5F52", maxRotation: 45, minRotation: 45 },
          },
        },
      }}
    />
  );
}

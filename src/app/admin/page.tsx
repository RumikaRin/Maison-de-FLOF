"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguageStore } from "@/store/language-store";
import { formatPrice } from "@/lib/utils";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { Paint, MOCK_PAINTS } from "@/lib/mock-data";


// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AdminDashboardPage() {
  const { language } = useLanguageStore();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<number[]>([]);
  const [dailyLabels, setDailyLabels] = useState<string[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);

    // 1. Get dynamic Orders from localStorage
    const storedOrders = localStorage.getItem("sonvn-orders");
    let ordersArray = [];
    if (storedOrders) {
      try {
        ordersArray = JSON.parse(storedOrders);
      } catch (e) {}
    } else {
        ordersArray = [
          { id: "SVN-992018", date: "2026-06-04", userEmail: "b2b-builder@gmail.com", customer: "Nhà thầu VietCons", items: "Sơn ngoại thất Jotashield cực bền 100L", total: 108000000, status: "COMPLETED" },
          { id: "SVN-839201", date: "2026-06-04", userEmail: "customer1@sonvn.com", customer: "Trần Thế Hưng", items: "Jotun Majestic 5L x 2, Trắng Ngà (1001)", total: 2850000, status: "COMPLETED" },
          { id: "SVN-193021", date: "2026-05-18", userEmail: "customer1@sonvn.com", customer: "Lê Hoàng Yến", items: "Dulux Weathershield 5L x 1, Xám Bạc (3002)", total: 1280000, status: "COMPLETED" },
          { id: "SVN-482019", date: "2026-06-03", userEmail: "customer2@sonvn.com", customer: "Nguyễn Minh Đức", items: "Sơn lót chống kiềm Majestic 5L x 1", total: 950000, status: "PENDING" }
        ];
        localStorage.setItem("sonvn-orders", JSON.stringify(ordersArray));
      }

    // 2. Get dynamic B2B Quotes from localStorage
    const storedQuotes = localStorage.getItem("sonvn-quotes");
    let quotesArray = [];
    if (storedQuotes) {
      try {
        quotesArray = JSON.parse(storedQuotes);
      } catch (e) {}
    } else {
      quotesArray = [
        {
          id: "QU-001",
          fullName: "Nguyễn Minh Phú",
          phone: "0912837264",
          email: "phu.nguyen@vietcons.vn",
          companyName: "Công ty Cổ phần VietCons",
          projectName: "Chung cư Hoàng Mai Block B",
          projectType: "Commercial",
          area: 1200,
          paintType: "Sơn Ngoại Thất Jotashield + Sơn Lót",
          message: "Cần báo giá khối lượng sơn phủ ngoại thất cao cấp cho tòa chung cư 18 tầng.",
          status: "PENDING",
          createdAt: "2026-06-05"
        },
        {
          id: "QU-002",
          fullName: "Trần Thị Hạnh",
          phone: "0987654321",
          email: "hanhtran.vin@gmail.com",
          companyName: "HanhTran Decor",
          projectName: "Biệt thự Vinhomes Riverside",
          projectType: "Residential",
          area: 650,
          paintType: "Sơn Nội Thất Jotun Majestic",
          message: "Biệt thự song lập đang trong giai đoạn trát hoàn thiện.",
          status: "CONTACTED",
          createdAt: "2026-06-03"
        },
        {
          id: "QU-003",
          fullName: "Vương Đình Việt",
          phone: "0909123456",
          email: "vietvd.industrial@gmail.com",
          companyName: "TNHH Cơ khí Đại Phong",
          projectName: "Nhà xưởng KCN Quế Võ",
          projectType: "Industrial",
          area: 4500,
          paintType: "Sơn Chống Thấm Jotun Waterguard",
          message: "Cần báo giá sơn chống thấm ngoài nhà xưởng diện tích lớn.",
          status: "QUOTED",
          createdAt: "2026-05-28"
        }
      ];
      localStorage.setItem("sonvn-quotes", JSON.stringify(quotesArray));
    }

    // 3. Compute stats metrics
    const totalRevenue = ordersArray
      .filter((o: any) => o.status !== "CANCELLED")
      .reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);

    const completedCount = ordersArray.filter((o: any) => o.status === "COMPLETED").length;
    const colorsCount = 17; // total COLOR_SWATCHES

    setStats([
      {
        label: language === "vi" ? "Tổng doanh thu thực tế" : "Total Actual Revenue",
        value: totalRevenue,
        color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
        change: "+12.4%",
        isPositive: true
      },
      {
        label: language === "vi" ? "Đơn hàng thành công" : "Completed Orders",
        value: completedCount,
        color: "bg-jotun-teal/10 text-jotun-teal border-jotun-teal/20",
        change: "+8.2%",
        isPositive: true
      },
      {
        label: language === "vi" ? "Mã màu thiết kế" : "Colors Available",
        value: colorsCount,
        color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
        change: "0.0%",
        isPositive: true
      }
    ]);

    // Set lists for displays
    setRecentOrders(ordersArray.slice(0, 4));

    // 3. Generate last 30 days daily revenue
    const dailyRevs: number[] = [];
    const dailyLabelsArray: string[] = [];
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      
      const dateStr = `${year}-${month}-${day}`;
      const labelStr = `${day}/${month}`;
      
      let daySum = ordersArray
        .filter((o: any) => o.status !== "CANCELLED" && o.date === dateStr)
        .reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
      
      dailyRevs.push(daySum);
      dailyLabelsArray.push(labelStr);
    }
    
    setDailyRevenue(dailyRevs);
    setDailyLabels(dailyLabelsArray);

    // 4. Calculate best-selling products dynamically
    const storedPaints = localStorage.getItem("sonvn-paints");
    let paintsList: Paint[] = [];
    if (storedPaints) {
      try {
        paintsList = JSON.parse(storedPaints);
      } catch (e) {}
    }
    if (paintsList.length === 0) {
      paintsList = MOCK_PAINTS;
    }

    const salesMap: Record<string, number> = {
      "paint-1": 48,
      "paint-3": 36,
      "paint-5": 29,
      "paint-2": 18,
    };

    ordersArray.forEach((o: any) => {
      if (o.status === "COMPLETED") {
        if (o.items.includes("Majestic 5L")) {
          salesMap["paint-1"] = (salesMap["paint-1"] || 0) + 2;
        } else if (o.items.includes("Weathershield")) {
          salesMap["paint-3"] = (salesMap["paint-3"] || 0) + 1;
        } else if (o.items.includes("lót chống kiềm")) {
          salesMap["paint-5"] = (salesMap["paint-5"] || 0) + 1;
        }
      }
    });

    const bestSellersData = Object.entries(salesMap)
      .map(([paintId, salesCount]) => {
        const paint = paintsList.find((p) => p.id === paintId);
        return {
          id: paintId,
          name: paint ? (language === "vi" ? paint.name : paint.nameEn) : "Unknown Paint",
          sku: paint ? paint.sku : "N/A",
          price: paint ? paint.price : 0,
          sales: salesCount,
          revenue: salesCount * (paint ? paint.price : 0),
          stock: paint ? paint.stock : 0,
        };
      })
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 4);

    setBestSellers(bestSellersData);
  }, [language]);

  if (!mounted) return null;

  // Revenue chart data fed from dynamic 30-day state
  const revenueChartData = {
    labels: dailyLabels,
    datasets: [
      {
        label: language === "vi" ? "Doanh thu (VND)" : "Revenue (VND)",
        data: dailyRevenue,
        fill: true,
        backgroundColor: "rgba(0, 123, 138, 0.12)", // Semi-transparent Jotun Teal
        borderColor: "rgba(0, 123, 138, 1)", // Jotun Teal primary
        borderWidth: 2.5,
        tension: 0.4, // Smooth curve like in the screenshot
        pointBackgroundColor: "#ffffff",
        pointBorderColor: "rgba(0, 123, 138, 1)",
        pointBorderWidth: 2,
        pointRadius: 3.5,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: "rgba(0, 123, 138, 1)",
        pointHoverBorderColor: "#ffffff",
        pointHoverBorderWidth: 2,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: language === "vi" ? "Doanh thu 30 ngày" : "30-day revenue trend",
        color: "#6B5F52", // warm-550
        font: {
          family: "sans-serif",
          size: 11,
          weight: "normal" as const
        },
        padding: {
          bottom: 15
        }
      },
      tooltip: {
        backgroundColor: "#2F2822", // warm-900 background
        titleColor: "#FAF9F6", // ivory text
        bodyColor: "#FAF9F6",
        padding: 10,
        borderRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context: any) => {
            return ` ${formatPrice(context.parsed.y)}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "#F3EFE8", // warm-200 grid lines
          drawBorder: false,
        },
        ticks: {
          color: "#6B5F52",
          callback: (value: any) => `${(value / 1000000).toFixed(1)}M`
        }
      },
      x: {
        grid: {
          display: false, // Clean horizontal layout
        },
        ticks: {
          color: "#6B5F52",
          maxRotation: 45,
          minRotation: 45,
        }
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-250/50 text-[10px] font-bold rounded-lg flex items-center gap-1 w-fit">
            {language === "vi" ? "Đã giao" : "Delivered"}
          </span>
        );
      case "PROCESSING":
        return (
          <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200/50 text-[10px] font-bold rounded-lg flex items-center gap-1 w-fit">
            {language === "vi" ? "Đang xử lý" : "Processing"}
          </span>
        );
      case "PENDING":
        return (
          <span className="px-2 py-0.5 bg-jotun-yellow/10 text-amber-800 border border-jotun-yellow/20 text-[10px] font-bold rounded-lg flex items-center gap-1 w-fit">
            {language === "vi" ? "Chờ duyệt" : "Pending"}
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200/50 text-[10px] font-bold rounded-lg flex items-center gap-1 w-fit">
            {language === "vi" ? "Đã hủy" : "Cancelled"}
          </span>
        );
      default:
        return null;
    }
  };



  return (
    <div className="flex flex-col gap-8 text-left">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold font-serif text-warm-900">
          {language === "vi" ? "Tổng Quan Quản Trị" : "Dashboard Overview"}
        </h1>
        <p className="text-warm-550 text-xs mt-1">
          {language === "vi"
            ? "Theo dõi nhanh doanh số bán hàng, số liệu đơn hàng và các hoạt động báo giá dự án."
            : "Quick analytics monitoring of sales, order statistics, and project quotes."}
        </p>
      </div>

      {/* Grid of stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          return (
            <div
              key={index}
              className="bg-white border border-warm-200/80 p-5 rounded-2xl shadow-sm flex items-center justify-between"
            >
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-warm-450 font-semibold">{stat.label}</span>
                <span className="text-2xl font-bold font-mono text-warm-900">
                  {typeof stat.value === "number" && stat.value > 1000
                    ? formatPrice(stat.value)
                    : stat.value}
                </span>
                <div className="flex items-center gap-1 text-[10px] font-semibold">
                  <span className="text-emerald-600">
                    {stat.change}
                  </span>
                  <span className="text-warm-400">so với tháng trước</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Stats Chart Row */}
      <div className="bg-white border border-warm-200/80 p-6 rounded-2xl shadow-sm flex flex-col gap-2">
        <h3 className="text-lg font-bold text-warm-900 font-serif">
          {language === "vi" ? "Doanh thu theo ngày" : "Daily Revenue"}
        </h3>
        <div className="h-[320px] w-full">
          <Line data={revenueChartData} options={chartOptions} />
        </div>
      </div>

      {/* Recent Orders and Best Selling Products Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Recent Orders (Left) */}
        <div className="lg:col-span-7 bg-white border border-warm-200/80 rounded-2xl shadow-sm p-6 overflow-hidden">
          <h3 className="font-serif font-bold text-lg mb-4 text-warm-900">
            {language === "vi" ? "Đơn hàng gần đây" : "Recent Orders"}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-warm-150 text-warm-450 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 pr-4">{language === "vi" ? "Mã đơn hàng" : "Order ID"}</th>
                  <th className="pb-3 px-4">{language === "vi" ? "Khách hàng" : "Customer"}</th>
                  <th className="pb-3 px-4">{language === "vi" ? "Ngày mua" : "Purchase Date"}</th>
                  <th className="pb-3 px-4">{language === "vi" ? "Tổng thanh toán" : "Total Amount"}</th>
                  <th className="pb-3 pl-4">{language === "vi" ? "Trạng thái" : "Status"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100 font-semibold">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-warm-50/50 transition-colors duration-200">
                    <td className="py-3.5 pr-4 font-mono font-bold text-jotun-teal">{ord.id}</td>
                    <td className="py-3.5 px-4 text-warm-800">{ord.customer}</td>
                    <td className="py-3.5 px-4 font-mono text-warm-500">{ord.date}</td>
                    <td className="py-3.5 px-4 font-mono text-warm-900 font-bold">{formatPrice(ord.total)}</td>
                    <td className="py-3.5 pl-4">{getStatusBadge(ord.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Best Selling Products (Right) */}
        <div className="lg:col-span-5 bg-white border border-warm-200/80 rounded-2xl shadow-sm p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-warm-100 pb-3">
            <h3 className="font-serif font-bold text-base text-warm-900">
              {language === "vi" ? "Sản phẩm bán chạy" : "Best Selling Products"}
            </h3>
            <Link href="/admin/paints" className="text-xs font-bold text-jotun-teal hover:underline cursor-pointer">
              {language === "vi" ? "Tất cả →" : "All →"}
            </Link>
          </div>

          <div className="flex flex-col gap-4">
            {bestSellers.map((prod, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs pb-3 border-b border-warm-100 last:border-0 last:pb-0">
                <div className="max-w-[65%]">
                  <h4 className="font-bold text-warm-850 truncate" title={prod.name}>
                    {prod.name}
                  </h4>
                  <p className="text-[10px] text-warm-500 mt-0.5 font-semibold">
                    SKU: <span className="font-mono text-[9px] font-bold">{prod.sku}</span> | {language === "vi" ? "Tồn: " : "Stock: "}{prod.stock}
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="font-bold text-warm-900 block">
                    {prod.sales} {language === "vi" ? "đơn vị" : "units"}
                  </span>
                  <span className="text-[10px] text-jotun-teal font-semibold">
                    {formatPrice(prod.revenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

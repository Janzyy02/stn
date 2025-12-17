import React from "react";

const Dashboard = () => {
  return (
    <main className="flex-1 p-8 bg-[#E5E7EB]/50 min-h-screen">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900">
            Inventory Dashboard
          </h1>
          <p className="text-gray-500 text-lg">
            Hello Robert, let's look at your financial data
          </p>
        </div>

        <div className="flex flex-col gap-2 mt-4 md:mt-0 items-end">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Select BI Dashboard:</span>
            <select className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm shadow-sm outline-none">
              <option>Inventory</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Showing data:</span>
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm shadow-sm flex items-center gap-2 cursor-pointer">
              <span>01 Mar, 2024 - 14 Mar, 2024</span>
              <span className="text-gray-400">📅</span>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Inventory Value */}
        <Card
          title="Total Inventory Value"
          subtitle="From 1-14 Mar, 2024"
          btnLabel="View More"
        >
          <div className="mt-2">
            <h2 className="text-4xl font-bold text-gray-800">₱100,000.00</h2>
            <div className="flex items-center text-green-600 font-medium mt-1">
              <span className="mr-1">📈</span> ₱10,000 Increase
            </div>
          </div>
        </Card>

        {/* Top Selling Products */}
        <Card
          title="Top Selling Products"
          subtitle="From 1-14 Mar, 2024"
          btnLabel="View more"
        >
          <div className="flex items-center justify-between gap-2 mt-2">
            <div className="relative w-24 h-24 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#f3f4f6"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="#10b981"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray="251"
                  strokeDashoffset="60"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-xs font-bold">₱10.285</span>
                <span className="text-[10px] text-green-500">+2.4%</span>
              </div>
            </div>
            <div className="text-[11px] space-y-1 flex-1 px-2">
              <LegendItem color="bg-blue-400" label="Rizal Cement" val="42%" />
              <LegendItem color="bg-purple-500" label="Zem Coat" val="36%" />
              <LegendItem color="bg-red-500" label="Davis Paint" val="15%" />
              <LegendItem color="bg-green-500" label="ABC Sealant" val="5%" />
            </div>
          </div>
        </Card>

        {/* Recent Restock (Supplier) */}
        <Card title="Recent Restock (Supplier)" btnLabel="See all">
          <div className="space-y-3 mt-2">
            <ProgressBar label="A" progress="90%" color="bg-green-700" />
            <ProgressBar label="B" progress="75%" color="bg-green-600" />
            <ProgressBar label="C" progress="30%" color="bg-green-900" />
          </div>
        </Card>

        {/* Deliveries History */}
        <Card title="Deliveries History" btnLabel="See all">
          <div className="text-[12px] space-y-3 mt-2">
            <HistoryRow
              date="01 Mar 202403010"
              status="Cancelled"
              statusColor="text-red-500"
            />
            <HistoryRow
              date="01 Mar 202403020"
              status="Completed"
              statusColor="text-green-500"
            />
            <HistoryRow
              date="01 Mar 202403030"
              status="Completed"
              statusColor="text-green-500"
            />
            <HistoryRow
              date="02 Mar 202403040"
              status="Completed"
              statusColor="text-green-500"
            />
          </div>
        </Card>

        {/* Inbound vs Outbound */}
        <Card title="Inbound vs Outbound" btnLabel="See all">
          <div className="flex justify-center gap-4 text-[10px] mb-2">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-800"></div> Purchase
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div> Sales
            </span>
          </div>
          <div className="h-24 flex items-end justify-around border-l border-b border-gray-200 px-2">
            <div className="w-4 bg-green-800 h-1/2 rounded-t-sm"></div>
            <div className="w-4 bg-green-500 h-3/4 rounded-t-sm"></div>
            <div className="w-4 bg-green-800 h-full rounded-t-sm"></div>
            <div className="w-4 bg-green-500 h-2/3 rounded-t-sm"></div>
          </div>
        </Card>

        {/* Stockout days to sell */}
        <Card title="Stockout days to sell">
          <div className="mt-2">
            <div className="flex items-center gap-2">
              <span className="text-5xl font-bold text-gray-800">39.98</span>
              <span className="text-xl text-gray-600">Days</span>
              <span className="text-2xl text-red-400">⚠️</span>
            </div>
            <button className="mt-4 px-4 py-1.5 bg-[#6EB2B2] text-white rounded text-xs">
              View more
            </button>
          </div>
        </Card>

        {/* Units On Stocks */}
        <Card title="Units On Stocks" btnLabel="View More"></Card>

        {/* Inventory Turnover Ratio */}
        <Card title="Inventory Turnover Ratio" btnLabel="View More">
          <div className="flex flex-col items-center">
            <div className="relative w-24 h-12 overflow-hidden">
              <div className="w-24 h-24 border-[10px] border-green-600 rounded-full border-b-transparent"></div>
            </div>
            <span className="font-bold text-gray-700">9.13</span>
          </div>
        </Card>

        {/* Inventory Health Monitor */}
        <Card title="Inventory Health Monitor" btnLabel="See all">
          <div className="mt-1">
            <p className="text-[10px] text-red-500 font-semibold mb-1">
              34 rizal cement stocks left (LOW STOCK)
            </p>
            <p className="text-sm font-bold">
              34 <span className="text-gray-400 font-normal">of 500pcs</span>
            </p>
            <div className="w-full bg-gray-200 h-3 rounded-full mt-2 overflow-hidden">
              <div className="bg-green-700 h-full w-[15%]"></div>
            </div>
          </div>
        </Card>
      </div>

      <footer className="text-center mt-12 text-gray-400 text-sm">
        © Synchronized Technologies 2025
      </footer>
    </main>
  );
};

/* Helper Components */
const Card = ({ title, subtitle, btnLabel, children }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between min-h-[200px]">
    <div>
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-bold text-gray-800 leading-tight">
          {title}
        </h3>
        {btnLabel && (
          <button className="text-[10px] bg-[#6EB2B2]/20 text-[#4A8B8B] px-3 py-1 rounded-md font-bold hover:bg-[#6EB2B2]/30 transition-colors">
            {btnLabel}
          </button>
        )}
      </div>
      {subtitle && <p className="text-[10px] text-gray-400 mt-1">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </div>
  </div>
);

const LegendItem = ({ color, label, val }) => (
  <div className="flex justify-between items-center">
    <div className="flex items-center gap-1.5">
      <div className={`w-2 h-2 rounded-full ${color}`}></div>
      <span className="text-gray-500">{label}</span>
    </div>
    <span className="font-bold text-gray-700">{val}</span>
  </div>
);

const ProgressBar = ({ label, progress, color }) => (
  <div className="flex items-center gap-2">
    <span className="text-xs text-gray-500 w-4">{label}</span>
    <div className="flex-1 bg-gray-100 h-4 rounded-sm overflow-hidden">
      <div className={`${color} h-full`} style={{ width: progress }}></div>
    </div>
  </div>
);

const HistoryRow = ({ date, status, statusColor }) => (
  <div className="flex justify-between border-b border-gray-50 pb-2">
    <span className="text-gray-600 font-medium">{date}</span>
    <span className={`${statusColor} font-bold`}>{status}</span>
  </div>
);

export default Dashboard;

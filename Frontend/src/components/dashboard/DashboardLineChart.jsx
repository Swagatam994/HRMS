import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

const chartOptions = (yMax = null, suffix = '') => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
      ...(yMax ? { max: yMax } : {}),
      ticks: {
        color: '#94a3b8',
        callback: (value) => `${value}${suffix}`
      },
      grid: { color: 'rgba(148, 163, 184, 0.12)' }
    },
    x: {
      ticks: { color: '#94a3b8', maxRotation: 45, minRotation: 0 },
      grid: { display: false }
    }
  },
  plugins: {
    legend: {
      display: true,
      labels: { color: '#94a3b8', boxWidth: 12 }
    },
    tooltip: {
      backgroundColor: '#11131c',
      borderColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1
    }
  }
});

export const DashboardLineChart = ({
  data = [],
  valueKey = 'percentage',
  label = 'Trend',
  color = '#60a5fa',
  yMax = null,
  suffix = '',
  emptyMessage = 'No data yet',
  datasets = null
}) => {
  const hasData = datasets
    ? datasets.some((ds) => ds.data?.length)
    : data.length && data.some((item) => Number(item[valueKey]) > 0);

  if (!hasData) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-white/[0.15] text-sm text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  const chartData = datasets || {
    labels: data.map((item) => item.label),
    datasets: [
      {
        label,
        data: data.map((item) => item[valueKey]),
        borderColor: color,
        backgroundColor: `${color}29`,
        tension: 0.38,
        fill: true,
        pointBackgroundColor: color,
        pointBorderColor: '#08090f',
        pointBorderWidth: 2
      }
    ]
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={chartOptions(yMax, suffix)} />
    </div>
  );
};

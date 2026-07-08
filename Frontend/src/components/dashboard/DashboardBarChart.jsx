import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const palette = ['#60a5fa', '#34d399', '#fbbf24', '#f87171', '#a78bfa', '#22d3ee'];

const chartOptions = (horizontal = false) => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: horizontal ? 'y' : 'x',
  scales: {
    y: {
      beginAtZero: true,
      ticks: { color: '#94a3b8' },
      grid: { color: 'rgba(148, 163, 184, 0.12)' }
    },
    x: {
      ticks: { color: '#94a3b8', maxRotation: horizontal ? 0 : 45, minRotation: 0 },
      grid: { display: horizontal }
    }
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#11131c',
      borderColor: 'rgba(255,255,255,0.12)',
      borderWidth: 1
    }
  }
});

export const DashboardBarChart = ({ data = [], label = 'Count', horizontal = false, emptyMessage = 'No data yet' }) => {
  if (!data.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-white/[0.15] text-sm text-slate-400">
        {emptyMessage}
      </div>
    );
  }

  const chartData = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        label,
        data: data.map((item) => item.value),
        backgroundColor: data.map((_, index) => `${palette[index % palette.length]}99`),
        borderColor: data.map((_, index) => palette[index % palette.length]),
        borderWidth: 1,
        borderRadius: 6
      }
    ]
  };

  return (
    <div className="h-64">
      <Bar data={chartData} options={chartOptions(horizontal)} />
    </div>
  );
};

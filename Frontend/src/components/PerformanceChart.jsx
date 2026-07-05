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
import { formatDate } from '../utils/formatters.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export const PerformanceChart = ({ interviews = [] }) => {
  const completed = interviews
    .filter((item) => Number(item.finalReport?.overallScore || item.overallScore || 0) > 0)
    .slice()
    .reverse()
    .slice(-8);

  const data = {
    labels: completed.map((item) => formatDate(item.createdAt)),
    datasets: [
      {
        label: 'Score',
        data: completed.map((item) => item.finalReport?.overallScore || item.overallScore || 0),
        borderColor: '#60a5fa',
        backgroundColor: 'rgba(96, 165, 250, 0.16)',
        tension: 0.38,
        fill: true,
        pointBackgroundColor: '#34d399',
        pointBorderColor: '#08090f',
        pointBorderWidth: 2
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        min: 0,
        max: 10,
        ticks: { color: '#94a3b8' },
        grid: { color: 'rgba(148, 163, 184, 0.12)' }
      },
      x: {
        ticks: { color: '#94a3b8' },
        grid: { display: false }
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
  };

  if (!completed.length) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-white/[0.15] text-sm text-slate-400">
        No scored interviews yet
      </div>
    );
  }

  return (
    <div className="h-72">
      <Line data={data} options={options} />
    </div>
  );
};

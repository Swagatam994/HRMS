import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const palette = ['#34d399', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa', '#22d3ee'];

export const DashboardDoughnutChart = ({ data = [], emptyMessage = 'No data yet' }) => {
  if (!data.length || data.every((item) => !item.value)) {
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
        data: data.map((item) => item.value),
        backgroundColor: data.map((_, index) => `${palette[index % palette.length]}cc`),
        borderColor: '#08090f',
        borderWidth: 2,
        hoverOffset: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', boxWidth: 12, padding: 16 }
      },
      tooltip: {
        backgroundColor: '#11131c',
        borderColor: 'rgba(255,255,255,0.12)',
        borderWidth: 1
      }
    }
  };

  return (
    <div className="h-64">
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

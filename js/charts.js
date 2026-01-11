/**
 * Chart Configuration and Utilities
 * Using Chart.js for beautiful statistics visualization
 */

// Chart.js default configuration for our app
const defaultConfig = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    intersect: false,
    mode: 'index'
  },
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(30, 30, 53, 0.95)',
      titleColor: '#fff',
      bodyColor: '#a0a0b8',
      borderColor: 'rgba(255, 255, 255, 0.1)',
      borderWidth: 1,
      cornerRadius: 8,
      padding: 12,
      displayColors: false
    }
  }
};

// Get CSS variable value
function getCSSVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

// Get theme-aware colors
function getChartColors() {
  return {
    primary: getCSSVar('--primary') || '#6c5ce7',
    primaryLight: getCSSVar('--primary-light') || '#a29bfe',
    accent: getCSSVar('--accent') || '#00cec9',
    success: getCSSVar('--success') || '#00b894',
    textMuted: getCSSVar('--text-muted') || '#6b6b80',
    bgTertiary: getCSSVar('--bg-tertiary') || '#252542',
    borderColor: getCSSVar('--border-color') || 'rgba(255, 255, 255, 0.08)'
  };
}

/**
 * Create a line chart for habit score over time
 */
export function createScoreChart(ctx, data, habitColor = null) {
  const colors = getChartColors();
  const lineColor = habitColor || colors.primary;
  
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels: data.map(d => formatChartDate(d.date)),
      datasets: [{
        data: data.map(d => Math.round(d.score * 100)),
        borderColor: lineColor,
        backgroundColor: createGradient(ctx, lineColor),
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHoverBackgroundColor: lineColor,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        borderWidth: 3
      }]
    },
    options: {
      ...defaultConfig,
      scales: {
        x: {
          display: true,
          grid: {
            display: false
          },
          ticks: {
            color: colors.textMuted,
            font: { size: 10 },
            maxTicksLimit: 7
          }
        },
        y: {
          display: true,
          min: 0,
          max: 100,
          grid: {
            color: colors.borderColor
          },
          ticks: {
            color: colors.textMuted,
            font: { size: 10 },
            callback: (value) => `${value}%`,
            stepSize: 25
          }
        }
      },
      plugins: {
        ...defaultConfig.plugins,
        tooltip: {
          ...defaultConfig.plugins.tooltip,
          callbacks: {
            title: (items) => items[0]?.label || '',
            label: (item) => `Strength: ${item.raw}%`
          }
        }
      }
    }
  });
}

/**
 * Create a bar chart for daily completions
 */
export function createDailyChart(ctx, data) {
  const colors = getChartColors();
  
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => formatChartDate(d.date)),
      datasets: [{
        data: data.map(d => d.completed),
        backgroundColor: data.map(d => 
          d.completed > 0 ? colors.success : colors.bgTertiary
        ),
        borderRadius: 4,
        borderSkipped: false
      }]
    },
    options: {
      ...defaultConfig,
      scales: {
        x: {
          display: true,
          grid: { display: false },
          ticks: {
            color: colors.textMuted,
            font: { size: 10 },
            maxTicksLimit: 10
          }
        },
        y: {
          display: true,
          beginAtZero: true,
          grid: { color: colors.borderColor },
          ticks: {
            color: colors.textMuted,
            font: { size: 10 },
            stepSize: 1
          }
        }
      },
      plugins: {
        ...defaultConfig.plugins,
        tooltip: {
          ...defaultConfig.plugins.tooltip,
          callbacks: {
            title: (items) => items[0]?.label || '',
            label: (item) => `Completed: ${item.raw} habits`
          }
        }
      }
    }
  });
}

/**
 * Create a weekly bar chart
 */
export function createWeeklyChart(ctx, data) {
  const colors = getChartColors();
  
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      datasets: [{
        data: data,
        backgroundColor: colors.primaryLight,
        borderRadius: 6,
        borderSkipped: false
      }]
    },
    options: {
      ...defaultConfig,
      scales: {
        x: {
          display: true,
          grid: { display: false },
          ticks: {
            color: colors.textMuted,
            font: { size: 11, weight: '500' }
          }
        },
        y: {
          display: true,
          beginAtZero: true,
          grid: { color: colors.borderColor },
          ticks: {
            color: colors.textMuted,
            font: { size: 10 },
            stepSize: 1
          }
        }
      },
      plugins: {
        ...defaultConfig.plugins,
        tooltip: {
          ...defaultConfig.plugins.tooltip,
          callbacks: {
            label: (item) => `${item.raw} completions`
          }
        }
      }
    }
  });
}

/**
 * Create a monthly completion chart
 */
export function createMonthlyChart(ctx, data, totalHabits) {
  const colors = getChartColors();
  
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.map(d => d.day),
      datasets: [{
        data: data.map(d => d.completed),
        backgroundColor: data.map(d => {
          const rate = totalHabits > 0 ? d.completed / totalHabits : 0;
          if (rate >= 0.8) return colors.success;
          if (rate >= 0.5) return colors.primaryLight;
          if (rate > 0) return colors.primary;
          return colors.bgTertiary;
        }),
        borderRadius: 2,
        borderSkipped: false
      }]
    },
    options: {
      ...defaultConfig,
      scales: {
        x: {
          display: true,
          grid: { display: false },
          ticks: {
            color: colors.textMuted,
            font: { size: 9 },
            maxTicksLimit: 15,
            callback: function(value, index) {
              return index % 5 === 0 ? this.getLabelForValue(value) : '';
            }
          }
        },
        y: {
          display: true,
          beginAtZero: true,
          max: totalHabits || undefined,
          grid: { color: colors.borderColor },
          ticks: {
            color: colors.textMuted,
            font: { size: 10 },
            stepSize: 1
          }
        }
      },
      plugins: {
        ...defaultConfig.plugins,
        tooltip: {
          ...defaultConfig.plugins.tooltip,
          callbacks: {
            title: (items) => `Day ${items[0]?.label}`,
            label: (item) => {
              const rate = totalHabits > 0 
                ? Math.round((item.raw / totalHabits) * 100) 
                : 0;
              return `${item.raw}/${totalHabits} habits (${rate}%)`;
            }
          }
        }
      }
    }
  });
}

/**
 * Create gradient for area charts
 */
function createGradient(ctx, color) {
  const canvas = ctx.canvas;
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, hexToRgba(color, 0.3));
  gradient.addColorStop(1, hexToRgba(color, 0));
  return gradient;
}

/**
 * Convert hex color to rgba
 */
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Format date for chart labels
 */
function formatChartDate(dateStr) {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

/**
 * Update chart data
 */
export function updateChartData(chart, newData, datasetIndex = 0) {
  if (!chart) return;
  
  chart.data.labels = newData.labels || chart.data.labels;
  chart.data.datasets[datasetIndex].data = newData.data;
  
  if (newData.backgroundColor) {
    chart.data.datasets[datasetIndex].backgroundColor = newData.backgroundColor;
  }
  
  chart.update('none');
}

/**
 * Destroy chart safely
 */
export function destroyChart(chart) {
  if (chart) {
    chart.destroy();
  }
}

/**
 * Generate data for the last N days
 */
export function generateDailyData(completionsMap, days = 30) {
  const data = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = formatDateYMD(date);
    
    data.push({
      date: dateStr,
      day: date.getDate(),
      completed: completionsMap[dateStr] || 0
    });
  }
  
  return data;
}

/**
 * Generate weekly aggregation data
 */
export function generateWeeklyData(completions) {
  const weeklyData = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
  
  completions.forEach(completion => {
    const date = new Date(completion.date);
    const dayOfWeek = date.getDay();
    weeklyData[dayOfWeek]++;
  });
  
  return weeklyData;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDateYMD(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Export utilities
export { hexToRgba, formatChartDate, getChartColors };

// Charts.js - Handles all chart rendering for HealthWatch

class DashboardCharts {
    constructor() {
        this.charts = {};
        this.init();
    }

    async init() {
        try {
            const data = await this.fetchData();
            this.renderAllCharts(data);
            this.updateSummaryCards(data);
        } catch (error) {
            console.error('Error initializing charts:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    async fetchData() {
        const response = await fetch('/get-data');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    }

    renderAllCharts(data) {
        this.renderLineChart(data.time_series);
        this.renderBarChart(data.region_data);
        this.renderPieChart(data.summary);
    }

    renderLineChart(timeSeriesData) {
        const ctx = document.getElementById('lineChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.charts.line) {
            this.charts.line.destroy();
        }

        const dates = timeSeriesData.map(d => new Date(d.date).toLocaleDateString());
        const cases = timeSeriesData.map(d => d.cases);

        this.charts.line = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Daily Cases',
                    data: cases,
                    borderColor: '#3498db',
                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                    borderWidth: 3,
                    pointBackgroundColor: '#2c3e50',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                return `Cases: ${context.raw.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    axis: 'x',
                    intersect: false
                }
            }
        });
    }

    renderBarChart(regionData) {
        const ctx = document.getElementById('barChart').getContext('2d');
        
        if (this.charts.bar) {
            this.charts.bar.destroy();
        }

        const regions = regionData.map(d => d.region);
        const totalCases = regionData.map(d => d.total_cases);
        const deaths = regionData.map(d => d.total_deaths);

        this.charts.bar = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: regions,
                datasets: [
                    {
                        label: 'Total Cases',
                        data: totalCases,
                        backgroundColor: 'rgba(52, 152, 219, 0.7)',
                        borderColor: '#2980b9',
                        borderWidth: 1,
                        borderRadius: 5
                    },
                    {
                        label: 'Deaths',
                        data: deaths,
                        backgroundColor: 'rgba(231, 76, 60, 0.7)',
                        borderColor: '#c0392b',
                        borderWidth: 1,
                        borderRadius: 5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.raw.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    renderPieChart(summary) {
        const ctx = document.getElementById('pieChart').getContext('2d');
        
        if (this.charts.pie) {
            this.charts.pie.destroy();
        }

        const total = summary.total_cases || 0;
        const recovered = summary.total_recoveries || 0;
        const active = summary.active_cases || 0;
        const deaths = summary.total_deaths || 0;

        this.charts.pie = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Active Cases', 'Recovered', 'Deaths'],
                datasets: [{
                    data: [active, recovered, deaths],
                    backgroundColor: [
                        '#f39c12',
                        '#27ae60',
                        '#e74c3c'
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 2,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${context.label}: ${value.toLocaleString()} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    updateSummaryCards(summary) {
        // Update summary cards with animation
        this.animateNumber('total-cases', summary.total_cases || 0);
        this.animateNumber('active-cases', summary.active_cases || 0);
        this.animateNumber('total-deaths', summary.total_deaths || 0);
        
        // Update risk level based on data
        this.updateRiskLevel(summary);
    }

    animateNumber(elementId, finalNumber) {
        const element = document.getElementById(elementId);
        if (!element) return;

        const startNumber = parseInt(element.textContent.replace(/,/g, '')) || 0;
        const duration = 1000;
        const startTime = performance.now();

        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            
            const currentNumber = Math.floor(startNumber + (finalNumber - startNumber) * easeOutQuart);
            element.textContent = currentNumber.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }

    updateRiskLevel(summary) {
        const riskElement = document.getElementById('risk-level');
        if (!riskElement) return;

        // Determine risk level based on active cases
        const activeCases = summary.active_cases || 0;
        let riskLevel = 'Low';
        let riskClass = 'low';

        if (activeCases > 1000) {
            riskLevel = 'High';
            riskClass = 'high';
        } else if (activeCases > 500) {
            riskLevel = 'Moderate';
            riskClass = 'moderate';
        }

        riskElement.textContent = riskLevel;
        riskElement.className = `risk-badge ${riskClass}`;
    }

    showError(message) {
        // Display error message to user
        const dashboard = document.querySelector('.dashboard');
        if (dashboard) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.style.cssText = `
                background: #f8d7da;
                color: #721c24;
                padding: 1rem;
                border-radius: 5px;
                margin-bottom: 1rem;
                text-align: center;
            `;
            errorDiv.textContent = message;
            dashboard.prepend(errorDiv);

            // Auto remove after 5 seconds
            setTimeout(() => errorDiv.remove(), 5000);
        }
    }
}

// Initialize charts when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboardCharts = new DashboardCharts();
});

// Auto-refresh data every 5 minutes
setInterval(() => {
    if (window.dashboardCharts) {
        window.dashboardCharts.init();
    }
}, 300000);
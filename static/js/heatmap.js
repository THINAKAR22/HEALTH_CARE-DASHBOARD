// Heatmap.js - Handles region-based risk visualization

class RiskHeatmap {
    constructor() {
        this.regions = [
            { name: 'North', districts: ['Delhi', 'Chandigarh', 'Lucknow', 'Jaipur'] },
            { name: 'South', districts: ['Bangalore', 'Chennai', 'Hyderabad', 'Kochi'] },
            { name: 'East', districts: ['Kolkata', 'Patna', 'Bhubaneswar', 'Guwahati'] },
            { name: 'West', districts: ['Mumbai', 'Pune', 'Ahmedabad', 'Goa'] },
            { name: 'Central', districts: ['Bhopal', 'Raipur', 'Nagpur', 'Indore'] }
        ];
        
        this.init();
    }

    async init() {
        try {
            const data = await this.fetchRegionData();
            this.renderHeatmap(data);
            this.setupAutoRefresh();
        } catch (error) {
            console.error('Error initializing heatmap:', error);
            this.showFallbackHeatmap();
        }
    }

    async fetchRegionData() {
        const response = await fetch('/get-data');
        if (!response.ok) {
            throw new Error('Failed to fetch region data');
        }
        const data = await response.json();
        return data.region_data || [];
    }

    renderHeatmap(regionData) {
        const container = document.getElementById('heatmap-container');
        if (!container) return;

        // Create region grid
        const regionGrid = document.createElement('div');
        regionGrid.className = 'region-list';

        // Process each region
        this.regions.forEach(region => {
            const regionInfo = regionData.find(r => r.region === region.name) || {
                total_cases: 0,
                avg_cases: 0,
                peak_cases: 0
            };

            const riskLevel = this.calculateRiskLevel(regionInfo.total_cases);
            
            const regionCard = document.createElement('div');
            regionCard.className = `region-item ${riskLevel.class}`;
            regionCard.innerHTML = `
                <h4>${region.name}</h4>
                <div class="region-stats">
                    <div class="stat">
                        <span class="stat-label">Cases:</span>
                        <span class="stat-value">${regionInfo.total_cases.toLocaleString()}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Peak:</span>
                        <span class="stat-value">${regionInfo.peak_cases.toLocaleString()}</span>
                    </div>
                </div>
                <div class="risk-indicator ${riskLevel.class}">
                    <span class="risk-dot"></span>
                    ${riskLevel.text} Risk
                </div>
            `;

            // Add click handler for district view
            regionCard.addEventListener('click', () => this.showDistrictDetails(region));
            regionGrid.appendChild(regionCard);
        });

        // Clear and append new grid
        container.innerHTML = '';
        container.appendChild(regionGrid);

        // Add legend
        this.addLegend(container);
    }

    calculateRiskLevel(cases) {
        if (cases > 1000) {
            return { class: 'high', text: 'High' };
        } else if (cases > 500) {
            return { class: 'moderate', text: 'Moderate' };
        } else {
            return { class: 'low', text: 'Low' };
        }
    }

    showDistrictDetails(region) {
        // Create modal for district details
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        const modalContent = document.createElement('div');
        modalContent.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 15px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
        `;

        modalContent.innerHTML = `
            <h3 style="margin-bottom: 1.5rem; color: var(--primary-blue);">
                ${region.name} Region - District Details
            </h3>
            <div class="district-list" style="display: grid; gap: 1rem;">
                ${region.districts.map(district => `
                    <div class="district-item" style="
                        padding: 1rem;
                        background: #f8f9fa;
                        border-radius: 8px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    ">
                        <span style="font-weight: 500;">${district}</span>
                        <span class="risk-badge low">Loading...</span>
                    </div>
                `).join('')}
            </div>
            <button onclick="this.closest('.modal').remove()" style="
                margin-top: 1.5rem;
                padding: 0.75rem 1.5rem;
                background: var(--primary-blue);
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                width: 100%;
            ">Close</button>
        `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Simulate loading district data
        setTimeout(() => {
            const districts = modalContent.querySelectorAll('.district-item .risk-badge');
            districts.forEach(badge => {
                const randomRisk = Math.random();
                if (randomRisk > 0.7) {
                    badge.className = 'risk-badge high';
                    badge.textContent = 'High Risk';
                } else if (randomRisk > 0.3) {
                    badge.className = 'risk-badge moderate';
                    badge.textContent = 'Moderate Risk';
                } else {
                    badge.className = 'risk-badge low';
                    badge.textContent = 'Low Risk';
                }
            });
        }, 500);
    }

    addLegend(container) {
        const legend = document.createElement('div');
        legend.className = 'heatmap-legend';
        legend.style.cssText = `
            display: flex;
            justify-content: center;
            gap: 2rem;
            margin-top: 2rem;
            padding: 1rem;
            background: #f8f9fa;
            border-radius: 8px;
        `;

        const legendItems = [
            { class: 'low', text: 'Low Risk (<500 cases)' },
            { class: 'moderate', text: 'Moderate Risk (500-1000 cases)' },
            { class: 'high', text: 'High Risk (>1000 cases)' }
        ];

        legend.innerHTML = legendItems.map(item => `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="
                    display: inline-block;
                    width: 20px;
                    height: 20px;
                    border-radius: 4px;
                    background: ${item.class === 'low' ? '#d4edda' : item.class === 'moderate' ? '#fff3cd' : '#f8d7da'};
                "></span>
                <span style="color: #666;">${item.text}</span>
            </div>
        `).join('');

        container.appendChild(legend);
    }

    showFallbackHeatmap() {
        // Show a simple table-based heatmap if data fetch fails
        const container = document.getElementById('heatmap-container');
        if (!container) return;

        const fallbackHtml = `
            <div class="fallback-heatmap" style="
                background: #f8f9fa;
                border-radius: 10px;
                padding: 2rem;
                text-align: center;
            ">
                <p style="color: #666; margin-bottom: 1rem;">
                    ⚠️ Using sample data for demonstration
                </p>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: var(--primary-blue); color: white;">
                            <th style="padding: 0.75rem;">Region</th>
                            <th style="padding: 0.75rem;">Cases</th>
                            <th style="padding: 0.75rem;">Risk Level</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid #dee2e6;">
                            <td style="padding: 0.75rem;">North</td>
                            <td style="padding: 0.75rem;">885</td>
                            <td style="padding: 0.75rem;"><span class="risk-badge moderate">Moderate</span></td>
                        </tr>
                        <tr style="border-bottom: 1px solid #dee2e6;">
                            <td style="padding: 0.75rem;">South</td>
                            <td style="padding: 0.75rem;">475</td>
                            <td style="padding: 0.75rem;"><span class="risk-badge low">Low</span></td>
                        </tr>
                        <tr style="border-bottom: 1px solid #dee2e6;">
                            <td style="padding: 0.75rem;">East</td>
                            <td style="padding: 0.75rem;">1170</td>
                            <td style="padding: 0.75rem;"><span class="risk-badge high">High</span></td>
                        </tr>
                        <tr>
                            <td style="padding: 0.75rem;">West</td>
                            <td style="padding: 0.75rem;">1710</td>
                            <td style="padding: 0.75rem;"><span class="risk-badge high">High</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = fallbackHtml;
    }

    setupAutoRefresh() {
        // Refresh heatmap data every 5 minutes
        setInterval(() => {
            this.init();
        }, 300000);
    }
}

// Initialize heatmap when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.riskHeatmap = new RiskHeatmap();
});

// Add risk prediction functionality
async function predictRisk() {
    const region = document.getElementById('predict-region').value;
    const cases = document.getElementById('predict-cases').value;
    const prevCases = document.getElementById('predict-prev-cases').value;

    if (!region || !cases) {
        alert('Please fill in all required fields');
        return;
    }

    try {
        const response = await fetch('/predict-risk', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                region: region,
                cases: parseInt(cases),
                prev_cases: prevCases ? parseInt(prevCases) : null
            })
        });

        const result = await response.json();
        displayPredictionResult(result);
    } catch (error) {
        console.error('Prediction error:', error);
        alert('Failed to get prediction. Using rule-based estimation.');

        // Fallback to rule-based
        const result = {
            risk_level: cases > 1000 ? 'High' : cases > 500 ? 'Moderate' : 'Low',
            confidence: 85,
            cases: parseInt(cases),
            growth_rate: prevCases ? ((cases - prevCases) / prevCases * 100).toFixed(2) : 0
        };
        displayPredictionResult(result);
    }
}

function displayPredictionResult(result) {
    const resultDiv = document.getElementById('prediction-result');
    if (!resultDiv) return;

    const riskClass = result.risk_level.toLowerCase();
    
    resultDiv.innerHTML = `
        <div class="prediction-result" style="animation: fadeIn 0.5s ease;">
            <h4 style="color: #666; margin-bottom: 1rem;">Prediction Result</h4>
            <div class="risk-badge ${riskClass}" style="font-size: 1.5rem; padding: 1rem 2rem;">
                ${result.risk_level} Risk
            </div>
            <div style="margin-top: 1.5rem; display: grid; gap: 1rem;">
                <div style="display: flex; justify-content: space-between;">
                    <span>Confidence:</span>
                    <strong>${result.confidence}%</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Current Cases:</span>
                    <strong>${result.cases.toLocaleString()}</strong>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Growth Rate:</span>
                    <strong style="color: ${result.growth_rate > 0 ? '#e74c3c' : '#27ae60'};">
                        ${result.growth_rate > 0 ? '+' : ''}${result.growth_rate}%
                    </strong>
                </div>
            </div>
        </div>
    `;
}
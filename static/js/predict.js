fetch("/predict-risk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        region: "North",
        cases: 1200,
        prev_cases: 600,
        population: 200000
    })
})
.then(res => res.json())
.then(data => {
    document.getElementById("riskLevel").innerText = data.risk_level;
    document.getElementById("riskLevel").style.color = data.color;
    document.getElementById("confidence").innerText = data.confidence + "%";
});
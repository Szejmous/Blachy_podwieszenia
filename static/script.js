let uniformChart, pointChart;

document.addEventListener("DOMContentLoaded", function () {
    let forcesDiv = document.getElementById("forces-inputs");
    for (let i = 1; i <= 6; i++) {
        forcesDiv.innerHTML += `
            <div>
                <label>P${i} (kg): <input id="P${i}" type="number" value="0"></label>
                <label>x${i} (m): <input id="x${i}" type="number" value="0"></label>
            </div>
        `;
    }
});

async function calculate() {
    let data = {
        load_kg_m2: document.getElementById("load_kg_m2").value,
        spacing_mm: document.getElementById("spacing_mm").value
    };

    for (let i = 1; i <= 6; i++) {
        data[`P${i}`] = document.getElementById(`P${i}`).value || "0";
        data[`x${i}`] = document.getElementById(`x${i}`).value || "0";
    }

    let response = await fetch("/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    let result = await response.json();
    document.getElementById("result").innerText = result.status;

    drawBeams(result);
    drawCharts(result);
}

function drawBeams(result) {
    // Belka - obciążenie równomierne
    let uniformCtx = document.getElementById("uniformBeam").getContext("2d");
    uniformCtx.clearRect(0, 0, 600, 100);
    uniformCtx.beginPath();
    uniformCtx.moveTo(0, 50); // Podpora lewa
    uniformCtx.lineTo(600, 50); // Belka
    uniformCtx.moveTo(0, 50);
    uniformCtx.lineTo(10, 70); // Podpora lewa
    uniformCtx.moveTo(600, 50);
    uniformCtx.lineTo(590, 70); // Podpora prawa
    uniformCtx.stroke();
    uniformCtx.fillText(`q = ${result.load_kg_m.toFixed(2)} kg/m`, 280, 20);

    // Belka - obciążenia punktowe
    let pointCtx = document.getElementById("pointBeam").getContext("2d");
    pointCtx.clearRect(0, 0, 600, 100);
    pointCtx.beginPath();
    pointCtx.moveTo(0, 50); // Podpora lewa
    pointCtx.lineTo(600, 50); // Belka
    pointCtx.moveTo(0, 50);
    pointCtx.lineTo(10, 70); // Podpora lewa
    pointCtx.moveTo(600, 50);
    pointCtx.lineTo(590, 70); // Podpora prawa

    let L = result.L;
    for (let i = 0; i < result.forces.length; i++) {
        let x = (result.distances[i] / L) * 600;
        pointCtx.moveTo(x, 50);
        pointCtx.lineTo(x, 30); // Strzałka w dół
        pointCtx.fillText(`P${i + 1} = ${result.forces[i]} kg`, x - 20, 20);
    }
    pointCtx.stroke();
}

function drawCharts(result) {
    let L = result.L;
    let labels = ["0", "L/4", "L/2", "3L/4", "L"];

    // Wykres momentów - obciążenie równomierne
    if (uniformChart) uniformChart.destroy();
    uniformChart = new Chart(document.getElementById("uniformMomentChart").getContext("2d"), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: "Moment od obciążenia równomiernego",
                data: result.uniform_moment,
                borderColor: "blue",
                fill: false
            }]
        },
        options: { scales: { y: { beginAtZero: true } } }
    });

    // Wykres momentów - obciążenia punktowe
    if (pointChart) pointChart.destroy();
    let pointMoments = [0, ...result.moment_values, 0];
    pointChart = new Chart(document.getElementById("pointMomentChart").getContext("2d"), {
        type: 'line',
        data: {
            labels: ["0", ...result.distances.map((d, i) => `x${i + 1}`), "L"],
            datasets: [{
                label: "Moment od sił punktowych",
                data: pointMoments,
                borderColor: "red",
                fill: false
            }]
        },
        options: { scales: { y: { beginAtZero: true } } }
    });
}

let uniformChart, pointChart;

// Baza blach w JavaScript (dla dynamicznego wypełniania listy)
const BLACHY = {
    "Pruszyński": ["T130", "T135", "T135P", "T140", "T150", "T155", "T160"],
    "ArcelorMittal": ["Hacierco 136/337", "Hacierco 135/315", "Hacierco 150/290"],
    "BP2": ["T130", "T135-930", "T135-950", "T153-860", "T160"]
};

document.addEventListener("DOMContentLoaded", function () {
    let forcesDiv = document.getElementById("forces-inputs");
    for (let i = 1; i <= 6; i++) {
        forcesDiv.innerHTML += `
            <div>
                <label class="force-label">P${i} (kg): <input id="P${i}" type="number" value="0"></label>
                <label class="distance-label">x${i} (m): <input id="x${i}" type="number" value="0"></label>
            </div>
        `;
    }
    updateBlachy(); // Wypełnij początkowo listę blach
});

function updateBlachy() {
    let producent = document.getElementById("producent").value;
    let blachaSelect = document.getElementById("blacha");
    blachaSelect.innerHTML = ""; // Wyczyść aktualne opcje
    BLACHY[producent].forEach(blacha => {
        let option = document.createElement("option");
        option.value = blacha;
        option.text = blacha;
        blachaSelect.appendChild(option);
    });
}

async function calculate() {
    let data = {
        load_kg_m2: document.getElementById("load_kg_m2").value,
        producent: document.getElementById("producent").value,
        blacha: document.getElementById("blacha").value,
        beam_span: document.getElementById("beam_span").value
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
    const canvasWidth = 300;
    const canvasHeight = 50;

    // Belka - obciążenie równomierne
    let uniformCtx = document.getElementById("uniformBeam").getContext("2d");
    uniformCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    uniformCtx.beginPath();
    uniformCtx.strokeStyle = "black";
    uniformCtx.moveTo(10, 25); // Belka
    uniformCtx.lineTo(canvasWidth - 10, 25);
    uniformCtx.moveTo(10, 25); // Podpora lewa (trójkąt)
    uniformCtx.lineTo(20, 45);
    uniformCtx.lineTo(0, 45);
    uniformCtx.closePath();
    uniformCtx.moveTo(canvasWidth - 10, 25); // Podpora prawa (rolka)
    uniformCtx.lineTo(canvasWidth - 20, 45);
    uniformCtx.lineTo(canvasWidth, 45);
    uniformCtx.stroke();
    uniformCtx.fillStyle = "black";
    uniformCtx.fillText(`q = ${result.load_kg_m.toFixed(2)} kg/m (rozstaw: ${result.spacing_mm.toFixed(2)} mm)`, canvasWidth / 2 - 60, 10);

    // Wymiar całkowity z znakami architektonicznymi
    uniformCtx.beginPath();
    uniformCtx.moveTo(10, 45);
    uniformCtx.lineTo(canvasWidth - 10, 45);
    uniformCtx.moveTo(10, 40); uniformCtx.lineTo(15, 45); uniformCtx.lineTo(10, 50); // Lewy znak
    uniformCtx.moveTo(canvasWidth - 10, 40); uniformCtx.lineTo(canvasWidth - 15, 45); uniformCtx.lineTo(canvasWidth - 10, 50); // Prawy znak
    uniformCtx.stroke();
    uniformCtx.fillText(`${result.L} m`, canvasWidth / 2 - 10, 40);

    // Belka - obciążenia punktowe
    let pointCtx = document.getElementById("pointBeam").getContext("2d");
    pointCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    pointCtx.beginPath();
    pointCtx.strokeStyle = "black";
    pointCtx.moveTo(10, 25); // Belka
    pointCtx.lineTo(canvasWidth - 10, 25);
    pointCtx.moveTo(10, 25); // Podpora lewa (trójkąt)
    pointCtx.lineTo(20, 45);
    pointCtx.lineTo(0, 45);
    pointCtx.closePath();
    pointCtx.moveTo(canvasWidth - 10, 25); // Podpora prawa (rolka)
    pointCtx.lineTo(canvasWidth - 20, 45);
    pointCtx.lineTo(canvasWidth, 45);

    let L = result.L;
    for (let i = 0; i < result.forces.length; i++) {
        let x = 10 + (result.distances[i] / L) * (canvasWidth - 20);
        pointCtx.strokeStyle = "blue"; // Kolor sił
        pointCtx.beginPath();
        pointCtx.moveTo(x, 25);
        pointCtx.lineTo(x, 15); // Strzałka w dół
        pointCtx.lineTo(x - 5, 20); pointCtx.moveTo(x, 15); pointCtx.lineTo(x + 5, 20);
        pointCtx.stroke();
        pointCtx.fillStyle = "blue";
        pointCtx.fillText(`P${i + 1} = ${result.forces[i]} kg`, x - 20, 10);
    }

    // Wymiary z domiarami i znakami architektonicznymi
    pointCtx.strokeStyle = "green"; // Kolor odległości
    pointCtx.fillStyle = "green";
    pointCtx.beginPath();
    let prevX = 10;
    for (let i = 0; i < result.distances.length; i++) {
        let x = 10 + (result.distances[i] / L) * (canvasWidth - 20);
        pointCtx.moveTo(prevX, 45);
        pointCtx.lineTo(x, 45);
        pointCtx.moveTo(prevX, 40); pointCtx.lineTo(prevX + 5, 45); pointCtx.lineTo(prevX, 50); // Znak początkowy
        pointCtx.moveTo(x, 40); pointCtx.lineTo(x - 5, 45); pointCtx.lineTo(x, 50); // Znak końcowy
        pointCtx.fillText(`${(result.distances[i] - (i > 0 ? result.distances[i - 1] : 0)).toFixed(2)} m`, (prevX + x) / 2 - 10, 40);
        prevX = x;
    }
    pointCtx.moveTo(prevX, 45);
    pointCtx.lineTo(canvasWidth - 10, 45);
    pointCtx.moveTo(prevX, 40); pointCtx.lineTo(prevX + 5, 45); pointCtx.lineTo(prevX, 50);
    pointCtx.moveTo(canvasWidth - 10, 40); pointCtx.lineTo(canvasWidth - 15, 45); pointCtx.lineTo(canvasWidth - 10, 50);
    pointCtx.fillText(`${(L - (result.distances.length > 0 ? result.distances[result.distances.length - 1] : 0)).toFixed(2)} m`, (prevX + canvasWidth - 10) / 2 - 10, 40);
    pointCtx.stroke();
}

function drawCharts(result) {
    let L = result.L;

    // Wykres momentów - obciążenie równomierne
    if (uniformChart) uniformChart.destroy();
    uniformChart = new Chart(document.getElementById("uniformMomentChart").getContext("2d"), {
        type: 'line',
        data: {
            labels: result.x_values.map(x => x.toFixed(2)),
            datasets: [{
                label: "Moment od obciążenia równomiernego",
                data: result.uniform_moment,
                borderColor: "blue",
                fill: false
            }]
        },
        options: {
            scales: { y: { beginAtZero: true } },
            plugins: {
                annotation: {
                    annotations: [{
                        type: 'label',
                        xValue: (L / 2).toFixed(2), // Maksimum w połowie belki
                        yValue: result.max_moment_uniform,
                        content: `${result.max_moment_uniform.toFixed(2)} kg·m`,
                        color: 'blue',
                        position: 'top',
                        yAdjust: -10
                    }, {
                        type: 'line',
                        yMin: result.max_moment_uniform,
                        yMax: result.max_moment_uniform,
                        borderColor: 'green',
                        borderWidth: 1,
                        label: { content: `Max: ${result.max_moment_uniform.toFixed(2)} kg·m`, enabled: true }
                    }]
                }
            }
        }
    });

    // Wykres momentów - obciążenia punktowe
    if (pointChart) pointChart.destroy();
    pointChart = new Chart(document.getElementById("pointMomentChart").getContext("2d"), {
        type: 'line',
        data: {
            labels: result.point_moment_x.map(x => x.toFixed(2)),
            datasets: [{
                label: "Moment od sił punktowych",
                data: result.point_moment_values,
                borderColor: "red",
                fill: false
            }]
        },
        options: {
            scales: { y: { beginAtZero: true } },
            plugins: {
                annotation: {
                    annotations: result.moment_values.map((m, i) => ({
                        type: 'label',
                        xValue: result.point_moment_x[i + 1].toFixed(2),
                        yValue: m,
                        content: `${m.toFixed(2)} kg·m`,
                        color: 'blue',
                        position: 'top',
                        yAdjust: -10
                    })).concat({
                        type: 'line',
                        yMin: result.max_moment_forces,
                        yMax: result.max_moment_forces,
                        borderColor: 'green',
                        borderWidth: 1,
                        label: { content: `Max: ${result.max_moment_forces.toFixed(2)} kg·m`, enabled: true }
                    })
                }
            }
        }
    });
}

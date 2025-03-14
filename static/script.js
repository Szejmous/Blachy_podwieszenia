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
                <label class="force-label">P${i} (kg): <input id="P${i}" type="number" value="0" onchange="calculate()" oninput="calculate()"></label>
                <label class="distance-label">x${i} (m): <input id="x${i}" type="number" value="0" onchange="calculate()" oninput="calculate()"></label>
            </div>
        `;
    }
    updateBlachy(); // Wypełnij początkowo listę blach
    calculate(); // Wykonaj obliczenia przy załadowaniu strony
});

function updateBlachy() {
    let producent = document.getElementById("producent").value;
    let blachaSelect = document.getElementById("blacha");
    blachaSelect.innerHTML = ""; // Wyczyść aktualne opcje
    BLACHY[producent].forEach(blacha => {
        let option = document.createElement("option");
        option.value = blacha;
        option.text = blacha;
        if (producent === "Pruszyński" && blacha === "T130") option.selected = true;
        blachaSelect.appendChild(option);
    });
    calculate(); // Wykonaj obliczenia po zmianie blachy
}

async function calculate() {
    let data = {
        load_kg_m2: document.getElementById("load_kg_m2").value || "0",
        producent: document.getElementById("producent").value,
        blacha: document.getElementById("blacha").value,
        beam_span: document.getElementById("beam_span").value || "1"
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
    let resultSpan = document.getElementById("result");
    resultSpan.innerText = result.status;
    resultSpan.style.color = result.status.includes("Poprawne") ? "green" : "red";

    drawBeams(result);
    drawCharts(result);
}

function drawBeams(result) {
    const canvasWidth = 600; // Stała szerokość canvasu
    const canvasHeight = 100; // Stała wysokość dla belek
    const beamHeight = 20; // Stała wysokość belki
    const supportWidth = 20; // Stała szerokość podpór

    // Ustawienie wymiarów canvasu
    const uniformBeamCanvas = document.getElementById("uniformBeam");
    const pointBeamCanvas = document.getElementById("pointBeam");
    uniformBeamCanvas.width = canvasWidth;
    uniformBeamCanvas.height = canvasHeight;
    pointBeamCanvas.width = canvasWidth;
    pointBeamCanvas.height = canvasHeight;

    // Belka - obciążenie równomierne
    let uniformCtx = uniformBeamCanvas.getContext("2d");
    uniformCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    uniformCtx.beginPath();
    uniformCtx.strokeStyle = "black";
    uniformCtx.lineWidth = 2;
    uniformCtx.moveTo(supportWidth, canvasHeight / 2); // Belka
    uniformCtx.lineTo(canvasWidth - supportWidth, canvasHeight / 2);
    uniformCtx.moveTo(supportWidth - 10, canvasHeight / 2 - beamHeight); // Podpora lewa (trójkąt, wierzchołek na górze)
    uniformCtx.lineTo(supportWidth + 10, canvasHeight / 2 - beamHeight);
    uniformCtx.lineTo(supportWidth, canvasHeight / 2);
    uniformCtx.closePath();
    uniformCtx.fillStyle = "black";
    uniformCtx.fill();
    uniformCtx.moveTo(canvasWidth - supportWidth - 10, canvasHeight / 2 - beamHeight); // Podpora prawa (trójkąt, wierzchołek na górze)
    uniformCtx.lineTo(canvasWidth - supportWidth + 10, canvasHeight / 2 - beamHeight);
    uniformCtx.lineTo(canvasWidth - supportWidth, canvasHeight / 2);
    uniformCtx.closePath();
    uniformCtx.fill();
    uniformCtx.stroke();
    uniformCtx.font = "12px Arial"; // Zwiększona czytelność tekstu
    uniformCtx.fillStyle = "black";
    uniformCtx.fillText(`q = ${result.load_kg_m.toFixed(2)} kg/m (rozstaw: ${result.spacing_mm.toFixed(2)} mm)`, canvasWidth / 2 - 100, canvasHeight / 2 - beamHeight - 10);

    // Wymiar całkowity
    uniformCtx.beginPath();
    uniformCtx.moveTo(supportWidth, canvasHeight / 2 + 15);
    uniformCtx.lineTo(canvasWidth - supportWidth, canvasHeight / 2 + 15);
    uniformCtx.moveTo(supportWidth, canvasHeight / 2 + 10); uniformCtx.lineTo(supportWidth + 5, canvasHeight / 2 + 15); uniformCtx.lineTo(supportWidth, canvasHeight / 2 + 20);
    uniformCtx.moveTo(canvasWidth - supportWidth, canvasHeight / 2 + 10); uniformCtx.lineTo(canvasWidth - supportWidth - 5, canvasHeight / 2 + 15); uniformCtx.lineTo(canvasWidth - supportWidth, canvasHeight / 2 + 20);
    uniformCtx.stroke();
    uniformCtx.fillText(`${result.L} m`, canvasWidth / 2 - 10, canvasHeight / 2 + 25);

    // Belka - obciążenia punktowe
    let pointCtx = pointBeamCanvas.getContext("2d");
    pointCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    pointCtx.beginPath();
    pointCtx.strokeStyle = "black";
    pointCtx.lineWidth = 2;
    pointCtx.moveTo(supportWidth, canvasHeight / 2); // Belka
    pointCtx.lineTo(canvasWidth - supportWidth, canvasHeight / 2);
    pointCtx.moveTo(supportWidth - 10, canvasHeight / 2 - beamHeight); // Podpora lewa (trójkąt, wierzchołek na górze)
    pointCtx.lineTo(supportWidth + 10, canvasHeight / 2 - beamHeight);
    pointCtx.lineTo(supportWidth, canvasHeight / 2);
    pointCtx.closePath();
    pointCtx.fillStyle = "black";
    pointCtx.fill();
    pointCtx.moveTo(canvasWidth - supportWidth - 10, canvasHeight / 2 - beamHeight); // Podpora prawa (trójkąt, wierzchołek na górze)
    pointCtx.lineTo(canvasWidth - supportWidth + 10, canvasHeight / 2 - beamHeight);
    pointCtx.lineTo(canvasWidth - supportWidth, canvasHeight / 2);
    pointCtx.closePath();
    pointCtx.fill();
    pointCtx.stroke();

    let L = result.L;
    for (let i = 0; i < result.forces.length; i++) {
        let x = supportWidth + (result.distances[i] / L) * (canvasWidth - 2 * supportWidth);
        pointCtx.strokeStyle = "blue";
        pointCtx.beginPath();
        pointCtx.moveTo(x, canvasHeight / 2); // Początek strzałki
        pointCtx.lineTo(x, canvasHeight / 2 + 20); // W dół
        pointCtx.lineTo(x - 5, canvasHeight / 2 + 15); // Lewa część grotu
        pointCtx.moveTo(x, canvasHeight / 2 + 20);
        pointCtx.lineTo(x + 5, canvasHeight / 2 + 15); // Prawa część grotu
        pointCtx.stroke();
        pointCtx.fillStyle = "blue";
        pointCtx.fillText(`P${i + 1} = ${result.forces[i]} kg`, x - 20, canvasHeight / 2 + 30);
    }
    pointCtx.stroke();

    // Wymiary z domiarami, z większym odstępem
    pointCtx.strokeStyle = "green";
    pointCtx.fillStyle = "green";
    pointCtx.beginPath();
    let prevX = supportWidth;
    for (let i = 0; i < result.distances.length; i++) {
        let x = supportWidth + (result.distances[i] / L) * (canvasWidth - 2 * supportWidth);
        pointCtx.moveTo(prevX, canvasHeight / 2 + 25); // Zwiększony odstęp
        pointCtx.lineTo(x, canvasHeight / 2 + 25);
        pointCtx.moveTo(prevX, canvasHeight / 2 + 20); pointCtx.lineTo(prevX + 5, canvasHeight / 2 + 25); pointCtx.lineTo(prevX, canvasHeight / 2 + 30);
        pointCtx.moveTo(x, canvasHeight / 2 + 20); pointCtx.lineTo(x - 5, canvasHeight / 2 + 25); pointCtx.lineTo(x, canvasHeight / 2 + 30);
        pointCtx.fillText(`${(result.distances[i] - (i > 0 ? result.distances[i - 1] : 0)).toFixed(2)} m`, (prevX + x) / 2 - 10, canvasHeight / 2 + 35);
        prevX = x;
    }
    pointCtx.moveTo(prevX, canvasHeight / 2 + 25);
    pointCtx.lineTo(canvasWidth - supportWidth, canvasHeight / 2 + 25);
    pointCtx.moveTo(prevX, canvasHeight / 2 + 20); pointCtx.lineTo(prevX + 5, canvasHeight / 2 + 25); pointCtx.lineTo(prevX, canvasHeight / 2 + 30);
    pointCtx.moveTo(canvasWidth - supportWidth, canvasHeight / 2 + 20); pointCtx.lineTo(canvasWidth - supportWidth - 5, canvasHeight / 2 + 25); pointCtx.lineTo(canvasWidth - supportWidth, canvasHeight / 2 + 30);
    pointCtx.fillText(`${(L - (result.distances.length > 0 ? result.distances[result.distances.length - 1] : 0)).toFixed(2)} m`, (prevX + canvasWidth - supportWidth) / 2 - 10, canvasHeight / 2 + 35);
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
                fill: false,
                pointRadius: 2
            }]
        },
        options: {
            maintainAspectRatio: false,
            responsive: true, // Włącz responsywność z minimalną szerokością
            scales: { 
                y: { beginAtZero: false, reverse: true, title: { display: true, text: 'Moment (kg·m)' } }, // Oś Y w dół
                x: { title: { display: true, text: 'Odległość (m)' }, min: 0, max: L }
            },
            plugins: {
                annotation: {
                    annotations: [{
                        type: 'label',
                        xValue: (L / 2).toFixed(2),
                        yValue: result.max_moment_uniform,
                        content: [`Max: ${Math.abs(result.max_moment_uniform).toFixed(2)} kg·m`],
                        color: 'blue',
                        position: 'start',
                        xAdjust: 0,
                        yAdjust: 20,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)'
                    }, {
                        type: 'line',
                        yMin: result.max_moment_uniform,
                        yMax: result.max_moment_uniform,
                        borderColor: 'green',
                        borderWidth: 1
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
                fill: false,
                pointRadius: 2
            }]
        },
        options: {
            maintainAspectRatio: false,
            responsive: true,
            scales: { 
                y: { beginAtZero: false, reverse: true, title: { display: true, text: 'Moment (kg·m)' } }, // Oś Y w dół
                x: { title: { display: true, text: 'Odległość (m)' }, min: 0, max: L }
            },
            plugins: {
                annotation: {
                    annotations: result.moment_values.map((m, i) => ({
                        type: 'label',
                        xValue: result.point_moment_x[i + 1].toFixed(2),
                        yValue: m,
                        content: [`${m.toFixed(2)} kg·m`],
                        color: 'blue',
                        position: 'start',
                        xAdjust: 0,
                        yAdjust: 20,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)'
                    })).concat({
                        type: 'label',
                        xValue: (result.point_moment_x[Math.floor(result.point_moment_x.length / 2)]).toFixed(2),
                        yValue: result.max_moment_forces,
                        content: [`Max: ${Math.abs(result.max_moment_forces).toFixed(2)} kg·m`],
                        color: 'red',
                        position: 'start',
                        xAdjust: 0,
                        yAdjust: 20,
                        backgroundColor: 'rgba(255, 255, 255, 0.8)'
                    }, {
                        type: 'line',
                        yMin: result.max_moment_forces,
                        yMax: result.max_moment_forces,
                        borderColor: 'green',
                        borderWidth: 1
                    })
                }
            }
        }
    });
}

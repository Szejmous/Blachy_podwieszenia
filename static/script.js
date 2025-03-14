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
    let resultSpan = document.getElementById("result");
    resultSpan.innerText = result.status;
    resultSpan.style.color = result.status.includes("Poprawne") ? "green" : "red";

    drawBeams(result);
    drawCharts(result);
}

function drawBeams(result) {
    const canvasWidth = document.getElementById("uniformBeam").offsetWidth || 600; // Domyślna wartość, jeśli offsetWidth nie działa
    const canvasHeight = document.getElementById("uniformBeam").offsetHeight || 100;
    const beamHeight = canvasWidth * 0.1; // 10% szerokości canvasu
    const supportWidth = canvasWidth * 0.05; // 5% szerokości canvasu

    // Belka - obciążenie równomierne
    let uniformCtx = document.getElementById("uniformBeam").getContext("2d");
    uniformCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    uniformCtx.beginPath();
    uniformCtx.strokeStyle = "black";
    uniformCtx.lineWidth = 2;
    uniformCtx.moveTo(supportWidth, canvasHeight / 2); // Belka
    uniformCtx.lineTo(canvasWidth - supportWidth, canvasHeight / 2);
    uniformCtx.moveTo(supportWidth, canvasHeight / 2); // Podpora lewa (trójkąt)
    uniformCtx.lineTo(supportWidth + beamHeight / 2, canvasHeight / 2 - beamHeight);
    uniformCtx.lineTo(supportWidth - beamHeight / 2, canvasHeight / 2 - beamHeight);
    uniformCtx.closePath();
    uniformCtx.fillStyle = "black";
    uniformCtx.fill();
    uniformCtx.moveTo(canvasWidth - supportWidth, canvasHeight / 2); // Podpora prawa (rolka)
    uniformCtx.lineTo(canvasWidth - supportWidth + beamHeight / 2, canvasHeight / 2 - beamHeight);
    uniformCtx.lineTo(canvasWidth - supportWidth - beamHeight / 2, canvasHeight / 2 - beamHeight);
    uniformCtx.stroke();
    uniformCtx.fillStyle = "black";
    uniformCtx.fillText(`q = ${result.load_kg_m.toFixed(2)} kg/m (rozstaw: ${result.spacing_mm.toFixed(2)} mm)`, canvasWidth / 2 - 80, canvasHeight / 2 - beamHeight - 10);

    // Wymiar całkowity
    uniformCtx.beginPath();
    uniformCtx.moveTo(supportWidth, canvasHeight / 2 + beamHeight);
    uniformCtx.lineTo(canvasWidth - supportWidth, canvasHeight / 2 + beamHeight);
    uniformCtx.moveTo(supportWidth, canvasHeight / 2 + beamHeight - 5); uniformCtx.lineTo(supportWidth + 5, canvasHeight / 2 + beamHeight); uniformCtx.lineTo(supportWidth, canvasHeight / 2 + beamHeight + 5);
    uniformCtx.moveTo(canvasWidth - supportWidth, canvasHeight / 2 + beamHeight - 5); uniformCtx.lineTo(canvasWidth - supportWidth - 5, canvasHeight / 2 + beamHeight); uniformCtx.lineTo(canvasWidth - supportWidth, canvasHeight / 2 + beamHeight + 5);
    uniformCtx.stroke();
    uniformCtx.fillText(`${result.L} m`, canvasWidth / 2 - 10, canvasHeight / 2 + beamHeight + 10);

    // Belka - obciążenia punktowe
    let pointCtx = document.getElementById("pointBeam").getContext("2d");
    pointCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    pointCtx.beginPath();
    pointCtx.strokeStyle = "black";
    pointCtx.lineWidth = 2;
    pointCtx.moveTo(supportWidth, canvasHeight / 2); // Belka
    pointCtx.lineTo(canvasWidth - supportWidth, canvasHeight / 2);
    pointCtx.moveTo(supportWidth, canvasHeight / 2); // Podpora lewa (trójkąt)
    pointCtx.lineTo(supportWidth + beamHeight / 2, canvasHeight / 2 - beamHeight);
    pointCtx.lineTo(supportWidth - beamHeight / 2, canvasHeight / 2 - beamHeight);
    pointCtx.closePath();
    pointCtx.fillStyle = "black";
    pointCtx.fill();
    pointCtx.moveTo(canvasWidth - supportWidth, canvasHeight / 2); // Podpora prawa (rolka)
    pointCtx.lineTo(canvasWidth - supportWidth + beamHeight / 2, canvasHeight / 2 - beamHeight);
    pointCtx.lineTo(canvasWidth - supportWidth - beamHeight / 2, canvasHeight / 2 - beamHeight);
    pointCtx.stroke();

    let L = result.L;
    for (let i = 0; i < result.forces.length; i++) {
        let x = supportWidth + (result.distances[i] / L) * (canvasWidth - 2 * supportWidth);
        pointCtx.strokeStyle = "blue";
        pointCtx.beginPath();
        pointCtx.moveTo(x, canvasHeight / 2); // Początek strzałki
        pointCtx.lineTo(x, canvasHeight / 2 + beamHeight); // W dół
        pointCtx.lineTo(x - beamHeight / 4, canvasHeight / 2 + beamHeight - beamHeight / 4); // Lewa część grotu
        pointCtx.moveTo(x, canvasHeight / 2 + beamHeight);
        pointCtx.lineTo(x + beamHeight / 4, canvasHeight / 2 + beamHeight - beamHeight / 4); // Prawa część grotu
        pointCtx.stroke();
        pointCtx.fillStyle = "blue";
        pointCtx.fillText(`P${i + 1} = ${result.forces[i]} kg`, x - 20, canvasHeight / 2 + beamHeight + 10);
    }
    pointCtx.stroke();

    // Wymiary z domiarami
    pointCtx.strokeStyle = "green";
    pointCtx.fillStyle = "green";
    pointCtx.beginPath();
    let prevX = supportWidth;
    for (let i = 0; i < result.distances.length; i++) {
        let x = supportWidth + (result.distances[i] / L) * (canvasWidth - 2 * supportWidth);
        pointCtx.moveTo(prevX, canvasHeight / 2 + beamHeight);
        pointCtx.lineTo(x, canvasHeight / 2 + beamHeight);
        pointCtx.moveTo(prevX, canvasHeight / 2 + beamHeight - 5); pointCtx.lineTo(prevX + 5, canvasHeight / 2 + beamHeight); pointCtx.lineTo(prevX, canvasHeight / 2 + beamHeight + 5);
        pointCtx.moveTo(x, canvasHeight / 2 + beamHeight - 5); pointCtx.lineTo(x - 5, canvasHeight / 2 + beamHeight); pointCtx.lineTo(x, canvasHeight / 2 + beamHeight + 5);
        pointCtx.fillText(`${(result.distances[i] - (i > 0 ? result.distances[i - 1] : 0)).toFixed(2)} m`, (prevX + x) / 2 - 10, canvasHeight / 2 + beamHeight + 10);
        prevX = x;
    }
    pointCtx.moveTo(prevX, canvasHeight / 2 + beamHeight);
    pointCtx.lineTo(canvasWidth - supportWidth, canvasHeight / 2 + beamHeight);
    pointCtx.moveTo(prevX, canvasHeight / 2 + beamHeight - 5); pointCtx.lineTo(prevX + 5, canvasHeight / 2 + beamHeight); pointCtx.lineTo(prevX, canvasHeight / 2 + beamHeight + 5);
    pointCtx.moveTo(canvasWidth - supportWidth, canvasHeight / 2 + beamHeight - 5); pointCtx.lineTo(canvasWidth - supportWidth - 5, canvasHeight / 2 + beamHeight); pointCtx.lineTo(canvasWidth - supportWidth, canvasHeight / 2 + beamHeight + 5);
    pointCtx.fillText(`${(L - (result.distances.length > 0 ? result.distances[result.distances.length - 1] : 0)).toFixed(2)} m`, (prevX + canvasWidth - supportWidth) / 2 - 10, canvasHeight / 2 + beamHeight + 10);
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
            scales: { y: { beginAtZero: true }, x: { title: { display: true, text: 'Odległość (m)' } } },
            plugins: {
                annotation: {
                    annotations: [{
                        type: 'label',
                        xValue: (L / 2).toFixed(2),
                        yValue: result.max_moment_uniform,
                        content: `${result.max_moment_uniform.toFixed(2)} kg·m`,
                        color: 'blue',
                        position: 'start',
                        xAdjust: 0,
                        yAdjust: -20
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
            scales: { y: { beginAtZero: true }, x: { title: { display: true, text: 'Odległość (m)' } } },
            plugins: {
                annotation: {
                    annotations: result.moment_values.map((m, i) => ({
                        type: 'label',
                        xValue: result.point_moment_x[i + 1].toFixed(2),
                        yValue: m,
                        content: `${m.toFixed(2)} kg·m`,
                        color: 'blue',
                        position: 'start',
                        xAdjust: 0,
                        yAdjust: -20
                    })).concat({
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

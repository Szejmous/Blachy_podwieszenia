let uniformChart, pointChart;

// Baza blach w JavaScript (dla dynamicznego wypełniania listy)
const BLACHY = {
    "Pruszyński": ["T130", "T135", "T135P", "T140", "T150", "T155", "T160"],
    "ArcelorMittal": ["Hacierco 136/337", "Hacierco 135/315", "Hacierco 150/290"],
    "BP2": ["T130", "T135-930", "T135-950", "T153-860", "T160"]
};

document.addEventListener("DOMContentLoaded", function () {
    let forcesDiv = document.getElementById("forces-inputs");
    forcesDiv.innerHTML = `
        <div class="forces-row">
            <div>
                <label class="force-label">P1 (kg): <input id="P1" type="number" value="0" onchange="calculate()" oninput="calculate()"></label>
                <label class="distance-label">x1 (m): <input id="x1" type="number" value="0" onchange="calculate()" oninput="calculate()"></label>
            </div>
            <div>
                <label class="force-label">P2 (kg): <input id="P2" type="number" value="0" onchange="calculate()" oninput="calculate()"></label>
                <label class="distance-label">x2 (m): <input id="x2" type="number" value="0" onchange="calculate()" oninput="calculate()"></label>
            </div>
            <div>
                <label class="force-label">P3 (kg): <input id="P3" type="number" value="0" onchange="calculate()" oninput="calculate()"></label>
                <label class="distance-label">x3 (m): <input id="x3" type="number" value="0" onchange="calculate()" oninput="calculate()"></label>
            </div>
        </div>
        <div class="forces-row">
            <div>
                <label class="force-label">P4 (kg): <input id="P4" type="number" value="0" onchange="calculate()" oninput="calculate()"></label>
                <label class="distance-label">x4 (m): <input id="x4" type="number" value="0" onchange="calculate()" oninput="calculate()"></label>
            </div>
            <div>
                <label class="force-label">P5 (kg): <input id="P5" type="number" value="0" onchange="calculate()" oninput="calculate()"></label>
                <label class="distance-label">x5 (m): <input id="x5" type="number" value="0" onchange="calculate()" oninput="calculate()"></label>
            </div>
            <div>
                <label class="force-label">P6 (kg): <input id="P6" type="number" value="0" onchange="calculate()" oninput="calculate()"></label>
                <label class="distance-label">x6 (m): <input id="x6" type="number" value="0" onchange="calculate()" oninput="calculate()"></label>
            </div>
        </div>
    `;
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
    const isWithinLimits = Math.abs(result.max_continuous_moment_theoretical) > Math.abs(result.max_point_moment);
    resultSpan.style.color = isWithinLimits ? "green" : "red";
    resultSpan.style.fontSize = "18px"; // Większa czcionka niż h2 (16px domyślnie)
    resultSpan.style.fontWeight = "bold";

    // Aktualizacja nagłówka 

document.getElementById("uniform-load-heading").innerText = `Pojedyncza fałda - maksymalne obciążenie wzdłuż równomiernie (nie punktowe) (q = ${result.load_kg_m.toFixed(2)} kg/m)`;
document.getElementById("uniform-load-heading").style.fontSize = "16px";
document.getElementById("uniform-load-heading").style.fontWeight = "bold";

    // Usuń istniejące span-y, aby uniknąć duplikatów
    const uniformContainer = document.querySelector('#uniformMomentChart').parentElement;
    const pointContainer = document.querySelector('#pointMomentChart').parentElement;
    uniformContainer.querySelectorAll('span').forEach(span => span.remove());
    pointContainer.querySelectorAll('span').forEach(span => span.remove());

    // Wyświetlanie maksymalnych wartości z kolorami
    const maxUniformSpan = document.createElement("span");
    maxUniformSpan.innerText = `Max Moment (równomierne): ${Math.abs(result.max_uniform_moment).toFixed(2)} kg·m`;
    maxUniformSpan.style.color = isWithinLimits ? "green" : "red";
    maxUniformSpan.style.fontWeight = "bold";
    uniformContainer.insertBefore(maxUniformSpan, uniformContainer.firstChild);

    const maxPointSpan = document.createElement("span");
    maxPointSpan.innerText = `Max Moment (punktowe): ${Math.abs(result.max_point_moment).toFixed(2)} kg·m`;
    maxPointSpan.style.color = isWithinLimits ? "green" : "red";
    maxPointSpan.style.fontWeight = "bold";
    pointContainer.insertBefore(maxPointSpan, pointContainer.firstChild);

    drawBeams(result);
    drawCharts(result);
}

function drawBeams(result) {
    const canvasWidth = 600; // Stała szerokość
    const canvasHeight = 100; // Stała wysokość
    const beamHeight = 20; // Wysokość belki
    const supportWidth = 20; // Szerokość podpór

    // Ustawienie wymiarów canvasu
    const uniformBeamCanvas = document.getElementById("uniformBeam");
    const pointBeamCanvas = document.getElementById("pointBeam");
    uniformBeamCanvas.width = canvasWidth;
    uniformBeamCanvas.height = canvasHeight;
    uniformBeamCanvas.style.width = `${canvasWidth}px`;
    uniformBeamCanvas.style.height = `${canvasHeight}px`;
    pointBeamCanvas.width = canvasWidth;
    pointBeamCanvas.height = canvasHeight;
    pointBeamCanvas.style.width = `${canvasWidth}px`;
    pointBeamCanvas.style.height = `${canvasHeight}px`;

    // Belka - obciążenie równomierne
    let uniformCtx = uniformBeamCanvas.getContext("2d");
    uniformCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    uniformCtx.beginPath();
    uniformCtx.strokeStyle = "black";
    uniformCtx.lineWidth = 1;
    uniformCtx.moveTo(supportWidth, canvasHeight / 2);
    uniformCtx.lineTo(canvasWidth - supportWidth, canvasHeight / 2);
    uniformCtx.moveTo(supportWidth - 10, canvasHeight / 2 + beamHeight);
    uniformCtx.lineTo(supportWidth + 10, canvasHeight / 2 + beamHeight);
    uniformCtx.lineTo(supportWidth, canvasHeight / 2);
    uniformCtx.closePath();
    uniformCtx.fillStyle = "black";
    uniformCtx.fill();
    uniformCtx.moveTo(canvasWidth - supportWidth - 10, canvasHeight / 2 + beamHeight);
    uniformCtx.lineTo(canvasWidth - supportWidth + 10, canvasHeight / 2 + beamHeight);
    uniformCtx.lineTo(canvasWidth - supportWidth, canvasHeight / 2);
    uniformCtx.closePath();
    uniformCtx.fill();
    uniformCtx.stroke();
    uniformCtx.font = "12px Arial";
    uniformCtx.fillStyle = "black";
    uniformCtx.textAlign = "center";
    uniformCtx.fillText(`q = ${result.load_kg_m.toFixed(2)} kg/m (rozstaw: ${result.spacing_mm.toFixed(2)} mm)`, canvasWidth / 2, canvasHeight / 2 - beamHeight - 5);

    // Wymiar całkowity (odsunięty w dół, aby nie nachodził na trójkąty)
    uniformCtx.beginPath();
    uniformCtx.moveTo(supportWidth, canvasHeight / 2 + 30); // Odsunięte o 15px w dół
    uniformCtx.lineTo(canvasWidth - supportWidth, canvasHeight / 2 + 30);
    uniformCtx.moveTo(supportWidth, canvasHeight / 2 + 25); uniformCtx.lineTo(supportWidth + 5, canvasHeight / 2 + 30); uniformCtx.lineTo(supportWidth, canvasHeight / 2 + 35);
    uniformCtx.moveTo(canvasWidth - supportWidth, canvasHeight / 2 + 25); uniformCtx.lineTo(canvasWidth - supportWidth - 5, canvasHeight / 2 + 30); uniformCtx.lineTo(canvasWidth - supportWidth, canvasHeight / 2 + 35);
    uniformCtx.stroke();
    uniformCtx.fillText(`${result.L} m`, canvasWidth / 2, canvasHeight / 2 + 40); // Odsunięty opis

    // Belka - obciążenia punktowe
    let pointCtx = pointBeamCanvas.getContext("2d");
    pointCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    pointCtx.beginPath();
    pointCtx.strokeStyle = "black";
    pointCtx.lineWidth = 1;
    pointCtx.moveTo(supportWidth, canvasHeight / 2);
    pointCtx.lineTo(canvasWidth - supportWidth, canvasHeight / 2);
    pointCtx.moveTo(supportWidth - 10, canvasHeight / 2 + beamHeight);
    pointCtx.lineTo(supportWidth + 10, canvasHeight / 2 + beamHeight);
    pointCtx.lineTo(supportWidth, canvasHeight / 2);
    pointCtx.closePath();
    pointCtx.fillStyle = "black";
    pointCtx.fill();
    pointCtx.moveTo(canvasWidth - supportWidth - 10, canvasHeight / 2 + beamHeight);
    pointCtx.lineTo(canvasWidth - supportWidth + 10, canvasHeight / 2 + beamHeight);
    pointCtx.lineTo(canvasWidth - supportWidth, canvasHeight / 2);
    pointCtx.closePath();
    pointCtx.fill();
    pointCtx.stroke();

    let L = result.L;
    for (let i = 0; i < result.forces.length; i++) {
        let x = supportWidth + (result.distances[i] / L) * (canvasWidth - 2 * supportWidth);
        pointCtx.strokeStyle = "blue";
        pointCtx.beginPath();
        pointCtx.moveTo(x, canvasHeight / 2);
        pointCtx.lineTo(x, canvasHeight / 2 + 20);
        pointCtx.lineTo(x - 5, canvasHeight / 2 + 15);
        pointCtx.moveTo(x, canvasHeight / 2 + 20);
        pointCtx.lineTo(x + 5, canvasHeight / 2 + 15);
        pointCtx.stroke();
        pointCtx.fillStyle = "blue";
        pointCtx.textAlign = "center";
        pointCtx.fillText(`P${i + 1} = ${result.forces[i]} kg`, x, canvasHeight / 2 - 15);
    }
    pointCtx.stroke();

    // Wymiary z domiarami
    pointCtx.strokeStyle = "green";
    pointCtx.fillStyle = "green";
    pointCtx.beginPath();
    let prevX = supportWidth;
    for (let i = 0; i < result.distances.length; i++) {
        let x = supportWidth + (result.distances[i] / L) * (canvasWidth - 2 * supportWidth);
        pointCtx.moveTo(prevX, canvasHeight / 2 + 25);
        pointCtx.lineTo(x, canvasHeight / 2 + 25);
        pointCtx.moveTo(prevX, canvasHeight / 2 + 20); pointCtx.lineTo(prevX + 5, canvasHeight / 2 + 25); pointCtx.lineTo(prevX, canvasHeight / 2 + 30);
        pointCtx.moveTo(x, canvasHeight / 2 + 20); pointCtx.lineTo(x - 5, canvasHeight / 2 + 25); pointCtx.lineTo(x, canvasHeight / 2 + 30);
        pointCtx.fillText(`${result.distances[i] - (i > 0 ? result.distances[i - 1] : 0)} m`, (prevX + x) / 2, canvasHeight / 2 + 35);
        prevX = x;
    }
    pointCtx.moveTo(prevX, canvasHeight / 2 + 25);
    pointCtx.lineTo(canvasWidth - supportWidth, canvasHeight / 2 + 25);
    pointCtx.moveTo(prevX, canvasHeight / 2 + 20); pointCtx.lineTo(prevX + 5, canvasHeight / 2 + 25); pointCtx.lineTo(prevX, canvasHeight / 2 + 30);
    pointCtx.moveTo(canvasWidth - supportWidth, canvasHeight / 2 + 20); pointCtx.lineTo(canvasWidth - supportWidth - 5, canvasHeight / 2 + 25); pointCtx.lineTo(canvasWidth - supportWidth, canvasHeight / 2 + 30);
    pointCtx.fillText(`${L - (result.distances.length > 0 ? result.distances[result.distances.length - 1] : 0)} m`, (prevX + canvasWidth - supportWidth) / 2, canvasHeight / 2 + 35);
    pointCtx.stroke();
}

function drawCharts(result) {
    // Czyszczenie istniejących wykresów
    if (uniformChart) uniformChart.destroy();
    if (pointChart) pointChart.destroy();

    const L = result.L;
    const xValues = result.x_values;
    console.log("xValues:", xValues);
    console.log("point_moment_values:", result.point_moment_values);

    // Wykres dla obciążenia równomiernego
    const uniformCanvas = document.getElementById('uniformMomentChart');
    uniformCanvas.style.width = '100%';
    uniformCanvas.style.height = '100%';
    uniformChart = new Chart(uniformCanvas, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Moment (kg·m)',
                data: result.uniform_moment.map((moment, index) => ({
                    x: xValues[index],
                    y: moment  // Wartości są już ujemne z app.py
                })),
                borderColor: 'blue',
                borderWidth: 2,
                fill: false,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: 'Odległość [m]' },
                    min: 0,
                    max: L,
                    ticks: {
                        stepSize: 0.1,  // Etykiety co 0.1 m
                        font: { size: 10 },  // Mniejszy font, bo etykiety będą gęste
                        maxTicksLimit: 20,  // Ograniczenie liczby etykiet, aby uniknąć nakładania
                        callback: function(value) {
                            return value.toFixed(1);
                        }
                    }
                },
                y: {
                    title: { display: true, text: 'Moment [kg·m]' },
                    beginAtZero: true,
                    min: Math.min(...result.uniform_moment) * 1.2 || 0,  // Ujemne wartości w dół
                    max: 0,  // Górna granica na 0
                    ticks: {
                        stepSize: Math.abs(Math.min(...result.uniform_moment) * 1.2) / 5 || 2,  // Krok dla ujemnych wartości
                        font: { size: 14 }
                    }
                }
            },
            plugins: {
                legend: { position: 'top', labels: { font: { size: 14 } } },
                tooltip: {
                    bodyFont: { size: 14 },
                    callbacks: {
                        label: function(context) {
                            return `Moment: ${Math.abs(context.parsed.y).toFixed(2)} kg·m at ${context.parsed.x.toFixed(1)} m`;
                        }
                    }
                }
            }
        }
    });

    // Wykres dla obciążeń punktowych
    const pointCanvas = document.getElementById('pointMomentChart');
    pointCanvas.style.width = '100%';
    pointCanvas.style.height = '100%';
    pointChart = new Chart(pointCanvas, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Moment (kg·m)',
                data: result.point_moment_values.map((moment, index) => ({
                    x: xValues[index],
                    y: moment  // Wartości są już ujemne z app.py
                })),
                borderColor: 'red',
                borderWidth: 2,
                fill: false,
                tension: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: 'Odległość [m]' },
                    min: 0,
                    max: L,
                    ticks: {
                        stepSize: 0.1,  // Etykiety co 0.1 m
                        font: { size: 10 },  // Mniejszy font, bo etykiety będą gęste
                        maxTicksLimit: 20,  // Ograniczenie liczby etykiet, aby uniknąć nakładania
                        callback: function(value) {
                            return value.toFixed(1);
                        }
                    }
                },
                y: {
                    title: { display: true, text: 'Moment [kg·m]' },
                    beginAtZero: true,
                    min: Math.min(...result.point_moment_values) * 1.2 || 0,  // Ujemne wartości w dół
                    max: 0,  // Górna granica na 0
                    ticks: {
                        stepSize: Math.abs(Math.min(...result.point_moment_values) * 1.2) / 5 || 2,  // Krok dla ujemnych wartości
                        font: { size: 14 }
                    }
                }
            },
            plugins: {
                legend: { position: 'top', labels: { font: { size: 14 } } },
                tooltip: {
                    bodyFont: { size: 14 },
                    callbacks: {
                        label: function(context) {
                            return `Moment: ${Math.abs(context.parsed.y).toFixed(2)} kg·m at ${context.parsed.x.toFixed(1)} m`;
                        }
                    }
                }
            }
        }
    });
}

// Obsługa zmiany rozmiaru okna
window.addEventListener('resize', function () {
    calculate();
});
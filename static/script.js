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
    const canvasWidth = 600; // Stała szerokość
    const canvasHeight = 100; // Stała wysokość
    const beamHeight = 20; // Wysokość belki
    const supportWidth = 20; // Szerokość podpór

    // Ustawienie wymiarów canvasu
    const uniformBeamCanvas = document.getElementById("uniformBeam");
    const pointBeamCanvas = document.getElementById("pointBeam");
    uniformBeamCanvas.width = canvasWidth * 2; // Podwójna rozdzielczość
    uniformBeamCanvas.height = canvasHeight * 2;
    uniformBeamCanvas.style.width = `${canvasWidth}px`;
    uniformBeamCanvas.style.height = `${canvasHeight}px`;
    pointBeamCanvas.width = canvasWidth * 2;
    pointBeamCanvas.height = canvasHeight * 2;
    pointBeamCanvas.style.width = `${canvasWidth}px`;
    pointBeamCanvas.style.height = `${canvasHeight}px`;

    // Belka - obciążenie równomierne
    let uniformCtx = uniformBeamCanvas.getContext("2d");
    uniformCtx.clearRect(0, 0, canvasWidth * 2, canvasHeight * 2);
    uniformCtx.scale(2, 2); // Skala dla ostrości
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

    // Wymiar całkowity
    uniformCtx.beginPath();
    uniformCtx.moveTo(supportWidth, canvasHeight / 2 + 15);
    uniformCtx.lineTo(canvasWidth - supportWidth, canvasHeight / 2 + 15);
    uniformCtx.moveTo(supportWidth, canvasHeight / 2 + 10); uniformCtx.lineTo(supportWidth + 5, canvasHeight / 2 + 15); uniformCtx.lineTo(supportWidth, canvasHeight / 2 + 20);
    uniformCtx.moveTo(canvasWidth - supportWidth, canvasHeight / 2 + 10); uniformCtx.lineTo(canvasWidth - supportWidth - 5, canvasHeight / 2 + 15); uniformCtx.lineTo(canvasWidth - supportWidth, canvasHeight / 2 + 20);
    uniformCtx.stroke();
    uniformCtx.fillText(`${result.L} m`, canvasWidth / 2, canvasHeight / 2 + 25);

    // Belka - obciążenia punktowe
    let pointCtx = pointBeamCanvas.getContext("2d");
    pointCtx.clearRect(0, 0, canvasWidth * 2, canvasHeight * 2);
    pointCtx.scale(2, 2); // Skala dla ostrości
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
        pointCtx.fillText(`${(result.distances[i] - (i > 0 ? result.distances[i - 1] : 0)).toFixed(2)} m`, (prevX + x) / 2, canvasHeight / 2 + 35);
        prevX = x;
    }
    pointCtx.moveTo(prevX, canvasHeight / 2 + 25);
    pointCtx.lineTo(canvasWidth - supportWidth, canvasHeight / 2 + 25);
    pointCtx.moveTo(prevX, canvasHeight / 2 + 20); pointCtx.lineTo(prevX + 5, canvasHeight / 2 + 25); pointCtx.lineTo(prevX, canvasHeight / 2 + 30);
    pointCtx.moveTo(canvasWidth - supportWidth, canvasHeight / 2 + 20); pointCtx.lineTo(canvasWidth - supportWidth - 5, canvasHeight / 2 + 25); pointCtx.lineTo(canvasWidth - supportWidth, canvasHeight / 2 + 30);
    pointCtx.fillText(`${(L - (result.distances.length > 0 ? result.distances[result.distances.length - 1] : 0)).toFixed(2)} m`, (prevX + canvasWidth - supportWidth) / 2, canvasHeight / 2 + 35);
    pointCtx.stroke();
}

function drawCharts(result) {
    // Czyszczenie istniejących wykresów
    if (uniformChart) uniformChart.destroy();
    if (pointChart) pointChart.destroy();

    const L = result.L;
    const chartWidth = document.getElementById('uniformMomentChart').parentElement.clientWidth || 600; // Aktualna szerokość okna
    const chartHeight = 300; // Stała wysokość

    // Nowy wykres dla obciążenia równomiernego
    const uniformCanvas = document.getElementById('uniformMomentChart');
    uniformCanvas.width = chartWidth * 2; // Podwójna rozdzielczość
    uniformCanvas.height = chartHeight * 2;
    uniformCanvas.style.width = `${chartWidth}px`;
    uniformCanvas.style.height = `${chartHeight}px`;
    uniformChart = new Chart(uniformCanvas, {
        type: 'line',
        data: {
            labels: result.x_values.map(x => x.toFixed(2)),
            datasets: [{
                label: 'Moment (kg·m)',
                data: result.uniform_moment,
                borderColor: 'blue',
                borderWidth: 2,
                fill: false,
                pointRadius: 0,
                tension: 0.1,
                borderDash: [5, 5]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Odległość (m)'
                    },
                    min: 0,
                    max: L,
                    ticks: {
                        stepSize: L / 5,
                        font: {
                            size: 14
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Moment (kg·m)'
                    },
                    beginAtZero: true,
                    min: Math.min(...result.uniform_moment) * 1.2 || -10, // Dynamiczny zakres
                    max: 0,
                    ticks: {
                        stepSize: Math.abs(Math.min(...result.uniform_moment) * 1.2) / 5 || 2,
                        font: {
                            size: 14
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    bodyFont: {
                        size: 14
                    },
                    callbacks: {
                        label: function(context) {
                            return `Moment: ${context.raw.toFixed(2)} kg·m at ${context.label} m`;
                        }
                    }
                }
            }
        }
    });

    // Nowy wykres dla obciążeń punktowych
    const pointCanvas = document.getElementById('pointMomentChart');
    pointCanvas.width = chartWidth * 2; // Podwójna rozdzielczość
    pointCanvas.height = chartHeight * 2;
    pointCanvas.style.width = `${chartWidth}px`;
    pointCanvas.style.height = `${chartHeight}px`;
    pointChart = new Chart(pointCanvas, {
        type: 'line',
        data: {
            labels: result.point_moment_x.map(x => x.toFixed(2)),
            datasets: [{
                label: 'Moment (kg·m)',
                data: result.point_moment_values,
                borderColor: 'red',
                borderWidth: 2,
                fill: false,
                pointRadius: 0,
                tension: 0.1,
                borderDash: [5, 5]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Odległość (m)'
                    },
                    min: 0,
                    max: L,
                    ticks: {
                        stepSize: L / 5,
                        font: {
                            size: 14
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Moment (kg·m)'
                    },
                    beginAtZero: true,
                    min: Math.min(...result.point_moment_values) * 1.2 || -10, // Dynamiczny zakres
                    max: 0,
                    ticks: {
                        stepSize: Math.abs(Math.min(...result.point_moment_values) * 1.2) / 5 || 2,
                        font: {
                            size: 14
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        font: {
                            size: 14
                        }
                    }
                },
                tooltip: {
                    bodyFont: {
                        size: 14
                    },
                    callbacks: {
                        label: function(context) {
                            return `Moment: ${context.raw.toFixed(2)} kg·m at ${context.label} m`;
                        }
                    }
                }
            }
        }
    });
}

// Obsługa zmiany rozmiaru okna
window.addEventListener('resize', function () {
    calculate(); // Ponowne narysowanie belek i wykresów
});

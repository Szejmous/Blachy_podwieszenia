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

    // Sprawdzenie obu warunków
    const isWithinMomentLimits = Math.abs(result.max_continuous_moment_theoretical) > Math.abs(result.max_point_moment);
    const isWithinReactionLimits = result.status_reaction === "OK";

    // Wybór odpowiedniego statusu do wyświetlenia
    let displayStatus = "";
    let statusColor = "green";

    if (!isWithinMomentLimits) {
        displayStatus = result.status_moment;
        statusColor = "red";
    }
    if (!isWithinReactionLimits) {
        displayStatus = result.status_reaction;
        statusColor = "red";
    }
    if (isWithinMomentLimits && isWithinReactionLimits) {
        displayStatus = result.status_moment;  // "Podwieszenie jest poprawne"
        statusColor = "green";
    }

    resultSpan.innerText = displayStatus;
    resultSpan.style.color = statusColor;
    resultSpan.style.fontSize = "18px";
    resultSpan.style.fontWeight = "bold";

    // Aktualizacja nagłówka z obciążeniem ciągłym
    document.getElementById("uniform-load-heading").innerText = `Pojedyncza fałda - maksymalne obciążenie wzdłuż równomiernie (nie punktowe) (q = ${result.load_kg_m.toFixed(2)} kg/m)`;
    document.getElementById("uniform-load-heading").style.fontSize = "16px";
    document.getElementById("uniform-load-heading").style.fontWeight = "normal";

    // Usuń istniejące span-y, aby uniknąć duplikatów
    const uniformContainer = document.querySelector('#uniformMomentChart').parentElement;
    const pointContainer = document.querySelector('#pointMomentChart').parentElement;
    uniformContainer.querySelectorAll('span').forEach(span => span.remove());
    pointContainer.querySelectorAll('span').forEach(span => span.remove());

    // Wyświetlanie maksymalnych wartości z kolorami
    const maxUniformSpan = document.createElement("span");
    maxUniformSpan.innerText = `Max Moment (równomierne): ${Math.abs(result.max_uniform_moment).toFixed(2)} kg·m`;
    maxUniformSpan.style.color = isWithinMomentLimits ? "green" : "red";
    maxUniformSpan.style.fontWeight = "bold";
    uniformContainer.insertBefore(maxUniformSpan, uniformContainer.firstChild);

    const maxPointSpan = document.createElement("span");
    maxPointSpan.innerText = `Max Moment (punktowe): ${Math.abs(result.max_point_moment).toFixed(2)} kg·m`;
    maxPointSpan.style.color = isWithinMomentLimits ? "green" : "red";
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

    // Wyświetlanie reakcji podporowych dla obciążenia równomiernego
    uniformCtx.fillStyle = "purple";
    uniformCtx.fillText(`R_A = ${result.uniform_R_A.toFixed(2)} kg`, supportWidth, canvasHeight / 2 + beamHeight + 40);
    uniformCtx.fillText(`R_B = ${result.uniform_R_B.toFixed(2)} kg`, canvasWidth - supportWidth, canvasHeight / 2 + beamHeight + 40);

    // Wymiar całkowity (odsunięty w dół, aby nie nachodził na trójkąty)
    uniformCtx.beginPath();
    uniformCtx.moveTo(supportWidth, canvasHeight / 2 + 30); // Odsunięte o 15px w dół
    uniformCtx.lineTo(canvasWidth - supportWidth, canvasHeight / 2 + 30);
    uniformCtx.moveTo(supportWidth, canvasHeight / 2 + 25); uniformCtx.lineTo(supportWidth + 5, canvasHeight / 2 + 30); uniformCtx.lineTo(supportWidth, canvasHeight / 2 + 35);
    uniformCtx.moveTo(canvasWidth - supportWidth, canvasHeight / 2 + 25); uniformCtx.lineTo(canvasWidth - supportWidth - 5, canvasHeight / 2 + 30); uniformCtx.lineTo(canvasWidth - supportWidth, canvasHeight / 2 + 35);
    uniformCtx.stroke();
    uniformCtx.fillStyle = "black";
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

    // Wyświetlanie reakcji podporowych dla obciążeń punktowych
    const isWithinReactionLimits = result.status_reaction === "OK";
    pointCtx.fillStyle = isWithinReactionLimits ? "purple" : "red";
    pointCtx.fillText(`R_A = ${result.point_R_A.toFixed(2)} kg`, supportWidth, canvasHeight / 2 + beamHeight + 40);
    pointCtx.fillText(`R_B = ${result.point_R_B.toFixed(2)} kg`, canvasWidth - supportWidth, canvasHeight / 2 + beamHeight + 40);

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

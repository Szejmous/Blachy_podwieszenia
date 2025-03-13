document.addEventListener("DOMContentLoaded", function () {
    let forcesDiv = document.getElementById("forces-inputs");

    for (let i = 1; i <= 6; i++) {
        forcesDiv.innerHTML += `
            <label>P${i} (kg): <input id="P${i}" type="number"></label>
            <label>x${i} (m): <input id="x${i}" type="number"></label><br>
        `;
    }
});

async function calculate() {
    let data = {
        load_kg_m2: document.getElementById("load_kg_m2").value,
        spacing_mm: document.getElementById("spacing_mm").value
    };

    for (let i = 1; i <= 6; i++) {
        data[`P${i}`] = document.getElementById(`P${i}`).value;
        data[`x${i}`] = document.getElementById(`x${i}`).value;
    }

    let response = await fetch("/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    });

    let result = await response.json();
    document.getElementById("result").innerText = result.status;

    drawChart(result.max_moment_uniform, result.moment_values);
}

function drawChart(maxUniform, moments) {
    let ctx = document.getElementById("resultChart").getContext("2d");
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ["0", "L/4", "L/2", "3L/4", "L"],
            datasets: [{
                label: "Moment od obciążenia równomiernego",
                data: [0, maxUniform/2, maxUniform, maxUniform/2, 0],
                borderColor: "blue",
                fill: false
            },
            {
                label: "Moment od sił punktowych",
                data: [0, ...result.moment_values, 0],
                borderColor: "red",
                fill: false
            }]
    }});
}

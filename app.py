from flask import Flask, request, jsonify, render_template
import numpy as np

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    # Pobieranie danych z formularza
    data = request.get_json()
    load_kg_m2 = float(data['load_kg_m2'])  # Obciążenie w kg/m²
    producent = data['producent']
    blacha = data['blacha']
    L = float(data['beam_span'])  # Rozpiętość belki w metrach

    # Zaokrąglenie L do najbliższej wartości podzielnej przez 0.1 m
    L = round(L * 10) / 10  # Zaokrąglamy do 1 miejsca po przecinku

    # Obliczenie obciążenia liniowego na podstawie obciążenia powierzchniowego
    # (przyjmuję stałą szerokość belki, np. 1 m, dostosuj jeśli inne dane)
    load_kg_m = load_kg_m2  # Przykładowe uproszczenie, dostosuj do rzeczywistych danych

    # Siły punktowe
    forces = []
    distances = []
    for i in range(1, 7):
        force = float(data[f'P{i}'])
        distance = float(data[f'x{i}'])
        if force > 0 and 0 <= distance <= L:
            forces.append(force)
            distances.append(distance)

    # Obliczenia dla obciążenia równomiernego
    x_step = 0.1  # Stały krok co 0.1 m
    x_values = np.arange(0, L + x_step, x_step)  # Punkty od 0 do L z krokiem 0.1 m
    uniform_moment = (load_kg_m / 2) * (L * x_values - x_values**2)  # Obliczenie momentu
    uniform_moment = -uniform_moment  # Odwrócenie wartości na ujemne

    # Obliczenia dla obciążeń punktowych
    point_moment = np.zeros_like(x_values)
    for i, force in enumerate(forces):
        a = distances[i]
        moment = np.where(x_values <= a, force * (a - x_values), force * (L - x_values))
        moment = np.where(x_values <= L, moment, 0)  # Upewniamy się, że moment jest 0 poza L
        point_moment += moment
    point_moment = -point_moment  # Odwrócenie wartości na ujemne

    # Maksymalne wartości momentów (uwzględniamy, że są ujemne, bierzemy wartości bezwzględne)
    max_uniform_moment = np.max(np.abs(uniform_moment))
    max_point_moment = np.max(np.abs(point_moment))

    # Teoretyczny maksymalny moment ciągły (dla obciążenia równomiernego, bez odwrócenia)
    max_continuous_moment_theoretical = (load_kg_m * L**2) / 8

    # Status
    status = "Poprawne" if max_continuous_moment_theoretical > max_point_moment else "Niepoprawne"

    # Przygotowanie danych do przesłania
    response_data = {
        "L": L,
        "x_values": x_values.tolist(),
        "uniform_moment": uniform_moment.tolist(),
        "point_moment_values": point_moment.tolist(),
        "forces": forces,
        "distances": distances,
        "load_kg_m": load_kg_m,
        "spacing_mm": 337.0,  # Przykładowa wartość, dostosuj do swojego kodu
        "max_uniform_moment": float(max_uniform_moment),
        "max_point_moment": float(max_point_moment),
        "max_continuous_moment_theoretical": float(max_continuous_moment_theoretical),
        "status": status
    }

    print("Returned data:", response_data)
    return jsonify(response_data)

if __name__ == '__main__':
    app.run(debug=True)

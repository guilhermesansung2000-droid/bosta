emailjs.init("YOUR_EMAILJS_KEY");

const airports = ["São Paulo (GRU)", "Rio de Janeiro (GIG)", "Nova York (JFK)", "Paris (CDG)", "Tóquio (NRT)", "Sydney (SYD)"];

async function searchFlights(origin, destination, departureDate, returnDate) {
    const results = [];
    const apiKey = "YOUR_RAPIDAPI_KEY";

    // API 1: Skyscanner
    try {
        const url1 = `https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/browsequotes/v1.0/BR/BRL/pt-BR/${origin}/${destination}/${departureDate}`;
        const res1 = await fetch(url1, { headers: { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': 'skyscanner-skyscanner-flight-search-v1.p.rapidapi.com' } });
        const data1 = await res1.json();
        results.push(...data1.Quotes.map(q => ({ origin, destination, departureDate, price: q.MinPrice, duration: "10h", stops: q.Direct ? 0 : 1, airline: "Skyscanner", class: "Econômica", emissions: "150kg CO2", baggage: true, link: "https://www.skyscanner.com" })));
    } catch (e) { console.error('Erro Skyscanner:', e); }

    // API 2: Kiwi
    try {
        const url2 = `https://kiwi-api.p.rapidapi.com/v2/search?fly_from=${origin}&fly_to=${destination}&date_from=${departureDate}`;
        const res2 = await fetch(url2, { headers: { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': 'kiwi-api.p.rapidapi.com' } });
        const data2 = await res2.json();
        results.push(...data2.data.map(f => ({ origin, destination, departureDate, price: f.price, duration: f.duration.total / 3600 + "h", stops: f.route.length - 1, airline: f.airlines[0], class: "Econômica", emissions: "120kg CO2", baggage: f.baglimit.hand_weight > 0, link: f.deep_link })));
    } catch (e) { console.error('Erro Kiwi:', e); }

    // API 3: Amadeus
    try {
        const url3 = `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${origin}&destinationLocationCode=${destination}&departureDate=${departureDate}`;
        const res3 = await fetch(url3, { headers: { 'Authorization': 'Bearer YOUR_AMADEUS_TOKEN' } });
        const data3 = await res3.json();
        results.push(...data3.data.map(f => ({ origin, destination, departureDate, price: f.price.total, duration: f.itineraries[0].duration, stops: f.itineraries[0].segments.length - 1, airline: f.validatingAirlineCodes[0], class: "Econômica", emissions: "200kg CO2", baggage: true, link: "https://www.amadeus.com" })));
    } catch (e) { console.error('Erro Amadeus:', e); }

    // API 4: Google Flights (via SerpApi)
    try {
        const url4 = `https://serpapi.com/search.json?engine=google_flights&departure_id=${origin}&arrival_id=${destination}&outbound_date=${departureDate}&api_key=YOUR_SERPAPI_KEY`;
        const res4 = await fetch(url4);
        const data4 = await res4.json();
        results.push(...data4.best_flights.map(f => ({ origin, destination, departureDate, price: f.price, duration: f.total_duration, stops: f.stops, airline: f.airline, class: "Econômica", emissions: "250kg CO2", baggage: true, link: f.booking_token })));
    } catch (e) { console.error('Erro Google Flights:', e); }

    // API 5: Expedia (via RapidAPI)
    try {
        const url5 = `https://expedia-api.p.rapidapi.com/flights/search?origin=${origin}&destination=${destination}&departureDate=${departureDate}`;
        const res5 = await fetch(url5, { headers: { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': 'expedia-api.p.rapidapi.com' } });
        const data5 = await res5.json();
        results.push(...data5.flights.map(f => ({ origin, destination, departureDate, price: f.price, duration: f.duration, stops: f.stops, airline: f.airline, class: "Econômica", emissions: "180kg CO2", baggage: true, link: f.link })));
    } catch (e) { console.error('Erro Expedia:', e); }

    return results;
}

function renderFlights(flights) {
    const list = document.getElementById('flights-list');
    list.innerHTML = '';
    flights.forEach(flight => {
        const card = document.createElement('div');
        card.className = 'col-md-6 mb-3';
        card.innerHTML = `
            <div class="card shadow">
                <div class="card-body">
                    <h5>${flight.origin} → ${flight.destination}</h5>
                    <p><strong>Data:</strong> ${flight.departureDate} | <strong>Preço:</strong> R$ ${flight.price}</p>
                    <p><strong>Duração:</strong> ${flight.duration} | <strong>Escalas:</strong> ${flight.stops} | <strong>Companhia:</strong> ${flight.airline}</p>
                    <p><strong>Classe:</strong> ${flight.class} | <strong>Emissões CO2:</strong> ${flight.emissions} | <strong>Bagagem:</strong> ${flight.baggage ? 'Incluída' : 'Não'}</p>
                    <a href="${flight.link}" class="btn btn-primary" target="_blank">Comprar</a>
                </div>
            </div>
        `;
        list.appendChild(card);
    });
}

// Auto-sugestão
function setupSuggestions(input, suggestionsDiv) {
    input.addEventListener('input', () => {
        const query = input.value.toLowerCase();
        const matches = airports.filter(a => a.toLowerCase().includes(query));
        suggestionsDiv.innerHTML = matches.map(m => `<div onclick="selectSuggestion('${m}', '${input.id}')">${m}</div>`).join('');
        suggestionsDiv.style.display = matches.length ? 'block' : 'none';
    });
}

function selectSuggestion(value, inputId) {
    document.getElementById(inputId).value = value;
    document.getElementById(inputId.replace('origin', 'origin-suggestions').replace('destination', 'destination-suggestions')).style.display = 'none';
}

setupSuggestions(document.getElementById('origin'), document.getElementById('origin-suggestions'));
setupSuggestions(document.getElementById('destination'), document.getElementById('destination-suggestions'));

// Event listeners
document.getElementById('flight-search').addEventListener('submit', async (e) => {
    e.preventDefault();
    const origin = document.getElementById('origin').value;
    const destination = document.getElementById('destination').value;
    const departureDate = document.getElementById('departure-date').value;
    const returnDate = document.getElementById('return-date').value;
    const flights = await searchFlights(origin, destination, departureDate, returnDate);
    renderFlights(flights);
    // Gráfico e filtros
});

// Polling para atualizações automáticas (a cada 5 min)
setInterval(async () => {
    const flights = await searchFlights(document.getElementById('origin').value, document.getElementById('destination').
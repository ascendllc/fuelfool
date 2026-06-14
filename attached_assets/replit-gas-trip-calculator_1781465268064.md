# Build Instructions: Gas Trip Cost Calculator Web App

## Project Overview

Build a single-page web app that walks users through three simple steps to calculate how much a road trip will cost them in gas. The experience should feel clean, friendly, and almost like a game — each step reveals new information before asking for the next input, building toward a satisfying final readout.

The three core steps:

1. Enter a U.S. zip code → fetch and display local average gas price per gallon
1. Enter vehicle year, make, and model → fetch and display EPA-rated MPG
1. Enter start location and destination → calculate route distance and display full trip cost breakdown

-----

## Tech Stack

- **Frontend**: React (Vite) with Tailwind CSS
- **Backend**: Node.js with Express (to proxy API calls and protect keys)
- **APIs**: EIA (gas prices), FuelEconomy.gov (MPG), Google Maps (routing + autocomplete)
- **Deployment**: Replit’s built-in hosting

-----

## Required API Keys

Create a `.env` file in the root of the project and store all keys there. Never expose these in frontend code.

```
EIA_API_KEY=your_key_here
GOOGLE_MAPS_API_KEY=your_key_here
```

### Where to Get Each Key

**EIA API Key (Gas Prices — Free)**

- Go to: <https://www.eia.gov/opendata/register.php>
- Register for a free account
- Your API key will be emailed to you immediately
- No usage limits for reasonable personal/app use

**Google Maps API Key**

- Go to: <https://console.cloud.google.com/>
- Create a new project
- Enable these three APIs on that project:
  - Maps JavaScript API
  - Distance Matrix API
  - Places API (for address autocomplete)
- Go to “Credentials” and create an API key
- Restrict the key to those three APIs for security

**FuelEconomy.gov API (MPG — No Key Required)**

- This is a free, public U.S. Department of Energy API
- No registration or key needed
- Base URL: `https://www.fueleconomy.gov/ws/rest`

-----

## Backend: Express Server (`server.js`)

The backend handles all API calls so keys stay protected on the server.

### Endpoint 1: Get Gas Price by Zip Code

The EIA API provides gas prices by state (the most granular level they offer). The backend should:

1. Accept a zip code from the frontend
1. Convert the zip code to a U.S. state abbreviation using the `zippopotam.us` API (free, no key required): `GET https://api.zippopotam.us/us/{zipcode}` — the response includes `state abbreviation`
1. Map that state abbreviation to an EIA series ID. EIA provides average regular unleaded prices by state. The series ID format is: `EMM_EPMR_PTE_{STATE_ABBREV}3_DPG` (e.g., for California: `EMM_EPMR_PTE_SCA3_DPG`)
1. Call the EIA API: `GET https://api.eia.gov/v2/seriesid/{SERIES_ID}?api_key={EIA_API_KEY}`
1. Parse the response and return the most recent weekly price per gallon

> **Important Note on EIA Series IDs**: Not every state has its own series. For states without individual data, fall back to the regional PADD (Petroleum Administration for Defense Districts) price. There are 5 PADD regions. Include a fallback map in the server code that assigns each state to a PADD region, and use that region’s series ID when a state-level series is unavailable.

**Express route:**

```
GET /api/gas-price?zip=90210
Response: { price: 4.29, state: "CA", source: "EIA Weekly Average" }
```

-----

### Endpoint 2: Get Vehicle MPG

Use the FuelEconomy.gov REST API. This should be three sequential calls, each powering a dropdown in the UI.

**Step A — Get available years:**
`GET https://www.fueleconomy.gov/ws/rest/vehicle/menu/year`
Returns a list of model years from 1984 to present.

**Step B — Get makes for a given year:**
`GET https://www.fueleconomy.gov/ws/rest/vehicle/menu/make?year={year}`
Returns a list of vehicle makes (Ford, Toyota, etc.)

**Step C — Get models for a given year + make:**
`GET https://www.fueleconomy.gov/ws/rest/vehicle/menu/model?year={year}&make={make}`
Returns a list of models.

**Step D — Get trim/option IDs for a given year + make + model:**
`GET https://www.fueleconomy.gov/ws/rest/vehicle/menu/options?year={year}&make={make}&model={model}`
Returns specific vehicle configurations with IDs. Display these to the user as a final dropdown (e.g., “4-cyl, 2.5L, Automatic”).

**Step E — Get fuel economy for a specific vehicle ID:**
`GET https://www.fueleconomy.gov/ws/rest/vehicle/{id}`
Returns detailed fuel economy data including `comb08` (combined MPG), `city08` (city MPG), and `highway08` (highway MPG).

**Express routes:**

```
GET /api/vehicle/years
GET /api/vehicle/makes?year=2019
GET /api/vehicle/models?year=2019&make=Toyota
GET /api/vehicle/trims?year=2019&make=Toyota&model=Camry
GET /api/vehicle/mpg?id=41126
Response: { combined: 32, city: 28, highway: 39, fuelType: "Regular Gasoline" }
```

All FuelEconomy.gov responses are XML by default. Add `Accept: application/json` to your request headers to receive JSON instead.

-----

### Endpoint 3: Get Trip Distance

Use the Google Maps Distance Matrix API.

`GET https://maps.googleapis.com/maps/api/distancematrix/json?origins={origin}&destinations={destination}&units=imperial&key={GOOGLE_MAPS_API_KEY}`

Parse `rows[0].elements[0].distance.value` (returns meters — convert to miles by dividing by 1609.34) and `rows[0].elements[0].duration.text` for human-readable drive time.

**Express route:**

```
GET /api/distance?origin=New+York,NY&destination=Washington,DC
Response: { miles: 227.4, duration: "3 hours 42 mins" }
```

-----

### Trip Cost Calculation (done server-side or client-side)

Once you have all three pieces of data:

```
gallons_needed = miles / combined_mpg
trip_cost = gallons_needed * gas_price_per_gallon
```

Return or compute: total miles, drive time, combined MPG, gallons needed (rounded to 1 decimal), and total cost in USD (formatted as $X.XX).

-----

## Frontend: React App

### Overall UX Flow

Design the app as a **three-step wizard**. Each step is its own card or panel that slides or fades in. Once a step is complete and its data is returned, show the result in that card before revealing the next step. This creates a satisfying “unlock” feeling as the user progresses.

Do not show all three steps at once on page load. Only show Step 1 initially. When Step 1 is done, reveal Step 2. When Step 2 is done, reveal Step 3. When Step 3 is done, reveal the final Results panel.

-----

### Step 1: Gas Price

**UI elements:**

- Friendly heading: “Where are you filling up?”
- Single text input: “Enter your ZIP code” (max 5 digits, numeric only)
- Submit button: “Find Gas Prices”
- Loading state while fetching
- Result display once fetched: Show a large, friendly number (e.g., **$4.29 / gal**) with a label indicating it’s the current weekly average for that state
- Include a small note citing the source: “Source: U.S. Energy Information Administration”

**Validation:** Reject any input that is not exactly 5 digits. Show an inline error message if the zip is invalid or not found.

-----

### Step 2: Your Vehicle

**UI elements:**

- Heading: “What are you driving?”
- Three cascading dropdowns, each of which becomes enabled only after the previous one is selected:
  - Year (populated on page load from `/api/vehicle/years`)
  - Make (populated after year is selected)
  - Model (populated after make is selected)
  - Trim / Configuration (populated after model is selected — some vehicles have multiple engine/transmission options)
- Submit button: “Look Up MPG”
- Result display: Show combined MPG prominently (e.g., **32 MPG combined**), with city and highway MPG listed below in a smaller font
- If the vehicle uses diesel or electricity, note that clearly next to the result

-----

### Step 3: Your Trip

**UI elements:**

- Heading: “Where are you headed?”
- Two address inputs with Google Places Autocomplete enabled:
  - “Starting from…” (pre-populate with the user’s detected location if geolocation permission is granted, otherwise leave blank)
  - “Destination”
- Submit button: “Calculate My Trip”
- Loading state while Google Maps calculates the route

-----

### Results Panel

This panel replaces or slides in below Step 3 when all data is ready. Design it as a clear, visual summary card. It should contain:

- **Trip Distance**: e.g., 227 miles
- **Drive Time**: e.g., 3 hr 42 min
- **Your MPG**: e.g., 32 MPG combined
- **Gas Price**: e.g., $4.29 / gallon
- **Gallons You’ll Use**: e.g., 7.1 gallons
- **Estimated Trip Cost**: displayed prominently and in large type, e.g., **$30.46**

Include a “Start Over” button that resets the entire wizard back to Step 1.

Optionally, add a fun contextual comparison below the cost (e.g., “That’s about the price of 5 lattes” or “Less than a tank of popcorn at the movies”). These can be generated by dividing the trip cost by common item prices hardcoded in the app (coffee at $6, movie ticket at $16, etc.).

-----

## Visual Design Direction

**Aesthetic:** Energetic but clean. Think road signs, fuel gauges, and open highways — bold typography, high contrast, a sense of forward motion. Not sterile, not cartoonish.

**Color palette:**

- Background: `#0F1117` (near-black asphalt)
- Card background: `#1C1F2E` (dark blue-grey)
- Primary accent: `#F5A623` (fuel-orange/amber — used for CTAs, highlights, and the final cost number)
- Secondary accent: `#4ADE80` (green — used for success states and “unlocked” step indicators)
- Text primary: `#F1F5F9`
- Text secondary: `#94A3B8`

**Typography:**

- Display / headings: “Space Grotesk” (Google Fonts) — slightly techy, confident, not generic
- Body / labels: “Inter” (Google Fonts) — clean and highly readable

**Card design:** Rounded corners (`border-radius: 16px`), subtle border (`1px solid rgba(255,255,255,0.08)`), and a faint inner glow on the active step card to signal focus.

**Step indicators:** Show three numbered steps across the top (1, 2, 3) in a horizontal track. Completed steps show a green checkmark. The active step is highlighted in amber. Future steps are dimmed.

**Micro-interactions:**

- Each step card fades and slides up slightly when it enters view
- The final cost number should count up from 0 when it appears (a short animated counter)
- Button hover state: subtle scale up (`transform: scale(1.02)`) and brightness increase

-----

## File Structure

```
/project-root
  /client
    /src
      /components
        StepIndicator.jsx
        StepOneZip.jsx
        StepTwoVehicle.jsx
        StepThreeTrip.jsx
        ResultsPanel.jsx
        LoadingSpinner.jsx
      App.jsx
      main.jsx
      index.css
    index.html
    vite.config.js
  /server
    server.js
    routes/
      gasPrice.js
      vehicle.js
      distance.js
    utils/
      zipToState.js
      eiaPaddFallback.js
  .env
  package.json
  README.md
```

-----

## Environment Setup in Replit

1. Create a new Replit project using the “React + Node” template (or configure Vite + Express manually)
1. Add your `.env` file using Replit’s built-in Secrets manager (not a raw `.env` file) — go to the “Secrets” tab in the left sidebar and add `EIA_API_KEY` and `GOOGLE_MAPS_API_KEY` as secrets
1. In `vite.config.js`, configure the dev proxy so frontend API calls to `/api/*` are forwarded to the Express backend during development
1. The Google Maps JavaScript API (for Places Autocomplete) must be loaded in `index.html` as a script tag using your key:
   
   ```html
   <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_KEY&libraries=places" async defer></script>
   ```
1. Run `npm install` then start both the Vite frontend and Express backend concurrently using a `concurrently` npm script

-----

## Error Handling Requirements

- If a zip code returns no EIA data and the PADD fallback also fails, show: “We couldn’t find gas prices for that ZIP. Try a nearby ZIP code.”
- If the FuelEconomy.gov API returns no results for a vehicle, show: “No MPG data found for that vehicle. The EPA may not have records for it.”
- If the Google Maps route cannot be calculated (e.g., no drivable route), show: “We couldn’t find a driving route between those two locations. Check your addresses and try again.”
- All errors should appear inline within the relevant step card, never as browser alerts

-----

## Optional Enhancements (Phase 2)

- Allow the user to toggle between regular, midgrade, and premium gas prices (EIA provides all three)
- Add a “round trip” toggle that doubles the distance and cost
- Allow comparing two vehicles side by side
- Add a shareable results link using URL query parameters

-----

## Data Attribution

The app must include a small footer crediting:

- Gas prices: U.S. Energy Information Administration (eia.gov)
- MPG data: U.S. Department of Energy / FuelEconomy.gov
- Routing: Google Maps

This is required for EIA data use and is good practice for the others.
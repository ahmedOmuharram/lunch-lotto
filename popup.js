import ENV from './env.js';
import { options, drawWheel, spin } from './wheel.js';

const defaultSettings = {
  distance: 0.5,       // Default search radius in miles
  price: "2,3",        // Google Places API uses 1-4 ($ - $$$$)
  dietary: [],         // Array of dietary preferences (vegetarian, vegan, etc.)
};

const defaultHistory = {
  visits: [] // Array of restaurant visits with date, name, etc.
};

// Convert miles to meters (Google Maps API uses meters)
function milesToMeters(miles) {
  return miles * 1609.34;
}

// Load user settings or use defaults
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(defaultSettings, (settings) => {
      resolve(settings);
    });
  });
}

// Load lunch history or initialize empty
async function loadHistory() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(defaultHistory, (data) => {
      resolve(data.visits || []);
    });
  });
}

// Save a new restaurant visit to history
async function saveToHistory(restaurant) {
  const visits = await loadHistory();
  
  // Create new history entry
  const newVisit = {
    id: Date.now(), // Use timestamp as unique ID
    name: restaurant.name,
    date: new Date().toISOString(),
    googleMapsLink: restaurant.googleMapsLink
  };
  
  // Add to beginning of array (most recent first)
  visits.unshift(newVisit);
  
  // Limit history to last 20 entries
  const limitedVisits = visits.slice(0, 20);
  
  // Save back to storage
  return new Promise((resolve) => {
    chrome.storage.sync.set({ visits: limitedVisits }, () => {
      resolve(limitedVisits);
    });
  });
}

// Clear all history
async function clearHistory() {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ visits: [] }, () => {
      resolve();
    });
  });
}

// Render history list in the UI
async function renderHistory() {
  const visits = await loadHistory();
  const historyList = document.getElementById('history-list');
  
  // Clear existing history
  historyList.innerHTML = '';
  
  if (visits.length === 0) {
    // Show empty state
    historyList.innerHTML = `
      <div class="empty-history-message">
        No history yet! Spin the wheel to start tracking your lunch choices.
      </div>
    `;
    return;
  }
  
  // Loop through visits and create history items
  visits.forEach(visit => {
    const date = new Date(visit.date);
    const formattedDate = date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
      <div class="history-details">
        <div class="history-name">${visit.name}</div>
        <div class="history-date">${formattedDate}</div>
      </div>
      <div class="history-links">
        <a href="${visit.googleMapsLink}" target="_blank">View on Maps</a>
      </div>
    `;
    
    historyList.appendChild(historyItem);
  });
}

// Function to show a view and hide others
function showView(viewId) {
  // Hide all views
  document.querySelectorAll('.view').forEach(view => {
    view.classList.remove('active-view');
  });
  
  // Show the requested view
  document.getElementById(viewId).classList.add('active-view');
  
  // Update navigation buttons
  document.querySelectorAll('.nav-button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Highlight the active nav button
  if (viewId === 'main-view') {
    document.getElementById('nav-main').classList.add('active');
    document.getElementById('main-view').style.display = 'block';
    document.getElementById('history-view').style.display = 'none';
  } else if (viewId === 'history-view') {
    document.getElementById('nav-history').classList.add('active');
    document.getElementById('main-view').style.display = 'none';
    document.getElementById('history-view').style.display = 'block';
    renderHistory(); // Refresh history when showing the view
  }
}

async function fetchRestaurants() {
    try {
      // 🔄 Show Loading GIF and Hide the Wheel
      document.getElementById("loading-gif").style.display = "block";
      document.getElementById("wheel").style.display = "none";
  
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        const settings = await loadSettings();
  
        // Build keyword based on dietary preferences
        let keyword = "healthy";
        if (settings.dietary && settings.dietary.length > 0) {
          settings.dietary.forEach(diet => {
            keyword += " " + diet;
          });
        }

        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${milesToMeters(settings.distance)}&type=restaurant&keyword=${keyword}&minprice=${settings.price[0]}&maxprice=${settings.price[2]}&key=${ENV.GOOGLE_MAPS_API_KEY}`;
  
        const response = await fetch(url);
        const data = await response.json();
  
        if (!data.results || data.results.length === 0) {
          console.error("❌ No restaurants found!");
          alert("No restaurants found! Try adjusting your settings.");
          document.getElementById("loading-gif").style.display = "none"; // ✅ Hide loading GIF on error
          document.getElementById("settings-view").style.display = "block";
          return;
        }
  
        // ✅ Extract restaurant data
        let restaurants = data.results.map((place) => ({
          name: place.name,
          distance: (settings.distance).toFixed(1),
          price: place.price_level ? "$".repeat(place.price_level) : "Unknown",
          lat: place.geometry.location.lat,
          lng: place.geometry.location.lng,
          placeId: place.place_id,
          googleMapsLink: `https://www.google.com/maps/place/?q=place_id:${place.place_id}`, // Add Google Maps link
        }));
  
        // ✅ Remove duplicate restaurant names
        const seen = new Set();
        restaurants = restaurants.filter((restaurant) => {
          if (seen.has(restaurant.name)) {
            return false; // Duplicate found, skip this restaurant
          }
          seen.add(restaurant.name);
          return true; // Unique restaurant, keep it
        });
  
        console.log("✅ Unique Restaurants fetched:", restaurants);
        // ⏳ Wait 5 seconds before showing the wheel
        setTimeout(() => {
          document.getElementById("loading-gif").style.display = "none"; // ✅ Hide Loading GIF
          document.getElementById("wheel").style.display = "block"; // ✅ Show the wheel
          updateWheel(restaurants); // ✅ Update the wheel with restaurant names
        }, 2000);
  
      }, (error) => {
        console.error("❌ Geolocation error:", error);
        alert("Please enable location access to fetch restaurants.");
        document.getElementById("loading-gif").style.display = "none"; // ✅ Hide loading GIF on error
        document.getElementById("wheel").style.display = "block";
      });
    } catch (error) {
      console.error("❌ Error fetching restaurants:", error);
      document.getElementById("loading-gif").style.display = "none"; // ✅ Hide loading GIF on error
      document.getElementById("wheel").style.display = "block";
    }
  }  

  function updateWheel(restaurants) {
    options.length = 0; // Clear the current options array
  
    // Randomly shuffle the restaurants array
    const shuffledRestaurants = [...restaurants].sort(() => Math.random() - 0.5);
  
    // Choose 8 random restaurants
    const selectedRestaurants = shuffledRestaurants.slice(0, 8);
  
    // Extract restaurant names and Google Maps links, and populate options array
    options.push(...selectedRestaurants.map((restaurant) => ({
      name: restaurant.name,
      googleMapsLink: restaurant.googleMapsLink, // Add Google Maps link
    })));
  
    // Debugging: Log the selected restaurants with their links
    console.log("✅ Options for the Wheel:", options);
  
    // Store full restaurant details, including names and links
    const restaurantDetails = selectedRestaurants.map((restaurant) => ({
      name: restaurant.name,
      googleMapsLink: restaurant.googleMapsLink // Add the Google Maps link
    }));
  
    console.log("✅ Selected Restaurants for the Wheel:", restaurantDetails);
  
    // Redraw the wheel with the updated options
    drawWheel();
  }  

// 🛠️ Toggle Settings View
function showSettings() {
  // First hide all other views
  document.querySelectorAll('.view').forEach(view => {
    if (view.id !== 'settings-view') {
      view.style.display = 'none';
    }
  });
  
  // Then show the settings view
  document.getElementById("settings-view").style.display = 'block';
  
  // Update navigation buttons
  document.querySelectorAll('.nav-button').forEach(btn => {
    btn.classList.remove('active');
  });
}

function hideSettings() {
  // Hide settings view
  document.getElementById("settings-view").style.display = 'none';
  document.getElementById("nav-main").classList.add('active');
  document.getElementById("nav-history").classList.remove('active');
  document.getElementById("main-view").style.display = 'block';
  document.getElementById("history-view").style.display = 'none';
  
  // Show main view
  showView('main-view');
}

// Listen for restaurant selection to add to history
function listenForSelection() {
  // This uses a MutationObserver to watch for when the result-container is shown
  const resultContainer = document.getElementById('result-container');
  
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'style' && 
          resultContainer.style.display !== 'none') {
        
        // Get selected restaurant
        const selectedName = document.getElementById('selected-restaurant').textContent;
        const mapsLink = document.getElementById('google-maps-link').href;
        
        if (selectedName && mapsLink) {
          // Save to history
          saveToHistory({
            name: selectedName,
            googleMapsLink: mapsLink
          }).then(() => {
            console.log("Added to history:", selectedName);
          });
        }
      }
    });
  });
  
  observer.observe(resultContainer, { attributes: true });
}

// Ensure scripts run only after DOM is loaded
document.addEventListener("DOMContentLoaded", async () => {
  await fetchRestaurants();

  // Set up navigation
  document.getElementById("nav-main").addEventListener("click", () => showView('main-view'));
  document.getElementById("nav-history").addEventListener("click", () => showView('history-view'));
  
  // Spin button event
  document.getElementById("spin").addEventListener("click", () => spin());

  // Open settings view
  document.getElementById("open-settings").addEventListener("click", showSettings);

  
  // Clear history button
  document.getElementById("clear-history").addEventListener("click", async () => {
    if (confirm("Are you sure you want to clear your lunch history?")) {
      await clearHistory();
      renderHistory();
    }
  });

  // Load saved settings into inputs
  const settings = await loadSettings();
  document.getElementById("distance").value = settings.distance;
  document.getElementById("price").value = settings.price;

  // Set dietary checkboxes based on saved preferences
  if (settings.dietary && Array.isArray(settings.dietary)) {
    settings.dietary.forEach(pref => {
      const checkbox = document.getElementById(pref);
      if (checkbox) checkbox.checked = true;
    });
  }
  
  // Setup history tracking
  listenForSelection();

  // Save settings
  document.getElementById("save-settings").addEventListener("click", async () => {
    const distance = parseFloat(document.getElementById("distance").value);
    const price = document.getElementById("price").value;
  
    // Get all checked dietary preferences
    const dietaryCheckboxes = document.querySelectorAll('input[name="dietary"]:checked');
    const dietary = Array.from(dietaryCheckboxes).map(cb => cb.value);
  
    // Save the updated settings
    chrome.storage.sync.set({ distance, price, dietary }, async () => {
      swal({
        title: `Settings saved!`,
        icon: "success",
        button: false, // Hide the default OK button
      });
  
      // Hide the settings view and fetch new restaurants
      hideSettings();
      await fetchRestaurants(); // Fetch restaurants with the new settings
    });
  });  
});
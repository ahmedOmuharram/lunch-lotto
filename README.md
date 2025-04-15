# **Lunch Lotto – Your Fun & Easy Lunch Picker!**  

This is the Chrome enhancement assignment for **Lunch Lotto** (forked), a Chrome extension designed to take the guesswork out of choosing what to eat for lunch, for CIS 3500 at the University of Pennsylvania. Taught by Professor Jérémie O. Lumbroso.

This project was created for the **2025 MCIT Hackathon**, with the goal of promoting healthier eating habits while simplifying the decision-making process.  

--- 

## Implemented Features

### 1. Dietary Preference Filtering

The dietary preference feature enhances the app by allowing users to filter restaurant recommendations based on specific dietary needs, making the lunch selection more personalized and inclusive.

#### Key Components
- **UI Selection**: Checkbox options for vegetarian, vegan, gluten-free, and halal preferences
- **Search Integration**: Automatically includes selected dietary terms in the Google Places API query
- **Persistent Settings**: User preferences are saved to Chrome storage for future sessions
- **Visual Design**: Clean, modern styling with interactive hover effects for the options

#### User Flow
1. User accesses settings by clicking the filter icon
2. Selects one or more dietary preferences from the checkboxes
3. Saves settings, triggering a new restaurant search with updated criteria
4. Wheel now contains restaurants matching the selected dietary preferences

#### Benefits
- Makes the app more accessible to users with specific dietary requirements
- Increases relevance of restaurant suggestions
- Reduces the need to manually filter out unsuitable options
- Improves overall user experience with personalized results

### 2. Lunch History Tracking

The history feature creates a timeline of past lunch selections, allowing users to track their dining patterns and easily revisit favorite spots.

#### Key Components
- **Navigation Tab**: Dedicated history section accessible through the main navigation
- **Timeline View**: Chronological list of restaurant selections with dates and times
- **Direct Access**: Links to Google Maps for each historical restaurant
- **Data Management**: Automatic saving of selections
- **History Controls**: Option to clear history and start fresh

#### User Flow
1. User spins the wheel and selects a restaurant
2. Selection is automatically saved to history with timestamp
3. User can access history tab to view all past selections
4. Each history entry displays restaurant name, date/time of selection
5. User can click to view any past restaurant on Google Maps

#### Benefits
- Provides context about past dining choices
- Eliminates the "Where did we go last time?" question
- Makes it easy to return to restaurants previously discovered
- Creates a fun record of lunch adventures over time

Both features enhance the Lunch Lotto extension by making it more personalized, functional, and user-friendly, transforming it from a simple random picker into a comprehensive lunch planning tool.

---  



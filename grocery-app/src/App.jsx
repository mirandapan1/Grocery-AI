import { useState } from "react";
import "./App.css";

function App() {
  const [image, setImage] = useState(null);

  //stated preferences heahhaahahaa
  const [preferences, setPreferences] = useState({
    diet: "",
    mealType: "",
    cookingStyle: "",
    cuisine: "",
    maxTime: ""
  });

  // upload image
  function handleUpload(event) {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImage(imageUrl);
    }
  }


  function handlePreferenceChange(event) {
    const {name, value} = event.target;
    setPreferences({
      ...preferences,
      [name]: value
    });

  }

  return (
    <div className="app">
      <h1>Fridge2Food</h1>
      <p>Upload a fridge photo to start finding recipe ideas.</p>
      {/* image upload hehaha */}
      <input type="file" accept="image/*" onChange={handleUpload} />

      {image && (
        <div>
          <h2>Your Fridge</h2>
          <img src={image} alt="Uploaded fridge" className="preview" />
        </div>
      )}


    {/* preferences section */}

      <div className="preferences">
        <h2>Food Preferences</h2>

        <label>
          Diet:
          <select
            name="diet"
            value={preferences.diet}
            onChange={handlePreferenceChange}

          >
            <option value="">Select</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="high-protein">High Protein</option>
            <option value="gluten-free">Gluten Free</option>
            <option value="any">Any</option>
          </select>
        </label>



        {/* meal type */}
        <label>
          Meal Type:
          <select
            name="mealType"
            value={preferences.mealType}
            onChange={handlePreferenceChange}
          >
            <option value="">Select</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="dessert">Dessert</option>
            <option value="any">Any</option>

          </select>
        </label>

        {/* cooking type */}
        <label>
          Cooking Style:
          <select
            name="cookingStyle"
            value={preferences.cookingStyle}
            onChange={handlePreferenceChange}
          >
            <option value="">Select</option>
            <option value="baked">Baked</option>
            <option value="fried">Fried</option>
            <option value="grilled">Grilled</option>
            <option value="air-fried">Air Fried</option>
            <option value="any">Any</option>
          </select>
        </label>

        <label>
          Cuisine:
          <select
            name="cuisine"
            value={preferences.cuisine}
            onChange={handlePreferenceChange}
          >
            <option value="">Select</option>
            <option value="italian">Italian</option>
            <option value="mexican">Mexican</option>
            <option value="american">American</option>
            <option value="asian">Asian</option>
            <option value="any">Any</option>
          </select>
        </label>

        {/* cooking time */}
        <label>
          Max Cooking Time:
          <select
            name="maxTime"
            value={preferences.maxTime}
            onChange={handlePreferenceChange}
          >
            <option value="">Select</option>
            <option value="15">15 Minutes</option>
            <option value="30">30 Minutes</option>
            <option value="60">1 Hour</option>
            <option value="any">Any</option>
          </select>
        </label>
      </div>

      {/* preview user preferences */}
      <div className="results">
        <h2>Your Preferences</h2>

        <p><strong>Diet:</strong> {preferences.diet}</p>
        <p><strong>Meal Type:</strong> {preferences.mealType}</p>
        <p><strong>Cooking Style:</strong> {preferences.cookingStyle}</p>
        <p><strong>Cuisine:</strong> {preferences.cuisine}</p>
        <p><strong>Max Time:</strong> {preferences.maxTime} mins</p>
      </div>
    </div>


  );


}




export default App;
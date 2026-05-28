hello
import { useState } from "react";
import "./App.css";

function App() {
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null); 
  const [loading, setLoading] = useState(false);
  const [recipeResult, setRecipeResult] = useState("");
  const [preferences, setPreferences] = useState({
    diet: "",
    mealType: "",
    cookingStyle: "",
    cuisine: "",
    maxTime: ""
  });

  // 🛠️ Updated upload function to store the file correctly
  function handleUpload(event) {
    const file = event.target.files[0]; // Captures the single image file
    if (file) {
      setImageFile(file); 
      setImagePreview(URL.createObjectURL(file)); 
    }
  }

  function handlePreferenceChange(event) {
    const { name, value } = event.target;
    setPreferences({ ...preferences, [name]: value });
  }

  // Converts the user's uploaded file into an AI-readable base64 string
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => resolve(fileReader.result);
      fileReader.onerror = (error) => reject(error);
    });
  };

  // Submits the payload over to your native backend port
  async function handleSubmit() {
    setLoading(true);
    setRecipeResult("");

    try {
      let base64Image = null;
      if (imageFile) {
        base64Image = await convertToBase64(imageFile);
      }

      // Combines selections into a highly-descriptive prompt string
      const promptText = `Please give me a recipe based on these preferences: 
        Diet: ${preferences.diet || "Any"}, 
        Meal Type: ${preferences.mealType || "Any"}, 
        Cooking Style: ${preferences.cookingStyle || "Any"}, 
        Cuisine: ${preferences.cuisine || "Any"}, 
        Max Time: ${preferences.maxTime ? preferences.maxTime + " minutes" : "Any"}.`;

      const response = await fetch("/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: base64Image,
          text: promptText
        })
      });

      const data = await response.json();
      if (response.ok) {
        setRecipeResult(data.recipe);
      } else {
        setRecipeResult(`Error: ${data.error || "Failed to generate recipe"}`);
      }
    } catch (err) {
      setRecipeResult(`Error connecting to backend: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <h1>Fridge2Food</h1>
      <p>Upload a fridge photo to start finding recipe ideas.</p>

      <input type="file" accept="image/*" onChange={handleUpload} />
      
      {imagePreview && (
        <div>
          <h2>Your Fridge</h2>
          <img src={imagePreview} alt="Uploaded fridge" className="preview" style={{ maxWidth: '300px', borderRadius: '8px', marginTop: '10px' }} />
        </div>
      )}

      <div className="preferences">
        <h2>Food Preferences</h2>
        <label> Diet: 
          <select name="diet" value={preferences.diet} onChange={handlePreferenceChange}>
            <option value="">Select</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="high-protein">High Protein</option>
            <option value="gluten-free">Gluten Free</option>
            <option value="any">Any</option>
          </select>
        </label>

        <label> Meal Type: 
          <select name="mealType" value={preferences.mealType} onChange={handlePreferenceChange}>
            <option value="">Select</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="dessert">Dessert</option>
            <option value="any">Any</option>
          </select>
        </label>

        <label> Cooking Style: 
          <select name="cookingStyle" value={preferences.cookingStyle} onChange={handlePreferenceChange}>
            <option value="">Select</option>
            <option value="baked">Baked</option>
            <option value="fried">Fried</option>
            <option value="grilled">Grilled</option>
            <option value="air-fried">Air Fried</option>
            <option value="any">Any</option>
          </select>
        </label>

        <label> Cuisine: 
          <select name="cuisine" value={preferences.cuisine} onChange={handlePreferenceChange}>
            <option value="">Select</option>
            <option value="italian">Italian</option>
            <option value="mexican">Mexican</option>
            <option value="american">American</option>
            <option value="asian">Asian</option>
            <option value="any">Any</option>
          </select>
        </label>

        <label> Max Cooking Time: 
          <select name="maxTime" value={preferences.maxTime} onChange={handlePreferenceChange}>
            <option value="">Select</option>
            <option value="15">15 Minutes</option>
            <option value="30">30 Minutes</option>
            <option value="60">1 Hour</option>
            <option value="any">Any</option>
          </select>
        </label>
      </div>

      <div className="results">
        <h2>Your Preferences</h2>
        <p><strong>Diet:</strong> {preferences.diet || "None"}</p>
        <p><strong>Meal Type:</strong> {preferences.mealType || "None"}</p>
        <p><strong>Cooking Style:</strong> {preferences.cookingStyle || "None"}</p>
        <p><strong>Cuisine:</strong> {preferences.cuisine || "None"}</p>
        <p><strong>Max Time:</strong> {preferences.maxTime ? preferences.maxTime + " mins" : "None"}</p>
      </div>

      <button onClick={handleSubmit} disabled={loading} style={{ margin: "20px 0", padding: "12px 24px", cursor: "pointer", fontSize: "16px" }}>
        {loading ? "Analyzing Fridge..." : "Generate Recipe ✨"}
      </button>

      {recipeResult && (
        <div className="recipe-box" style={{ whiteSpace: "pre-line", marginTop: "20px", textAlign: "left", padding: "15px", border: "1px solid #ccc", borderRadius: "8px" }}>
          <h2>Generated Recipe Plan</h2>
          <p>{recipeResult}</p>
        </div>
      )}
    </div>
  );
}

export default App;

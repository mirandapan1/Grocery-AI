import { useState, useEffect } from "react";
import "./App.css";

function App() {
  // nav login
  const [page, setPage] = useState("login");
  const [authMode, setAuthMode] = useState("login");
  const [user, setUser] = useState("");

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
  });

  // fridge
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [manualItems, setManualItems] = useState("");
  const [fridgeItems, setFridgeItems] = useState([]);



  // preferences 
  const [preferences, setPreferences] = useState({
    diet: "",
    mealType: "",
    cookingStyle: "",
    cuisine: "",
    maxTime: ""
  });
  // recipes
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [recipeResult, setRecipeResult] = useState("");

  // saved recipes
  const [saved, setSaved] = useState(() => {
    return JSON.parse(localStorage.getItem("savedRecipes") || "[]");
  });
  useEffect(() => {
    localStorage.setItem("savedRecipes", JSON.stringify(saved));
  }, [saved]);


  // login 
  function handleLogin() {
    if (!loginData.email || !loginData.password) return;

    setUser(loginData.email);
    setPage("home");
  }

  function handleSignup() {
    if (
      !signupData.name ||
      !signupData.email ||
      !signupData.password
    ) {
      return;
    }

    setUser(signupData.name);
    setPage("home");
  }


  // Captures the single image file
  function handleUpload(event) {
    const file = event.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
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

  function handlePreferenceChange(event) {
    const { name, value } = event.target;
    setPreferences({ ...preferences, [name]: value });
  }
  
  function generateRecipes() {
  setRecipes([
    "Chicken Alfredo",
    "Veggie Stir Fry",
    "Beef Tacos" // CHANGE TEMP RECIPES
  ]);
  setPage("recipes");
}




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
      <div className="card">

        {/* login */}
        {page === "login" && (
          <>
            <h1>Fridge2Food</h1>
            <div className="authTabs">
              <button
                className={authMode === "login" ? "activeTab" : ""}
                onClick={() => setAuthMode("login")}
              >
                Sign In
              </button>

              <button
                className={authMode === "signup" ? "activeTab" : ""}
                onClick={() => setAuthMode("signup")}
              >
                Sign Up
              </button>
            </div>
            {authMode === "login" ? (
              <>
                <input
                  type="email"
                  placeholder="Email"
                  value={loginData.email}
                  onChange={(e) =>
                    setLoginData({
                      ...loginData,
                      email: e.target.value,
                    })
                  }
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({
                      ...loginData,
                      password: e.target.value,
                    })
                  }
                />

                <button onClick={handleLogin}>
                  Sign In
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={signupData.name}
                  onChange={(e) =>
                    setSignupData({
                      ...signupData,
                      name: e.target.value,
                    })
                  }
                />

                <input
                  type="email"
                  placeholder="Email"
                  value={signupData.email}
                  onChange={(e) =>
                    setSignupData({
                      ...signupData,
                      email: e.target.value,
                    })
                  }
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={signupData.password}
                  onChange={(e) =>
                    setSignupData({
                      ...signupData,
                      password: e.target.value,
                    })
                  }
                />

                <button onClick={handleSignup}>
                  Create Account
                </button>
              </>
            )}

          </>
        )}


        {/* homepage */}
        {page === "home" && (
          <>
            <h1>Welcome {user}</h1>

            <h2>Saved Recipes</h2>
            {saved.length === 0 && <p>No saved recipes yet.</p>}
            {saved.map((r, i) => (
              <div key={i} className="recipeCard">
                {r}
              </div>
            ))}

            <button className="secondary" onClick={() => setPage("fridge")}>
              Discover Recipes from Your Fridge
            </button>
          </>
        )}

        {/* fridge upload */}
        {page === "fridge" && (
          <>
            <h2>Upload a fridge photo to start finding recipe ideas.</h2>

            <input type="file" accept="image/*" onChange={handleUpload} />

            {imagePreview && (
              <div>
                <h2>Your Fridge</h2>
                <img src={imagePreview} alt="Uploaded fridge" className="preview" style={{ maxWidth: '300px', borderRadius: '8px', marginTop: '10px' }} />
              </div>
            )}
            <input
              placeholder="Manually add items (comma separated)"
              onChange={(e) => setManualItems(e.target.value)}
            />

            <button onClick={analyzeFridge}>
              {loading ? "Scanning..." : "Analyze Fridge"}
            </button>
          </>
        )}
        {/* Preferences */}
        {page === "prefs" && (
          <>
            <div className="preferences">
              <h2>Food Preferences</h2>

              <label>
                Diet
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

              <label>
                Meal Type
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

              <label>
                Cooking Style
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
                Cuisine
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

              <label>
                Max Cooking Time
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

            <div className="results">
              <h2>Your Preferences</h2>
              <p>
                <strong>Diet:</strong> {preferences.diet || "None"}
              </p>
              <p>
                <strong>Meal Type:</strong> {preferences.mealType || "None"}
              </p>
              <p>
                <strong>Cooking Style:</strong> {preferences.cookingStyle || "None"}
              </p>
              <p>
                <strong>Cuisine:</strong> {preferences.cuisine || "None"}
              </p>
              <p>
                <strong>Max Time:</strong>{" "}
                {preferences.maxTime
                  ? preferences.maxTime === "any"
                    ? "Any"
                    : `${preferences.maxTime} mins`
                  : "None"}
              </p>
            </div>

            <button onClick={generateRecipes}>
              Generate Recipes
            </button>
          </>
        )}

        {/* recipes */}
        {page === "recipes" && (
          <>
            <h2>Recipes</h2>

            {recipes.map((r, i) => (
              <div key={i} className="recipeCard">
                <p>{r}</p>
                <button onClick={() => saveRecipe(r)}>Save</button>
              </div>
            ))}

            <button onClick={generateRecipes}>
              Generate More
            </button>

            <button className="secondary" onClick={() => setPage("home")}>
              Back to Home
            </button>
          </>
        )}




      </div>
    </div>
  );

}
export default App;

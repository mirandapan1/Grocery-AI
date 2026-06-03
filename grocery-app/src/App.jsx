import { useState, useEffect } from "react";
import "./App.css";

function App() {
  // nav login
  const [page, setPage] = useState("login");
  const [authMode, setAuthMode] = useState("login");
  const [user, setUser] = useState(null);

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

  const [selectedRecipe, setSelectedRecipe] = useState(null);

  // saved recipes
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    const currentUser = JSON.parse(
      localStorage.getItem("currentUser")
    );

    if (currentUser) {
      setUser(currentUser);
      setPage("home");
    }
  }, []);

  useEffect(() => {
    if (!user?.email) return;

    const userRecipes = JSON.parse(
      localStorage.getItem(`savedRecipes_${user.email}`) || "[]"
    );

    setSaved(userRecipes);
  }, [user]);

  useEffect(() => {
    if (!user?.email) return;

    localStorage.setItem(
      `savedRecipes_${user.email}`,
      JSON.stringify(saved)
    );
  }, [saved, user]);

  // login 
  function handleLogin() {
    if (!loginData.email || !loginData.password) {
      alert("Please enter email and password");
      return;
    }

    const users = JSON.parse(
      localStorage.getItem("users") || "[]"
    );

    const foundUser = users.find(
      (u) =>
        u.email === loginData.email &&
        u.password === loginData.password
    );

    if (!foundUser) {
      alert("Invalid email or password");
      return;
    }

    localStorage.setItem(
      "currentUser",
      JSON.stringify(foundUser)
    );

    setUser(foundUser);
    setPage("home");
  }

  function handleSignup() {
    if (
      !signupData.name ||
      !signupData.email ||
      !signupData.password
    ) {
      alert("Please fill out all fields");
      return;
    }

    const users = JSON.parse(
      localStorage.getItem("users") || "[]"
    );

    const existingUser = users.find(
      (u) => u.email === signupData.email
    );

    if (existingUser) {
      alert("An account with this email already exists");
      return;
    }

    const newUser = {
      name: signupData.name,
      email: signupData.email,
      password: signupData.password,
    };

    users.push(newUser);

    localStorage.setItem(
      "users",
      JSON.stringify(users)
    );

    alert("Account created successfully!");

    setAuthMode("login");

    setSignupData({
      name: "",
      email: "",
      password: "",
    });
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
      const { diet, mealType, cookingStyle, cuisine, maxTime } = preferences;

  if (!diet || !mealType || !cookingStyle || !cuisine || !maxTime) {
    alert("Please complete all preference fields before continuing.");
    return;
  }
    setRecipes([
      {
        title: "Chicken Alfredo",
        ingredients: ["Chicken", "Pasta"],
        directions: "Cook pasta..." // CHANGE TEMP RECIPES
      },
      {
      title: "Veggie Stir Fry",
      ingredients: ["Broccoli", "Carrots", "Soy sauce"],
      directions: ["Chop veggies", "Stir fry", "Add sauce"]
    }
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
  function analyzeFridge() {
    if (!imageFile && !manualItems) {
      return;
    }

    setFridgeItems(manualItems.split(",").map(i => i.trim()));

    setPage("prefs");
  }



  function saveRecipe(recipe) {
    setSaved((prev) => {
      if (prev.includes(recipe)) return prev;

      return [...prev, recipe];
    });
  }


  return (


    <div className="app">
      <div className="card">
        {/* header */}
        <div className="header">
          <h1 className="logo" onClick={() => setPage("home")}>
            Fridge2Food
          </h1>

        </div>




        {/* login */}
        {page === "login" && (
          <div className="authContainer">

            <div className="authLeft">
              <h1 className="brand">Fridge2Food</h1>
              <p>Welcome to Fridge2Food! Discover delicious recipes right from your fridge. No grocery run needed.</p>
            </div>
            <div className="authRight">
              <div className="authCard">
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

              </div>
            </div>
          </div>
        )}


        {/* homepage */}
        {page === "home" && (
          <>
            <h1>Welcome {user?.name}</h1>

            <h2>Saved Recipes</h2>
            {saved.length === 0 && <p>No saved recipes yet.</p>}
            {saved.map((r, i) => (
              <div key={i} className="recipeCard">
                {r}
              </div>
            ))}
            <button
              className="secondary"
              onClick={() => {
                setImageFile(null);
                setImagePreview(null);
                setManualItems("");
                setPage("fridge");
              }}
            >
              Discover Recipes from Your Fridge
            </button>
            <button
              className="danger"
              onClick={() => {
                localStorage.removeItem("currentUser");
                setUser(null);
                setPage("login");
              }}
            >
              Logout
            </button>
          </>
        )}

        {/* fridge upload */}
        {page === "fridge" && (
          <>
            <h2>Upload a fridge photo to start finding recipe ideas.</h2>

            <label className="uploadBtn">
              Take / Upload Photo
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleUpload}
              />
            </label>
            {imagePreview && (
              <div>
                <h2>Your Fridge</h2>
                <img src={imagePreview} alt="Uploaded fridge" className="preview" style={{ maxWidth: '300px', borderRadius: '8px', marginTop: '10px' }} />
              </div>
            )}
            {imagePreview && (
              <input
                placeholder="Manually add items (comma separated)"
                value={manualItems}
                onChange={(e) => setManualItems(e.target.value)}
              />
            )}

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
                <div className="recipeCard" onClick={() => setSelectedRecipe(r)}>
                  <div className="recipeImg"></div>
                  <p>{r}</p>
                </div>
                <button onClick={() => saveRecipe(r)}>Save</button>
              </div>
            ))}
            {selectedRecipe && (
              <div className="recipeModal">
                <div className="recipeModalContent">

                  <button
                    className="closeBtn"
                    onClick={() => setSelectedRecipe(null)}
                  >
                    X
                  </button>

                  <h2>{selectedRecipe.title}</h2>

                  <h3>Ingredients</h3>
                  <ul>
                    {selectedRecipe.ingredients.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>

                  <h3>Directions</h3>
                  <p>{selectedRecipe.directions}</p>

                </div>
              </div>
            )}



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

import { useState } from "react";
import "./App.css";

function App() {
  const [image, setImage] = useState(null);

  function handleUpload(event) {
    const file = event.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImage(imageUrl);
    }
  }

  return (
    <div className="app">
      <h1>Fridge2Food</h1>
      <p>Upload a fridge photo to start finding recipe ideas.</p>

      <input type="file" accept="image/*" onChange={handleUpload} />

      {image && (
        <div>
          <h2>Your Fridge</h2>
          <img src={image} alt="Uploaded fridge" className="preview" />
        </div>
      )}
    </div>
  );
}

export default App;
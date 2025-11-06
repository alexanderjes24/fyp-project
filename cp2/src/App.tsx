
import './App.css'
import Navbar from "./components/Navbar"
import Login from "./routes/Login";
import Home from "./routes/Home";
import { Routes, Route } from "react-router-dom";
function App() {


  return (
    <>
      <div>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/Login" element={<Login />} />
        </Routes>
      </div>

    </>
  )
}

export default App

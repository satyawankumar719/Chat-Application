import { BrowserRouter,Route,Routes } from "react-router-dom";
import { LoginPage } from "./pages/authPages/loginPage";
import SignupPage from "./pages/authPages/signupPage";
function App() {
 
  return(<>
 
  <BrowserRouter>
  <Routes>
    <Route path='/' element={<LoginPage/>}/>
    <Route path='/signup' element={<SignupPage/>}/>
  </Routes>
  
  </BrowserRouter>

  </>

 
  );
}

export default App

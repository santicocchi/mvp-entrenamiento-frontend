import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import RutaProtegida from './components/RutaProtegida';
import Login from './pages/auth/Login';
import Registro from './pages/auth/Registro';
import Deportistas from './pages/entrenador/Deportistas';
import DeportistaDetalle from './pages/entrenador/DeportistaDetalle';
import Catalogo from './pages/entrenador/Catalogo';
import Planes from './pages/entrenador/Planes';
import PlanForm from './pages/entrenador/PlanForm';
import PlanDetalle from './pages/entrenador/PlanDetalle';
import PlanVigente from './pages/deportista/PlanVigente';
import Entrenar from './pages/deportista/Entrenar';
import Sesiones from './pages/deportista/Sesiones';
import Progreso from './pages/deportista/Progreso';
import Mediciones from './pages/deportista/Mediciones';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />

      <Route element={<RutaProtegida rol="ENTRENADOR" />}>
        <Route element={<Layout />}>
          <Route path="/entrenador/deportistas" element={<Deportistas />} />
          <Route path="/entrenador/deportistas/:id" element={<DeportistaDetalle />} />
          <Route path="/entrenador/catalogo" element={<Catalogo />} />
          <Route path="/entrenador/planes" element={<Planes />} />
          <Route path="/entrenador/planes/nuevo" element={<PlanForm />} />
          <Route path="/entrenador/planes/:id" element={<PlanDetalle />} />
          <Route path="/entrenador/planes/:id/editar" element={<PlanForm />} />
        </Route>
      </Route>

      <Route element={<RutaProtegida rol="DEPORTISTA" />}>
        <Route element={<Layout />}>
          <Route path="/deportista/plan" element={<PlanVigente />} />
          <Route path="/deportista/entrenar/:rutinaId" element={<Entrenar />} />
          <Route path="/deportista/sesiones" element={<Sesiones />} />
          <Route path="/deportista/progreso" element={<Progreso />} />
          <Route path="/deportista/mediciones" element={<Mediciones />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

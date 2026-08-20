import "./lena.css";
import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router";
import RouteFallback from "./app/RouteFallback";
import ScrollToTop from "./app/ScrollToTop";
const Home = lazy(() => import("./pages/Home"));
const Services = lazy(() => import("./pages/Services"));
const ServiceDetails = lazy(() => import("./pages/ServiceDetails"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const ProjectDetails = lazy(() => import("./pages/ProjectDetails"));
const About = lazy(() => import("./pages/About"));
const AiSolutions = lazy(() => import("./pages/AiSolutions"));
const Contact = lazy(() => import("./pages/Contact"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProjectsCms = lazy(() => import("./pages/ProjectsCms"));
const Login = lazy(() => import("./pages/Login"));
const NotFound = lazy(() => import("./pages/NotFound"));
export default function App() { return <><ScrollToTop /><Suspense fallback={<RouteFallback />}><Routes><Route path="/" element={<Home />} /><Route path="/services" element={<Services />} /><Route path="/services/:serviceId" element={<ServiceDetails />} /><Route path="/portfolio" element={<Portfolio />} /><Route path="/work/:projectId" element={<ProjectDetails />} /><Route path="/about" element={<About />} /><Route path="/ai-solutions" element={<AiSolutions />} /><Route path="/contact" element={<Contact />} /><Route path="/dashboard" element={<Dashboard />} /><Route path="/dashboard/projects-editor" element={<ProjectsCms />} /><Route path="/login" element={<Login />} /><Route path="*" element={<NotFound />} /></Routes></Suspense></>; }

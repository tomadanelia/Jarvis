import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

/**
 * A layout component that includes the navigation bar and renders the current route's content.
 */
export default function Layout() {
  return (
    <>
      <Navbar />
      <main className="main-container">
        <Outlet />
      </main>
    </>
  );
}